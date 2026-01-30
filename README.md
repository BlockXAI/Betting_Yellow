# Yellow PvP Wager Demo

A production-ready demo showcasing **Yellow Network's State Channels (ERC-7824)** with on-chain smart contract integration for PvP wagering.

## 🎯 Yellow SDK Integration Status

### ✅ Completed Features

**Smart Contract Infrastructure:**
- ✅ Yellow SDK installed (`@erc7824/nitrolite` v0.1.0)
- ✅ Smart contracts deployed on local Anvil blockchain (Chain ID: 31337)
  - Custody Contract: `0x8658501c98C3738026c4e5c361c6C3fa95DfB255`
  - Adjudicator Contract: `0xcbbc03a873c11beeFA8D99477E830be48d8Ae6D7`
  - USDC Token: `0xbD24c53072b9693A35642412227043Ffa5fac382`
  - WETH Token: `0xAf119209932D7EDe63055E60854E81acC4063a12`
- ✅ Contract integration layer (`lib/contracts.ts`) for on-chain operations
- ✅ State channel service (`lib/nitroliteService.ts`) for off-chain coordination
- ✅ Deposit/Withdraw UI component (`components/ChannelManager.tsx`)

**Infrastructure:**
- ✅ Nitrolite ClearNode coordinator running locally (WebSocket: `ws://localhost:8001/ws`)
- ✅ Anvil local blockchain (RPC: `http://127.0.0.1:8545`)
- ✅ PostgreSQL database for state persistence
- ✅ Environment configuration with contract addresses

### 🔄 In Progress

- Frontend migration from Phase-1 to full state channel implementation
- Integration of `NitroliteService` into `app/page.tsx`
- On-chain deposit/withdrawal flows in UI

## Features

**Phase 1 (Current - Sandbox Integration):**
- Real-time WebSocket Connection to Yellow ClearNode (Sandbox)
- Dynamic Chain Discovery via get_config (no hardcoded contracts)
- Unified Balance Viewer with off-chain balance tracking
- Sandbox Faucet Integration for test funds
- PvP App Sessions (2-player wager game)
- Instant Off-chain State Updates with live allocation tracking
- Session Management (create, join, update, close)
- MetaMask Wallet Connection
- Event Logging for all WebSocket messages

**Phase 2 (Ready for Activation - Yellow SDK + On-Chain):**
- ERC-7824 State Channels with Yellow SDK
- On-chain ETH deposits to custody contract
- On-chain withdrawals from state channels
- ERC20 token support (USDC/WETH)
- Real smart contract interactions
- Local Nitrolite infrastructure
- Channel balance tracking
- Production-ready contract integrations

## Tech Stack

**Frontend:**
- Next.js 14 + TypeScript
- React 18 with hooks
- TailwindCSS for styling
- Lucide React for icons

**Blockchain:**
- Yellow SDK (`@erc7824/nitrolite`) - State channel management
- ethers.js v6 - Wallet interaction and contract calls
- viem v2 - Web3 client for smart contracts
- MetaMask - Wallet provider

**Infrastructure:**
- Nitrolite ClearNode - State channel coordinator
- Anvil - Local Ethereum development blockchain
- PostgreSQL - State persistence
- Docker Compose - Service orchestration

## Getting Started

1. Install Dependencies: npm install
2. Run Development Server: npm run dev
3. Open http://localhost:3000
4. Connect MetaMask wallet
5. Request test funds from faucet
6. Create or join a PvP match
7. Play rounds and watch instant balance updates
8. Close session to finalize

## Message Flow

Connect to ClearNode WebSocket
Call get_config to discover Avalanche contracts
Request test funds via faucet
Create app session for 2 players
Submit state updates per round
Close session and view final payout

## Out of Scope (Phase 1)

- On-chain deposits/withdrawals
- Dispute resolution
- Production security hardening
