# Escrow Marketplace

Premium React + TypeScript frontend for the deployed `EscrowMarketplace` contract on Ethereum Sepolia.

> **Testnet only:** this app is for a university / hackathon-style demonstration. Sepolia ETH has no real monetary value. Never send mainnet funds to the contract.

## What is implemented

- Cinematic, responsive landing page with an animated escrow-flow visual and clearly marked demo content.
- Live marketplace scanning the contract's `jobs(uint256)` mapping from `0` through `nextJobId()` without assuming Solidity mappings are enumerable.
- Search, status filtering, budget sorting, loading, empty, retry, and error states.
- Create-job flow with title-free contract-accurate copy, optional frontend-only category/tags folded into the stored description, strict validation, and `ethers.parseEther` conversion.
- Job detail pages with state-aware client/freelancer/arbitrator actions:
  - `OPEN` → accept for a non-client wallet.
  - `ACCEPTED` → exact-amount funding for the client.
  - `FUNDED` → work CID submission for the assigned freelancer.
  - `SUBMITTED` → approval/release for the client or dispute for either party.
  - `DISPUTED` → arbitrator-only resolution.
- Wallet connection, account changes, chain changes, missing-wallet handling, Sepolia switching, address display, and Etherscan links.
- Wallet-scoped dashboard for created, accepted, awaiting-action, completed, and disputed jobs.
- Admin route with live `DEFAULT_ADMIN_ROLE` checks and `pause()` / `unpause()` actions.
- Reusable UI primitives for navigation, status chips, workflow timelines, transaction state, forms, empty states, and confirmation dialogs.
- Reduced-motion CSS support, visible focus states, semantic labels, and mobile layouts for 375px–1440px widths.
- Shared animated background atmosphere with route-specific lighting, restrained pointer parallax, and an inline SVG escrow explorer mascot.
- Transaction-aware milestone celebrations that only appear after a confirmed receipt; failed or rejected transactions never trigger success feedback.
- Guided three-step job creation flow: describe, budget, and review before the wallet transaction.
- Safe optional IPFS gateway links for recognized CIDs; the app still never uploads files.
- Wallet-scoped local archival for eligible client-owned OPEN jobs. This is not on-chain deletion: the deployed ABI has no delete function, and the job/transaction history remains on Sepolia.

## Contract configuration

The frontend uses the existing deployment constants and ABI in `src/contracts/escrowMarketplace.ts`:

- Network: Ethereum Sepolia
- Chain ID: `11155111`
- Contract: `0xe9E9C73036Dc81710c270B4A6a303622a87f8d06`
- Explorer: `https://sepolia.etherscan.io/address/0xe9E9C73036Dc81710c270B4A6a303622a87f8d06`
- Verified deployment block for bounded event history: `11862969`

The contract stores `description`, `budget`, participants, status, a work submission string, and a dispute flag. It does not expose a created timestamp; the UI says `Timestamp not exposed` rather than inventing one. Work submission is treated as a CID/reference and is not automatically uploaded by this app.

## Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

The default development URL is `http://localhost:5173`.

### Optional environment variable

`VITE_SEPOLIA_RPC_URL` is a public read-only RPC endpoint. It is optional: if omitted, read-only screens use the connected wallet provider when a wallet is available. Do not put private keys, seed phrases, API secrets, or deployer credentials in frontend environment variables.

`VITE_IPFS_GATEWAY_URL` is an optional HTTPS gateway base used only for safe “Open submitted work” links. It defaults to `https://ipfs.io/ipfs` and does not upload or pin content.

The app uses the mapping getter and `nextJobId()` for ordinary job discovery. Terminal release/refund history is queried only when needed, starting at the verified deployment block and in chunks of at most 10,000 blocks so public Sepolia RPC providers are not asked for an oversized log range.

### Local job archival

The deployed contract does not expose a job deletion method. The dashboard therefore offers **Archive locally** only for the connected wallet's own jobs that are still `OPEN`, have the zero freelancer address, have no work submission, and have no dispute flag. The action is stored under a wallet-scoped `localStorage` key and hides the listing from that wallet's dashboard only; it does not alter the contract, remove funds, or erase transaction history. `ACCEPTED`, `FUNDED`, `SUBMITTED`, `DISPUTED`, `RELEASED`, and `REFUNDED` jobs are never eligible. If an archived job changes on-chain, the dashboard makes it visible again automatically.

## Test the complete workflow

1. Install MetaMask and switch it to Ethereum Sepolia.
2. Obtain Sepolia test ETH from a faucet. Do not use mainnet ETH.
3. Connect wallet A and open **Create a job**.
4. Submit a description and positive ETH budget. Creating the job does not fund it.
5. Open the confirmed job page and copy its Etherscan transaction link.
6. Switch to wallet B, open the job, and accept it.
7. Switch back to wallet A and fund it. The UI sends exactly the contract-recorded budget in wei.
8. Switch to wallet B and submit a non-empty IPFS CID/reference.
9. Switch to wallet A and approve/release, or raise a dispute.
10. If using an account with `ARBITRATOR_ROLE`, resolve the dispute in either direction.

### Two-wallet MetaMask procedure

The browser can only have one active MetaMask signer at a time. That is expected: the UI never fakes a second role. Use two separate Sepolia test accounts and switch the active account in MetaMask when the workflow changes hands.

1. Create or select **Wallet A** and **Wallet B** in MetaMask. Keep their seed phrases/private keys private; this app never asks for them.
2. Fund both accounts separately with Sepolia test ETH from an appropriate faucet. Each wallet needs ETH for its own gas. Faucet availability and limits can vary.
3. Connect **Wallet A**. Create a job and wait for the creation receipt. The creation transaction costs gas only; it does not deposit the job budget.
4. From Wallet A's job details page, choose **Fund escrow** and confirm the exact displayed amount. Funding is a separate transaction.
5. Switch MetaMask to **Wallet B**. The app listens for `accountsChanged`, clears the previous account's transaction state, reloads roles/dashboard/job actions, and shows the newly active address.
6. Open the marketplace or the job URL with Wallet B. Accept the open job, wait for confirmation, complete the work outside the app, and submit an existing CID/reference. Submitting a CID does not upload a file.
7. Switch MetaMask back to **Wallet A**. Refresh the job if needed, review the submitted reference, and approve the work. Only the confirmed release event is shown as payment complete.
8. Switch to **Wallet B** again. Refresh the job and wallet balance. The completed job displays the confirmed release transaction and a Sepolia Etherscan link. When the RPC supports historical balance reads, the page also shows the observed balance change around the release block; gas and unrelated activity may be included.

For easier isolation, you can also open the app in a separate browser profile with Wallet B installed. Do not run both profiles as if they were the same wallet, and do not interpret a connected address change as a role switch until MetaMask has actually changed the signer.

Every write displays wallet approval, submission, confirmation, failure, hash, and Sepolia Etherscan states. The smart contract remains the final authority if state or role assumptions are stale.

## Checks

```bash
npm run lint
npm test
npm run build
```

The current frontend test covers bigint ETH formatting, address shortening, and CID validation. No Solidity source or Hardhat test suite was present in the workspace when this frontend was created, so there were no local contract tests to run here; the deployed contract ABI and address were kept intact.

## Future enhancements

- Add event/log pagination or an indexed backend for larger job volumes instead of the bounded mapping scan.
- Add IPFS upload behind an explicit storage provider choice; current UI only accepts an existing CID/reference.
- Add automated browser tests with a wallet mock and responsive visual regression coverage.
- Add transaction history links for every state transition once an indexer or event cache is available.
