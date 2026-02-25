// vaultbuilder/tests/creator_vault.ts
//
// Anchor TS tests for Creator Vault primitive
// - initialize_vault
// - deposit_and_mint_voucher(amount)
// - burn_and_redeem
//
// Run: anchor test
//
// If your program workspace name differs, update:
//   const program = anchor.workspace.Vaultbuilder as Program<any>;

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";

// Metaplex Token Metadata program (we only pass PDAs; no CPI in v1)
const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

function deriveCreatorVaultPda(programId: PublicKey, creator: PublicKey, tokenMint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator_vault"), creator.toBuffer(), tokenMint.toBuffer()],
    programId
  );
}

function deriveVoucherRecordPda(programId: PublicKey, creatorVault: PublicKey, voucherMint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("voucher_record"), creatorVault.toBuffer(), voucherMint.toBuffer()],
    programId
  );
}

function deriveMetadataPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );
}

function deriveMasterEditionPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );
}

describe("creator_vault", () => {
  const provider = new anchor.AnchorProvider(
    new anchor.web3.Connection(
      process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed", confirmTransactionInitialTimeout: 60000 }
    ),
    anchor.AnchorProvider.env().wallet,
    { commitment: "confirmed", preflightCommitment: "confirmed" }
  );
  anchor.setProvider(provider);

  // ⚠️ Update if your workspace name differs
  const program = anchor.workspace.Vaultbuilder as Program<any>;

  it("happy path: init -> deposit+mints voucher -> burn+redeem -> double redeem fails", async () => {
    const depositor = provider.wallet.publicKey;

    // ----------------------------
    // 0) Create fungible SPL mint + fund depositor
    // ----------------------------
    const decimals = 6;

    const fungibleMint = await createMint(
      provider.connection,
      (provider.wallet as any).payer,
      depositor, // mint authority
      depositor, // freeze authority
      decimals
    );

    const depositorFungibleAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      (provider.wallet as any).payer,
      fungibleMint,
      depositor
    );

    const initialMintAmount = BigInt(1_000_000_000); // 1000 tokens @ 6 decimals
    await mintTo(
      provider.connection,
      (provider.wallet as any).payer,
      fungibleMint,
      depositorFungibleAta.address,
      depositor,
      initialMintAmount
    );

    // ----------------------------
    // 1) initialize_vault
    // ----------------------------
    const [creatorVaultPda] = deriveCreatorVaultPda(program.programId, depositor, fungibleMint);

    const vaultFungibleAta = await getAssociatedTokenAddress(
      fungibleMint,
      creatorVaultPda,
      true, // allowOwnerOffCurve (PDA)
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await program.methods
      .initializeVault()
      .accounts({
        creator: depositor,
        tokenMint: fungibleMint,
        creatorVault: creatorVaultPda,
        vaultTokenAccount: vaultFungibleAta,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    // ----------------------------
    // 2) deposit_and_mint_voucher(amount)
    // ----------------------------
    const depositAmount = BigInt(123_000_000); // 123 tokens @ 6 decimals
    const voucherMint = Keypair.generate();

    const [voucherRecordPda] = deriveVoucherRecordPda(program.programId, creatorVaultPda, voucherMint.publicKey);

    const depositorVoucherAta = await getAssociatedTokenAddress(
      voucherMint.publicKey,
      depositor,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [metadataPda] = deriveMetadataPda(voucherMint.publicKey);
    const [masterEditionPda] = deriveMasterEditionPda(voucherMint.publicKey);

    const depositorBalBefore = (await getAccount(provider.connection, depositorFungibleAta.address)).amount;
    let vaultBalBefore: bigint = 0n;
    try {
      vaultBalBefore = (await getAccount(provider.connection, vaultFungibleAta)).amount;
    } catch {
      vaultBalBefore = 0n; // ATA may not exist pre-init in some envs; init creates it
    }

    await program.methods
      .depositAndMintVoucher(new BN(depositAmount.toString()))
      .accounts({
        depositor,
        creatorVault: creatorVaultPda,
        tokenMint: fungibleMint,
        depositorTokenAccount: depositorFungibleAta.address,
        vaultTokenAccount: vaultFungibleAta,

        voucherMint: voucherMint.publicKey,
        depositorVoucherTokenAccount: depositorVoucherAta,
        voucherRecord: voucherRecordPda,

        metadata: metadataPda,
        masterEdition: masterEditionPda,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,

        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,

        tokenProgram: TOKEN_PROGRAM_ID,
        nftTokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([voucherMint])
      .rpc({ commitment: "confirmed" });

    const depositorBalAfterDeposit = (await getAccount(provider.connection, depositorFungibleAta.address)).amount;
    const vaultBalAfterDeposit = (await getAccount(provider.connection, vaultFungibleAta)).amount;

    assert.equal(
      (depositorBalBefore - depositorBalAfterDeposit).toString(),
      depositAmount.toString(),
      "depositor fungible balance should decrease by depositAmount"
    );
    assert.equal(
      (vaultBalAfterDeposit - vaultBalBefore).toString(),
      depositAmount.toString(),
      "vault balance should increase by depositAmount"
    );

    // Voucher NFT should exist (amount == 1)
    const voucherAtaInfo = await getAccount(provider.connection, depositorVoucherAta);
    assert.equal(voucherAtaInfo.amount.toString(), "1", "voucher NFT amount should be 1");

    // ----------------------------
    // 3) burn_and_redeem
    // ----------------------------
    const depositorBalBeforeRedeem = (await getAccount(provider.connection, depositorFungibleAta.address)).amount;
    const vaultBalBeforeRedeem = (await getAccount(provider.connection, vaultFungibleAta)).amount;

    await program.methods
      .burnAndRedeem()
      .accounts({
        redeemer: depositor,
        creatorVault: creatorVaultPda,

        tokenMint: fungibleMint,
        vaultTokenAccount: vaultFungibleAta,
        redeemerTokenAccount: depositorFungibleAta.address,

        voucherMint: voucherMint.publicKey,
        redeemerVoucherTokenAccount: depositorVoucherAta,

        voucherRecord: voucherRecordPda,

        tokenProgram: TOKEN_PROGRAM_ID,
        nftTokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const depositorBalAfterRedeem = (await getAccount(provider.connection, depositorFungibleAta.address)).amount;
    const vaultBalAfterRedeem = (await getAccount(provider.connection, vaultFungibleAta)).amount;

    assert.equal(
      (depositorBalAfterRedeem - depositorBalBeforeRedeem).toString(),
      depositAmount.toString(),
      "depositor fungible balance should increase by depositAmount on redeem"
    );
    assert.equal(
      (vaultBalBeforeRedeem - vaultBalAfterRedeem).toString(),
      depositAmount.toString(),
      "vault balance should decrease by depositAmount on redeem"
    );

    // Voucher NFT should now be burned (amount == 0)
    const voucherAtaAfter = await getAccount(provider.connection, depositorVoucherAta);
    assert.equal(voucherAtaAfter.amount.toString(), "0", "voucher NFT should be burned");

    // ----------------------------
    // 4) double redeem should fail
    // ----------------------------
    let threw = false;
    try {
      await program.methods
        .burnAndRedeem()
        .accounts({
          redeemer: depositor,
          creatorVault: creatorVaultPda,

          tokenMint: fungibleMint,
          vaultTokenAccount: vaultFungibleAta,
          redeemerTokenAccount: depositorFungibleAta.address,

          voucherMint: voucherMint.publicKey,
          redeemerVoucherTokenAccount: depositorVoucherAta,

          voucherRecord: voucherRecordPda,

          tokenProgram: TOKEN_PROGRAM_ID,
          nftTokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" });
    } catch {
      threw = true;
    }
    assert.isTrue(threw, "double redeem should throw");
  });
});