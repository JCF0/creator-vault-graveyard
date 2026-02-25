use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("GzfCdcY959JzTZMp741SF79eX2YkkYdCv4ZjcwNj5imB");

#[program]
pub mod creator_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::initialize_vault::initialize_vault_handler(ctx)
    }

    pub fn deposit_and_mint_voucher(
        ctx: Context<DepositAndMintVoucher>,
        amount: u64,
    ) -> Result<()> {
        instructions::deposit_and_mint_voucher::deposit_and_mint_voucher_handler(ctx, amount)
    }

    pub fn burn_and_redeem(ctx: Context<BurnAndRedeem>) -> Result<()> {
        instructions::burn_and_redeem::burn_and_redeem_handler(ctx)
    }
}