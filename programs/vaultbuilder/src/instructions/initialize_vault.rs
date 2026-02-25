use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use crate::{constants::CREATOR_VAULT_SPACE, state::CreatorVault};

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        space = CREATOR_VAULT_SPACE,
        seeds = [b"creator_vault", creator.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub creator_vault: Account<'info, CreatorVault>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = token_mint,
        associated_token::authority = creator_vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
}

pub fn initialize_vault_handler(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.creator_vault;
    vault.creator = ctx.accounts.creator.key();
    vault.token_mint = ctx.accounts.token_mint.key();
    vault.token_program = ctx.accounts.token_program.key();
    vault.vault_token_account = ctx.accounts.vault_token_account.key();
    vault.total_deposited = 0;
    vault.vault_bump = ctx.bumps.creator_vault;
    Ok(())
}
