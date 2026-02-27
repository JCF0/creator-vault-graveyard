"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { useAnchorProgram } from "@/lib/useAnchorProgram";
import {
  TOKEN_MINT,
  explorerTxUrl,
  formatTokens,
} from "@/lib/program";
import {
  findCreatorVaultPda,
  getVaultTokenAccount,
  findVoucherRecordPda,
} from "@/lib/pdas";

export default function RedeemSection() {
  const { publicKey } = useWallet();
  const { program, connection } = useAnchorProgram();
  const [voucherMintInput, setVoucherMintInput] = useState("");
  const [status, setStatus] = useState("");
  const [txSig, setTxSig] = useState("");
  const [balanceBefore, setBalanceBefore] = useState<string | null>(null);
  const [balanceAfter, setBalanceAfter] = useState<string | null>(null);

  const redeem = async () => {
    if (!program || !publicKey) return;

    let voucherMint: PublicKey;
    try {
      voucherMint = new PublicKey(voucherMintInput.trim());
    } catch {
      setStatus("Invalid voucher mint address");
      return;
    }

    setStatus("Burning voucher and redeeming tokens...");
    try {
      const [vaultPda] = findCreatorVaultPda(publicKey, TOKEN_MINT);
      const vaultTokenAccount = getVaultTokenAccount(TOKEN_MINT, vaultPda);
      const redeemerTokenAccount = getAssociatedTokenAddressSync(
        TOKEN_MINT,
        publicKey
      );
      const redeemerVoucherAta = getAssociatedTokenAddressSync(
        voucherMint,
        publicKey
      );
      const [voucherRecord] = findVoucherRecordPda(vaultPda, voucherMint);

      // Get balance before
      let beforeRaw = BigInt(0);
      try {
        const acct = await getAccount(connection, redeemerTokenAccount);
        beforeRaw = acct.amount;
      } catch {
        // Account may not exist yet
      }
      setBalanceBefore(formatTokens(beforeRaw));

      const sig = await program.methods
        .burnAndRedeem()
        .accountsStrict({
          redeemer: publicKey,
          creatorVault: vaultPda,
          tokenMint: TOKEN_MINT,
          vaultTokenAccount,
          redeemerTokenAccount,
          voucherMint,
          redeemerVoucherTokenAccount: redeemerVoucherAta,
          voucherRecord,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setTxSig(sig);

      // Get balance after (wait for confirmation)
      await connection.confirmTransaction(sig, "confirmed");
      let afterRaw = BigInt(0);
      try {
        const acct = await getAccount(connection, redeemerTokenAccount);
        afterRaw = acct.amount;
      } catch {}
      setBalanceAfter(formatTokens(afterRaw));

      setStatus("Redeem successful! Tokens returned.");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <section className="border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">3. Redeem</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Paste voucher mint address"
          value={voucherMintInput}
          onChange={(e) => setVoucherMintInput(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 flex-1 font-mono text-sm"
        />
        <button
          onClick={redeem}
          disabled={!publicKey || !program}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded font-medium"
        >
          Burn &amp; Redeem
        </button>
      </div>

      {status && <p className="mt-3 text-sm">{status}</p>}

      {balanceBefore !== null && (
        <div className="mt-2 text-sm space-y-1">
          <p>
            Balance before: <span className="text-gray-300">{balanceBefore} CVT</span>
          </p>
          {balanceAfter !== null && (
            <p>
              Balance after:{" "}
              <span className="text-green-400 font-medium">{balanceAfter} CVT</span>
            </p>
          )}
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
