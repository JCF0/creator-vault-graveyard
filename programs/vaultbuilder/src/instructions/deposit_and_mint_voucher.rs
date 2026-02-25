use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, SetAuthority, Token, TokenAccount, Transfer},
};
use anchor_spl::token::spl_token::instruction::AuthorityType;

use crate::{
    constants::VOUCHER_RECORD_SPACE,
    errors::VaultError,
    state::{CreatorVault, VoucherRecord},
};

#[derive(Accounts)]
pub struct DepositAndMintVoucher<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(mut)]
    pub creator_vault: Account<'info, CreatorVault>,

    #[account(constraint = token_mint.key() == creator_vault.token_mint @ VaultError::MintMismatch)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = depositor_token_account.owner == depositor.key() @ VaultError::NotOwner,
        constraint = depositor_token_account.mint == token_mint.key() @ VaultError::MintMismatch
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.key() == creator_vault.vault_token_account @ VaultError::VaultAtaMismatch,
        constraint = vault_token_account.mint == token_mint.key() @ VaultError::MintMismatch
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    // Voucher NFT mint (classic SPL token)
    #[account(
        init,
        payer = depositor,
        mint::decimals = 0,
        mint::authority = depositor
    )]
    pub voucher_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = depositor,
        associated_token::mint = voucher_mint,
        associated_token::authority = depositor
    )]
    pub depositor_voucher_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = depositor,
        space = VOUCHER_RECORD_SPACE,
        seeds = [b"voucher_record", creator_vault.key().as_ref(), voucher_mint.key().as_ref()],
        bump
    )]
    pub voucher_record: Account<'info, VoucherRecord>,

    // Optional Metaplex accounts (unused in v1 handler)
    /// CHECK:
    pub metadata: UncheckedAccount<'info>,
    /// CHECK:
    pub master_edition: UncheckedAccount<'info>,
    /// CHECK:
    pub token_metadata_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(constraint = token_program.key() == creator_vault.token_program @ VaultError::TokenProgramMismatch)]
    pub token_program: Program<'info, Token>,
}

pub fn deposit_and_mint_voucher_handler(ctx: Context<DepositAndMintVoucher>, amount: u64) -> Result<()> {
    require!(amount > 0, VaultError::InvalidAmount);

    // 1) Transfer fungible tokens in
    let cpi_accounts = Transfer {
        from: ctx.accounts.depositor_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.creator_vault.total_deposited = ctx
        .accounts
        .creator_vault
        .total_deposited
        .saturating_add(amount);

    // 2) Write VoucherRecord
    let vr = &mut ctx.accounts.voucher_record;
    vr.vault = ctx.accounts.creator_vault.key();
    vr.voucher_mint = ctx.accounts.voucher_mint.key();
    vr.depositor = ctx.accounts.depositor.key();
    vr.deposit_amount = amount;
    vr.is_redeemed = false;
    vr.voucher_bump = ctx.bumps.voucher_record;

    // 3) Mint voucher NFT (1)
    let mint_to = MintTo {
        mint: ctx.accounts.voucher_mint.to_account_info(),
        to: ctx.accounts.depositor_voucher_token_account.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
    };
    let mint_to_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), mint_to);
    token::mint_to(mint_to_ctx, 1)?;

    // 4) Revoke mint authority
    let set_auth = SetAuthority {
        current_authority: ctx.accounts.depositor.to_account_info(),
        account_or_mint: ctx.accounts.voucher_mint.to_account_info(),
    };
    let set_auth_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), set_auth);
    token::set_authority(set_auth_ctx, AuthorityType::MintTokens, None)?;

    Ok(())
}
