"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useAnchorProgram } from "@/lib/useAnchorProgram";
import { TOKEN_MINT, explorerTxUrl, explorerAddrUrl } from "@/lib/program";
import { findCreatorVaultPda, getVaultTokenAccount } from "@/lib/pdas";

export default function VaultSection() {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [status, setStatus] = useState("");
  const [vaultAddr, setVaultAddr] = useState("");
  const [txSig, setTxSig] = useState("");

  const initializeVault = async () => {
    if (!program || !publicKey) return;
    setStatus("Initializing vault...");
    try {
      const [vaultPda] = findCreatorVaultPda(publicKey, TOKEN_MINT);
      const vaultTokenAccount = getVaultTokenAccount(TOKEN_MINT, vaultPda);

      const sig = await program.methods
        .initializeVault()
        .accountsStrict({
          creator: publicKey,
          tokenMint: TOKEN_MINT,
          creatorVault: vaultPda,
          vaultTokenAccount,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setVaultAddr(vaultPda.toBase58());
      setTxSig(sig);
      setStatus("Vault initialized!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <section className="border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">1. Vault</h2>
      <p className="text-sm text-gray-400 mb-2">
        Deposit Mint:{" "}
        <a
          href={explorerAddrUrl(TOKEN_MINT.toBase58())}
          target="_blank"
          className="text-blue-400 underline break-all"
        >
          {TOKEN_MINT.toBase58()}
        </a>
      </p>

      <button
        onClick={initializeVault}
        disabled={!publicKey || !program}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded font-medium"
      >
        Initialize Vault
      </button>

      {status && <p className="mt-3 text-sm">{status}</p>}

      {vaultAddr && (
        <p className="mt-2 text-sm">
          Vault PDA:{" "}
          <a
            href={explorerAddrUrl(vaultAddr)}
            target="_blank"
            className="text-blue-400 underline break-all"
          >
            {vaultAddr}
          </a>
        </p>
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
