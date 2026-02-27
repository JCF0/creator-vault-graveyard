import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID, METADATA_PROGRAM_ID } from "./program";

/**
 * seeds: ["creator_vault", creator, token_mint]
 */
export function findCreatorVaultPda(
  creator: PublicKey,
  tokenMint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("creator_vault"),
      creator.toBuffer(),
      tokenMint.toBuffer(),
    ],
    PROGRAM_ID
  );
}

/**
 * ATA owned by the vault PDA (allowOwnerOffCurve = true)
 */
export function getVaultTokenAccount(
  tokenMint: PublicKey,
  vaultPda: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(tokenMint, vaultPda, true);
}

/**
 * seeds: ["voucher_record", vault, voucher_mint]
 */
export function findVoucherRecordPda(
  vault: PublicKey,
  voucherMint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("voucher_record"),
      vault.toBuffer(),
      voucherMint.toBuffer(),
    ],
    PROGRAM_ID
  );
}

/**
 * Metaplex metadata PDA
 */
export function findMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return pda;
}

/**
 * Metaplex master edition PDA
 */
export function findMasterEditionPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  );
  return pda;
}
