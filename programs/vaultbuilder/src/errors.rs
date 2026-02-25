use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Invalid vault account.")]
    InvalidVault,
    #[msg("Token mint mismatch.")]
    MintMismatch,
    #[msg("Vault ATA mismatch.")]
    VaultAtaMismatch,
    #[msg("Token program mismatch.")]
    TokenProgramMismatch,
    #[msg("Not owner.")]
    NotOwner,
    #[msg("Voucher mint mismatch.")]
    VoucherMintMismatch,
    #[msg("No voucher NFT to redeem.")]
    NoVoucher,
    #[msg("Invalid voucher record.")]
    InvalidVoucherRecord,
    #[msg("Already redeemed.")]
    AlreadyRedeemed,
    #[msg("Amount must be > 0.")]
    InvalidAmount,
}