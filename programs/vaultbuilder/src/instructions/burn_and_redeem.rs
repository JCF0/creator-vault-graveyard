use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::{
    errors::VaultError,
    state::{CreatorVault, VoucherRecord},
};

#[derive(Accounts)]
pub struct BurnAndRedeem<'info> {
    #[account(mut)]
    pub redeemer: Signer<'info>,

    #[account(mut)]
    pub creator_vault: Account<'info, CreatorVault>,

    #[account(constraint = token_mint.key() == creator_vault.token_mint @ VaultError::MintMismatch)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = vault_token_account.key() == creator_vault.vault_token_account @ VaultError::VaultAtaMismatch,
        constraint = vault_token_account.mint == token_mint.key() @ VaultError::MintMismatch
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = redeemer_token_account.owner == redeemer.key() @ VaultError::NotOwner,
        constraint = redeemer_token_account.mint == token_mint.key() @ VaultError::MintMismatch
    )]
    pub redeemer_token_account: Account<'info, TokenAccount>,

    // Voucher NFT side
    #[account(mut)]
    pub voucher_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = redeemer_voucher_token_account.owner == redeemer.key() @ VaultError::NotOwner,
        constraint = redeemer_voucher_token_account.mint == voucher_mint.key() @ VaultError::VoucherMintMismatch,
        constraint = redeemer_voucher_token_account.amount >= 1 @ VaultError::NoVoucher
    )]
    pub redeemer_voucher_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"voucher_record", creator_vault.key().as_ref(), voucher_mint.key().as_ref()],
        bump = voucher_record.voucher_bump,
        constraint = voucher_record.vault == creator_vault.key() @ VaultError::InvalidVoucherRecord,
        constraint = voucher_record.voucher_mint == voucher_mint.key() @ VaultError::InvalidVoucherRecord,
        constraint = !voucher_record.is_redeemed @ VaultError::AlreadyRedeemed
    )]
    pub voucher_record: Account<'info, VoucherRecord>,

    #[account(constraint = token_program.key() == creator_vault.token_program @ VaultError::TokenProgramMismatch)]
    pub token_program: Program<'info, Token>,
}

pub fn burn_and_redeem_handler(ctx: Context<BurnAndRedeem>) -> Result<()> {
    let amount = ctx.accounts.voucher_record.deposit_amount;
    require!(amount > 0, VaultError::InvalidAmount);

    // 1) Burn voucher NFT
    let burn = Burn {
        mint: ctx.accounts.voucher_mint.to_account_info(),
        from: ctx.accounts.redeemer_voucher_token_account.to_account_info(),
        authority: ctx.accounts.redeemer.to_account_info(),
    };
    let burn_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), burn);
    token::burn(burn_ctx, 1)?;

    // 2) Mark redeemed
    ctx.accounts.voucher_record.is_redeemed = true;

    // 3) Transfer fungible tokens out using vault PDA signer
    let vault = &ctx.accounts.creator_vault;
    let vault_seeds: &[&[u8]] = &[
        b"creator_vault",
        vault.creator.as_ref(),
        vault.token_mint.as_ref(),
        &[vault.vault_bump],
    ];
    let signer: &[&[&[u8]]] = &[vault_seeds];

    let xfer = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.redeemer_token_account.to_account_info(),
        authority: ctx.accounts.creator_vault.to_account_info(),
    };
    let xfer_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), xfer, signer);
    token::transfer(xfer_ctx, amount)?;

    ctx.accounts.creator_vault.total_deposited = ctx
        .accounts
        .creator_vault
        .total_deposited
        .saturating_sub(amount);

    Ok(())
}
