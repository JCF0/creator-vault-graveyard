# Creator Vault – Hybrid Token-NFT Vault (DRiP Track)

## Overview

Creator Vault is a Solana program that enables creators to wrap fungible SPL tokens into voucher NFTs that can later be redeemed 1:1 for the underlying tokens.

It demonstrates a hybrid token–NFT primitive:

- Deposit SPL tokens into a vault
- Mint a voucher NFT representing the deposit
- Burn the voucher NFT to redeem the exact underlying tokens
- Enforce vault binding to prevent misuse

This pattern enables: 

- OTC-style liquidity
- Transferable tokenized claims
- Composable NFT-backed financial primitives
- Locked-asset-backed collectibles

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
- User deposits SPL tokens into the canonical vault ATA
- Program mints a voucher NFT
- Voucher metadata binds NFT to vault + mint

### 3️⃣ Burn & Redeem
- User burns voucher NFT
- Program transfers exact underlying tokens back
- Double-redeem is impossible
- Cross-vault redemption is impossible

---

## Security Properties

- PDA-based vault authority
- Canonical vault ATA enforcement
- Strict SPL mint validation
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

Set cluster:

```bash
solana config set --url https://api.devnet.solana.com
```

Airdrop:
```bash
solana airdrop 2
```

Build + deploy:
```bash
anchor build
anchor deploy --provider.cluster devnet
npm test
```

Smoke tests cover:
- Vault initialization
- Deposit + mint
- Burn + redeem
- Double-redeem failure

---

## What This Demonstrates

- Anchor 0.32 program architecture
- SPL token CPI integration
- PDA-based vault design
- NFT-based token claim mechanics
- Devnet-validated hybrid asset primitive

---

## Future Extensions
- Allowlist mint control
- Tiered vault logic
- Royalty-enabled vouchers
- Marketplace-compatible claim NFTs
- OTC-style composable financial instruments

---

## Author
Built by JCF0 for Solana Graveyard Hack
