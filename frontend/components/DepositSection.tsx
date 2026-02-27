"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import BN from "bn.js";
import { useAnchorProgram } from "@/lib/useAnchorProgram";
import {
  TOKEN_MINT,
  TOKEN_DECIMALS,
  METADATA_PROGRAM_ID,
  explorerTxUrl,
  explorerAddrUrl,
} from "@/lib/program";
import {
  findCreatorVaultPda,
  getVaultTokenAccount,
  findVoucherRecordPda,
  findMetadataPda,
  findMasterEditionPda,
} from "@/lib/pdas";

export default function DepositSection() {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [txSig, setTxSig] = useState("");
  const [voucherMintAddr, setVoucherMintAddr] = useState("");

  const deposit = async () => {
    if (!program || !publicKey) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setStatus("Enter a valid amount > 0");
      return;
    }

    setStatus("Depositing and minting voucher...");
    try {
      const rawAmount = new BN(Math.round(parsed * 10 ** TOKEN_DECIMALS));
      const [vaultPda] = findCreatorVaultPda(publicKey, TOKEN_MINT);
      const vaultTokenAccount = getVaultTokenAccount(TOKEN_MINT, vaultPda);
      const depositorTokenAccount = getAssociatedTokenAddressSync(
        TOKEN_MINT,
        publicKey
      );

      // Generate new keypair for the voucher mint
      const voucherMint = Keypair.generate();
      const depositorVoucherAta = getAssociatedTokenAddressSync(
        voucherMint.publicKey,
        publicKey
      );
      const [voucherRecord] = findVoucherRecordPda(
        vaultPda,
        voucherMint.publicKey
      );
      const metadata = findMetadataPda(voucherMint.publicKey);
      const masterEdition = findMasterEditionPda(voucherMint.publicKey);

      const sig = await program.methods
        .depositAndMintVoucher(rawAmount)
        .accountsStrict({
          depositor: publicKey,
          creatorVault: vaultPda,
          tokenMint: TOKEN_MINT,
          depositorTokenAccount,
          vaultTokenAccount,
          voucherMint: voucherMint.publicKey,
          depositorVoucherTokenAccount: depositorVoucherAta,
          voucherRecord,
          metadata,
          masterEdition,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([voucherMint])
        .rpc();

      setTxSig(sig);
      setVoucherMintAddr(voucherMint.publicKey.toBase58());
      setStatus("Deposit successful! Voucher NFT minted.");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <section className="border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">2. Deposit</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          placeholder="Amount (CVT tokens)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 flex-1"
          min="0"
          step="any"
        />
        <button
          onClick={deposit}
          disabled={!publicKey || !program}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded font-medium"
        >
          Deposit &amp; Mint Voucher
        </button>
      </div>

      {status && <p className="mt-3 text-sm">{status}</p>}

      {voucherMintAddr && (
        <div className="mt-2 p-3 bg-gray-800 rounded text-sm">
          <p className="font-medium text-yellow-300 mb-1">
            ⚠️ Save this voucher mint address — you need it to redeem!
          </p>
          <p>
            Voucher Mint:{" "}
            <a
              href={explorerAddrUrl(voucherMintAddr)}
              target="_blank"
              className="text-blue-400 underline break-all"
            >
              {voucherMintAddr}
            </a>
          </p>
        </div>
      )}

      {txSig && (
        <p className="mt-1 text-sm">
          Tx:{" "}
          <a
            href={explorerTxUrl(txSig)}
            target="_blank"
            className="text-green-400 underline break-all"
          >
            {txSig}
          </a>
        </p>
      )}
    </section>
  );
}
