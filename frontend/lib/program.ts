import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "GzfCdcY959JzTZMp741SF79eX2YkkYdCv4ZjcwNj5imB"
);

export const TOKEN_MINT = new PublicKey(
  "3HuMPYPv2rWxT7vezJbTo46xCbom6GaJYDPb7EVb4qfH"
);

export const TOKEN_DECIMALS = 6;

export const DEVNET_RPC = "https://api.devnet.solana.com";

export const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const explorerTxUrl = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

export const explorerAddrUrl = (addr: string) =>
  `https://explorer.solana.com/address/${addr}?cluster=devnet`;

export const formatTokens = (raw: number | bigint): string => {
  const n = typeof raw === "bigint" ? Number(raw) : raw;
  return (n / 10 ** TOKEN_DECIMALS).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};
