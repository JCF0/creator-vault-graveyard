"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "./program";
import idl from "./idl.json";

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    // Use the IDL as-is (Anchor 0.30+ IDL format)
    return new Program(idl as any, provider);
  }, [connection, wallet]);

  return { program, connection };
}
