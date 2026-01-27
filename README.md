# Yellow PvP Wager Demo (Phase 1)

A minimal but complete demo showcasing Yellow Network's ClearNode WebSocket API, Unified Balance, and PvP app sessions.

## Features

- Real-time WebSocket Connection to Yellow ClearNode (Sandbox)
- Dynamic Chain Discovery via get_config (no hardcoded contracts)
- Unified Balance Viewer with off-chain balance tracking
- Sandbox Faucet Integration for test funds
- PvP App Sessions (2-player wager game)
- Instant Off-chain State Updates with live allocation tracking
- Session Management (create, join, update, close)
- MetaMask Wallet Connection
- Event Logging for all WebSocket messages

## Tech Stack

- Next.js 14 + TypeScript
- WebSocket for ClearNode communication
- ethers.js for wallet interaction
- TailwindCSS for styling
- Lucide React for icons

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
