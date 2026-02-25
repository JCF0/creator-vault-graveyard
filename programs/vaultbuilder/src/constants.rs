pub const CREATOR_VAULT_SPACE: usize = 8 + 32 * 4 + 8 + 1; // 145
pub const VOUCHER_RECORD_SPACE: usize = 8 + 32 * 3 + 8 + 1 + 1; // 114

pub const CREATOR_VAULT_SEED: &[u8] = b"creator_vault";
pub const VOUCHER_RECORD_SEED: &[u8] = b"voucher_record";