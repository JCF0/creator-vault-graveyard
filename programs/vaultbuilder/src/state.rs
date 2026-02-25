use anchor_lang::prelude::*;

#[account]
pub struct CreatorVault {
    pub creator: Pubkey,
    pub token_mint: Pubkey,
    pub token_program: Pubkey,       // SPL Token or Token-2022 program id
    pub vault_token_account: Pubkey, // token account owned by vault PDA
    pub total_deposited: u64,
    pub vault_bump: u8,
}

#[account]
pub struct VoucherRecord {
    pub vault: Pubkey,
    pub voucher_mint: Pubkey,
    pub depositor: Pubkey,
    pub deposit_amount: u64,
    pub is_redeemed: bool,
    pub voucher_bump: u8,
}