# Creator Vault – Hybrid Token-NFT Vault (DRiP Track)

## Overview

Creator Vault is a Solana program that enables creators to wrap fungible SPL tokens into voucher NFTs that can later be redeemed 1:1 for the underlying tokens.

It demonstrates a hybrid token–NFT pattern:

- Deposit SPL tokens into a vault
- Mint a voucher NFT representing the deposited amount
- Burn the voucher NFT to redeem the exact underlying tokens
- Prevent double-redeem and cross-vault misuse

This pattern enables OTC-style liquidity, composability, and tokenized claims backed by locked assets.

Built for the **Solana Graveyard Hack – DRiP Track**.

---

## Devnet Deployment

- **Program ID:**  
  `GzfCdcY959JzTZMp741SF79eX2YkkYdCv4ZjcwNj5imB`

- **Deployment TX:**  
  `4QyvnzgRii3ARkPwyCoWk9ke13LCyNxuHZ2S6nSfb1cUxkWds82r5XsFz5V2NCdLJfsAAqQ8Nukf1gZHdJcjjodS`

- **Cluster:** Devnet

---

## Core Flow

### 1️⃣ Initialize Vault
Creates a PDA-backed vault for a specific SPL mint.

### 2️⃣ Deposit & Mint Voucher
- User deposits SPL tokens into the vault’s canonical ATA
- Program mints a voucher NFT representing the deposit
- Voucher metadata encodes vault association

### 3️⃣ Burn & Redeem
- User burns voucher NFT
- Program transfers exact underlying tokens back to user
- Double redeem is prevented
- Cross-vault redeem is prevented

---

## Security Properties

- PDA-based vault authority
- Canonical vault ATA enforcement
- Strict mint matching
- Single-use voucher burn logic
- Double-redeem protection
- Devnet-tested smoke suite

---

## Project Structure
programs/vaultbuilder/
  src/
    instructions/
      initialize_vault.rs
      deposit_and_mint_voucher.rs
      burn_and_redeem.rs
    state.rs
    errors.rs
    constants.rs
tests/
  creator_vault.ts
Anchor.toml
Cargo.toml

---

## Running Tests (Devnet)

Make sure your Solana CLI is pointed to devnet:

```bash
solana config set --url https://api.devnet.solana.com
```

Ensure you have devnet SOL:
```bash
solana airdrop 2
```

Then run:
```bash
anchor build
anchor deploy --provider.cluster devnet
npm test
```

All smoke tests pass:
- init
- deposit + mint voucher
- burn + redeem
- double-redeem fails

---

## What This Demonstrates

This project showcases:
- Anchor 0.32 program architecture
- SPL token CPI usage
- PDA-based vault design
- NFT-based token claim mechanics
- Devnet-tested hybrid asset logic

---

## Future Extensions
- Allowlist-based mint control
- Multiple vault tiers
- On-chain royalty logic
- Marketplace-compatible voucher NFTs
- Composable OTC primitives

---

## Author
Built by JCF0 for Solana Graveyard Hack
