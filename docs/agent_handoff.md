Creator Vault — Agent Handoff Document

Project Context



This project is being built for the Solana Graveyard Hack under the DRiP NFT track.



DRiP is exploring hybrid NFT standards.



This project does not compete with that standard.



Instead, it introduces:



A minimal vault primitive that allows any SPL token to be wrapped into redeemable NFT vouchers.



This is complementary infrastructure.



Core Objective



Build a minimal, secure Anchor program that:



Allows a creator to initialize a vault tied to a specific SPL or Token-2022 mint.



Allows deposits of arbitrary token amounts.



Mints a 1-of-1 voucher NFT representing the deposit.



Allows voucher holders to burn the NFT to redeem the exact deposited amount.



Prevents double redemption.



Uses a VoucherRecord PDA as the sole source of truth for redemption amount.



Non-Negotiable Design Locks (v1)



These decisions are locked.



1\. One Vault Per Creator Per Token Mint



Vault PDA Seeds:



\["creator\_vault", creator\_pubkey, token\_mint]



Vault Stores:



creator



token\_mint



token\_program



vault\_token\_account



total\_deposited



vault\_bump



2\. VoucherRecord PDA



Seeds:



\["voucher\_record", creator\_vault\_pda, voucher\_mint]



Stores:



vault



voucher\_mint



depositor



deposit\_amount



is\_redeemed



voucher\_bump



Redemption amount must always be read from this PDA.



Never trust metadata for redemption logic.



3\. Token Support

Fungible Side



SPL Token OR Token-2022



Basic transfers only



No extension handling



token\_program must match stored vault.token\_program



Voucher NFT Side



Classic SPL Token



mint::decimals = 0



Mint exactly 1 token



Revoke mint authority after minting



4\. Instruction Flow

initialize\_vault



Derive vault PDA



Create vault ATA owned by vault PDA



Store token\_program



deposit\_and\_mint\_voucher(amount)



Require amount > 0



Transfer fungible tokens into vault ATA



Create voucher\_mint



Mint 1 NFT to depositor



Create VoucherRecord



Revoke mint authority



burn\_and\_redeem



Require voucher\_record.is\_redeemed == false



Require redeemer owns voucher NFT



Burn NFT



Mark voucher\_record.is\_redeemed = true



Transfer deposit\_amount from vault ATA to redeemer



Invariants



These must always hold:



Vault token program cannot change after initialization.



VoucherRecord must match vault + voucher\_mint.



Redeem only possible once.



Redeemer must own voucher NFT.



Token mint in transfer must equal vault.token\_mint.



Fungible token program must equal vault.token\_program.



Known Gotchas



Token-2022 ATA derivation must include token\_program.



transfer\_checked requires mint decimals.



PDA signer seeds must use stored vault fields (not passed accounts).



Always use token\_interface for fungible transfers.



Voucher NFT mint authority must be revoked after minting 1.



Testing Requirements



Use Anchor TypeScript tests.



Tests must cover:



Create fungible mint



Mint tokens to depositor



Initialize vault



Deposit and mint voucher



Burn and redeem



Attempt double redeem (must fail)



Tests must verify:



Balance deltas correct



VoucherRecord.is\_redeemed toggles



Voucher NFT amount becomes 0



Vault accounting updates



Build Order (Strict)

Phase 1



Program compiles



SPL Token path works



TS tests pass



Phase 2



Flip to Token-2022



Fix ATA/token\_program issues



Tests pass again



Phase 3



Minimal frontend (3 buttons only):



Initialize Vault



Deposit + Mint Voucher



Burn + Redeem



Phase 4 (Optional)



Metaplex metadata CPI (only if time remains)



What This Project Is NOT



Not a new NFT standard



Not a hybrid NFT implementation



Not a launchpad



Not a memecoin wrapper



Not yield-bearing



Not speculative tokenomics



It is:



A vault primitive for embedding redeemable value into NFT drops.



Demo Narrative (Video)



DRiP is exploring hybrid NFT standards.



This project introduces a complementary vault layer.



Creator initializes vault with any SPL token.



Creator deposits tokens.



Voucher NFT minted representing claim.



Voucher can be burned to redeem exact amount.



This enables programmable, redeemable value inside NFT drops.



Definition of Done



anchor test passes fully



Deployed to devnet



Devnet transaction links included in README



Demo video recorded (max 3 minutes)



Repo clean and organized



Instructions documented in README



Submission Positioning



Creator Vault is a minimal on-chain primitive that allows any SPL token to be wrapped into redeemable NFT vouchers. It complements emerging hybrid NFT standards by introducing a simple vault-based redemption layer compatible with existing NFT implementations.

