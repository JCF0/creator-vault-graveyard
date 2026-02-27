"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

// Dynamic import to avoid SSR issues with wallet adapter
const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

import VaultSection from "@/components/VaultSection";
import DepositSection from "@/components/DepositSection";
import RedeemSection from "@/components/RedeemSection";

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🔐 Creator Vault Demo</h1>
        <WalletMultiButtonDynamic />
      </div>

      <p className="text-sm text-gray-400">
        Devnet only. Connect a Phantom wallet set to devnet.
      </p>

      {publicKey ? (
        <div className="space-y-6">
          <VaultSection />
          <DepositSection />
          <RedeemSection />
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          Connect your wallet to get started.
        </div>
      )}
    </main>
  );
}
