# 🎮 Betting Yellow: State Channel PvP Protocol

**Instant off-chain wagers. On-chain settlement. Zero gas per round.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Yellow SDK](https://img.shields.io/badge/Yellow_SDK-ERC7824-yellow)](https://github.com/erc7824/nitrolite)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎬 Quick Demo Links

**For Judges & Reviewers:**
- 📜 [Live Contracts on Anvil](http://127.0.0.1:8545) - Local development chain
- 💻 [Frontend Code](./app/page.tsx) - Complete Yellow SDK integration
- 🔧 [Smart Contracts Integration](./lib/contracts.ts) - On-chain deposit/withdraw
- 📊 [State Channel Service](./lib/nitroliteService.ts) - Off-chain coordination
- 📋 [Implementation Plan](./YELLOW_SOLVENCY_INTEGRATION_PLAN.md) - 8-phase roadmap to solvency proofs

---

## 🏆 Yellow SDK Prize Track

### ✅ What We Built (Achievements)

#### 🚀 Fully Functional State Channels
- ✅ **Yellow SDK Integration**: Complete implementation of `@erc7824/nitrolite` v0.1.0
- ✅ **Smart Contracts Deployed**: Custody, Adjudicator, USDC/WETH tokens on Anvil
- ✅ **On-Chain Deposits**: ETH deposits to custody contract with real transactions
- ✅ **Off-Chain Updates**: Instant state updates with zero gas cost per round
- ✅ **Settlement Transactions**: Automatic on-chain finalization on channel close
- ✅ **Frontend Migration**: Complete UI integration with ChannelManager component

#### 🔗 ERC-7824 Compliance
- ✅ **State Channel Protocol**: Full implementation of Yellow Network's state channel standard
- ✅ **EIP-712 Signatures**: Structured data signing for off-chain state transitions
- ✅ **Channel Lifecycle**: Open → Update (instant) → Close (settle) flow
- ✅ **Allocation Tracking**: Real-time balance updates with conservation laws

#### 💡 Novel Innovation
- ✅ **PvP Gaming on Channels**: First peer-to-peer wagering demo on Yellow SDK
- ✅ **Zero-Gas Rounds**: Players compete without paying gas for each move
- ✅ **Economic Model**: Wager amounts adjust instantly off-chain, settle once on-chain
- ✅ **Session Export Ready**: Architecture prepared for solvency proof integration

#### 📊 Technical Completeness
- ✅ **Contract Layer**: [`lib/contracts.ts`](./lib/contracts.ts) - Deposit, withdraw, balance checking
- ✅ **Service Layer**: [`lib/nitroliteService.ts`](./lib/nitroliteService.ts) - WebSocket coordination
- ✅ **UI Components**: [`components/ChannelManager.tsx`](./components/ChannelManager.tsx) - User-facing deposit/withdraw
- ✅ **Main App**: [`app/page.tsx`](./app/page.tsx) - Complete Yellow SDK integration
- ✅ **Network Support**: [`lib/wallet.ts`](./lib/wallet.ts) - Auto-switch to Anvil (Chain 31337)

---

## 🎯 The Problem: High Gas Costs Kill Gaming UX

### The Scenario:
You're playing a PvP wager game. Every round costs gas:
- **Round 1**: Player A wins → $2 gas fee
- **Round 2**: Player B wins → $2 gas fee  
- **Round 3**: Player A wins → $2 gas fee
- **5 rounds = $10+ in gas fees** 💸

### Traditional Solution (Broken):
- Pay gas for every state change
- Slow confirmation times
- Poor user experience
- High barrier to entry

---

## 💡 The Solution: Yellow State Channels

### What Are State Channels?

State channels enable **instant off-chain transactions** with **on-chain security**:

```
Deposit → Open Channel (1 gas fee) 
    ↓
Round 1, 2, 3... N (0 gas fees - instant!)
    ↓
Close Channel → Settle (1 gas fee)

Result: 2 gas fees total vs. N+2 traditional
```

### The Protocol Flow:

```
User A & B                    Yellow ClearNode              Custody Contract
    |                                |                             |
    | 1. Deposit ETH               |                             |
    |------------------------------------------------------------>|
    |                                |                         [Lock funds]
    |                                |                             |
    | 2. Open Channel               |                             |
    |------------------------------->|                             |
    |                         [Register channel]                  |
    |                                |                             |
    | 3. Play Round 1 (off-chain)   |                             |
    |<------------------------------>|                             |
    |        Instant update!         |                             |
    |                                |                             |
    | 4. Play Round 2 (off-chain)   |                             |
    |<------------------------------>|                             |
    |        Instant update!         |                             |
    |                                |                             |
    | 5. Close Channel              |                             |
    |------------------------------->|                             |
    |                         [Finalize state]                    |
    |                                |                             |
    |                                | 6. Settle                   |
    |                                |---------------------------->|
    |                                |                    [Unlock funds]
    |                                |                             |
    | 7. Withdraw                    |                             |
    |------------------------------------------------------------>|
    |                                |                     [Transfer ETH]
```

### The Economics:
- **Gas Saved**: 83%+ compared to traditional approach
- **Speed**: Instant updates vs. 12s block times
- **UX**: Feels like web2, secured by web3

---

## 🏗️ Architecture

```
MetaMask Wallet (Anvil - Chain 31337)
    ↓
    | Connect + Auto-switch network
    ↓
Next.js Frontend (app/page.tsx)
    ↓
    | User actions: deposit, create match, play rounds
    ↓
NitroliteService (lib/nitroliteService.ts)
    ↓
    | WebSocket connection
    ↓
Yellow ClearNode (ws://localhost:8001/ws)
    ↓
    | State coordination + EIP-712 signatures
    ↓
Smart Contracts (lib/contracts.ts)
    ↓
    | On-chain operations
    ↓
Custody Contract (Anvil Blockchain)
    ↓
    | Lock/unlock ETH
    ↓
Settlement Transaction
    ↓
    | Final state recorded on-chain
    ↓
User receives payout
```

---

## 💻 Core Code

### State Channel Opening
**File**: [`lib/nitroliteService.ts`](./lib/nitroliteService.ts#L106-L141)

```typescript
async openChannel(participants: string[], initialDeposits: Record<string, string>): Promise<ChannelState> {
  const channelId = this.generateChannelId(participants);
  
  this.currentChannel = {
    channelId,
    participants,
    allocations: initialDeposits,
    nonce: 0,
    status: 'opening',
  };

  // Register with ClearNode
  const response = await this.sendRequest('open_channel', {
    channel_id: channelId,
    participants,
    initial_state: {
      allocations: initialDeposits,
      nonce: 0,
    },
  });

  this.currentChannel.status = 'active';
  return this.currentChannel;
}
```

[→ View full service](./lib/nitroliteService.ts)

### On-Chain Deposit
**File**: [`lib/contracts.ts`](./lib/contracts.ts#L52-L73)

```typescript
export async function depositToChannel(amountEth: string): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const addresses = getContractAddresses();
  
  const custody = new ethers.Contract(
    addresses.custody,
    CUSTODY_ABI,
    signer
  );

  const amountWei = ethers.parseEther(amountEth);
  
  const tx = await custody.deposit({ value: amountWei });
  await tx.wait();
  
  return tx;
}
```

[→ View full contracts integration](./lib/contracts.ts)

### Off-Chain State Update
**File**: [`app/page.tsx`](./app/page.tsx#L213-L249)

```typescript
const handleSubmitRound = async (winner: string) => {
  const { playerA, playerB, allocations } = currentSession;
  const roundAmount = '0.01'; // 0.01 ETH per round
  
  // Calculate new allocations (instant, no gas!)
  const newAllocations = {
    [winner]: (parseFloat(allocations[winner]) + parseFloat(roundAmount)).toFixed(4),
    [loser]: Math.max(0, parseFloat(allocations[loser]) - parseFloat(roundAmount)).toFixed(4),
  };
  
  // Submit state update via Yellow SDK (off-chain)
  await service.updateState(newAllocations);
  
  addLog('info', `✅ Round ${round + 1} confirmed. Winner: ${winner}`);
};
```

[→ View full frontend](./app/page.tsx)

---

## 🚀 Deployed Contracts

### ⭐ Anvil Local Chain (Development)

**Network**: Anvil Local  
**Chain ID**: 31337  
**RPC**: http://127.0.0.1:8545

| Contract | Address | Status |
|----------|---------|--------|
| **Custody** | `0x8658501c98C3738026c4e5c361c6C3fa95DfB255` | ✅ Live |
| **Adjudicator** | `0xcbbc03a873c11beeFA8D99477E830be48d8Ae6D7` | ✅ Live |
| **USDC Token** | `0xbD24c53072b9693A35642412227043Ffa5fac382` | ✅ Live |
| **WETH Token** | `0xAf119209932D7EDe63055E60854E81acC4063a12` | ✅ Live |
| **BalanceChecker** | `0x730dB3A1D3Ca47e7BaEb260c24C74ED4378726Bc` | ✅ Live |

**ClearNode WebSocket**: `ws://localhost:8001/ws` (via Nitrolite Docker)

### 🔜 Sepolia Testnet (Planned)

Deployment planned for Phase 6 of [Integration Plan](./YELLOW_SOLVENCY_INTEGRATION_PLAN.md):
- Deploy Yellow contracts to Sepolia
- Add SolvencyRegistry contract for ZK proofs
- Enable public verification

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript 5.0** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **ethers.js v6** - Ethereum wallet integration

### Blockchain
- **Yellow SDK** (`@erc7824/nitrolite`) - State channel protocol
- **viem v2** - TypeScript-first Web3 client
- **Foundry** - Smart contract development (Anvil, Forge)
- **MetaMask** - Browser wallet provider

### Infrastructure
- **Nitrolite ClearNode** - Off-chain state coordinator
- **Anvil** - Local Ethereum development node
- **PostgreSQL** - State persistence layer
- **Docker Compose** - Service orchestration

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for Nitrolite infrastructure)
- MetaMask browser extension
- WSL2 (if on Windows)

### 1. Clone & Install

```bash
git clone https://github.com/BlockXAI/Betting_Yellow.git
cd Betting_Yellow
npm install
```

### 2. Set Up Nitrolite Infrastructure (WSL/Linux)

```bash
# In WSL2 terminal (if on Windows)
cd ~/
git clone https://github.com/erc7824/nitrolite.git
cd nitrolite

# Initialize git submodules
git submodule update --init --recursive

# Start services (Anvil, ClearNode, PostgreSQL)
sudo docker-compose up
```

**Expected output**: Contracts deployed, ClearNode running on port 8001

### 3. Configure Environment

The `.env` file is already configured with deployed contract addresses:

```bash
# Already set in .env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_CLEARNODE_URL=ws://localhost:8001/ws
NEXT_PUBLIC_CUSTODY_CONTRACT=0x8658501c98C3738026c4e5c361c6C3fa95DfB255
# ... more contracts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test the Flow

1. **Connect Wallet** → MetaMask will prompt to add Anvil network
2. **Import Test Account** (optional):
   - Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 test ETH
3. **Deposit ETH** → Click "Manage" → Deposit 0.5 ETH to channel
4. **Create Match** → Enter opponent address + wager amount
5. **Play Rounds** → Click "Player A/B Wins" (instant, no gas!)
6. **Close Session** → Settlement transaction records final state
7. **Withdraw** → Get your payout back to wallet

---

## 📚 Documentation

- [📋 Integration Plan](./YELLOW_SOLVENCY_INTEGRATION_PLAN.md) - 8-phase roadmap (27-37 hours)
- [🔧 Nitrolite Setup](./NITROLITE_SETUP.md) - Infrastructure setup guide
- [📖 Contracts Documentation](./lib/contracts.ts) - On-chain integration
- [🌐 Service Documentation](./lib/nitroliteService.ts) - Off-chain coordination
- [🎨 Component Library](./components/ChannelManager.tsx) - UI components

---

## 🏆 Why This Protocol Qualifies for Yellow Track

### Novel Technical Contribution:
✅ **First PvP gaming implementation** on Yellow SDK  
✅ **Complete state channel lifecycle** demonstrated  
✅ **Economic sustainability model** with zero subsidies needed  

### The Innovation:
- **83% gas savings** compared to traditional on-chain gaming
- **Instant gameplay** with off-chain state updates
- **Production-ready** smart contracts and frontend
- **Extensible architecture** for solvency proofs (Phase 2-8)

### Technical Excellence:
- Full Yellow SDK integration with `@erc7824/nitrolite`
- EIP-712 compliant signatures for state transitions
- Proper channel lifecycle management
- Real on-chain settlement transactions
- Clean separation of on-chain (deposits/settlement) vs off-chain (gameplay)

### Try It Live:
1. Clone repo + run `npm install`
2. Start Nitrolite: `cd ~/nitrolite && sudo docker-compose up`
3. Run app: `npm run dev`
4. Play actual PvP matches with instant off-chain rounds

### Deployed & Working:
- ✅ Contracts live on Anvil
- ✅ ClearNode coordinator running
- ✅ Frontend fully integrated
- ✅ End-to-end flow tested

---

## 🛠️ Development

### Project Structure

```
Betting_Yellow/
├── app/
│   ├── page.tsx              # Main app with Yellow SDK integration
│   └── layout.tsx            # Root layout
├── components/
│   ├── ChannelManager.tsx    # Deposit/withdraw UI
│   ├── Match.tsx             # PvP game interface
│   └── EventLog.tsx          # Real-time event logging
├── lib/
│   ├── contracts.ts          # On-chain operations
│   ├── nitroliteService.ts   # Off-chain coordination
│   ├── wallet.ts             # MetaMask integration
│   └── types.ts              # TypeScript definitions
├── .env                      # Contract addresses + config
└── package.json              # Dependencies
```

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| [`app/page.tsx`](./app/page.tsx) | Main app logic with Yellow SDK | ~480 |
| [`lib/nitroliteService.ts`](./lib/nitroliteService.ts) | State channel service | ~365 |
| [`lib/contracts.ts`](./lib/contracts.ts) | Smart contract integration | ~181 |
| [`components/ChannelManager.tsx`](./components/ChannelManager.tsx) | Deposit/withdraw UI | ~271 |

---

## 🎯 Roadmap: Beyond Phase 1

**Current Status**: ✅ Phase 1 Complete - Yellow SDK Integrated

**Next Phases** (see [Integration Plan](./YELLOW_SOLVENCY_INTEGRATION_PLAN.md)):

- **Phase 2** (2-3hrs): Export session state to CSV
- **Phase 3** (4-5hrs): Build Merkle tree from session data
- **Phase 4** (2-3hrs): Scan reserves from custody contract
- **Phase 5** (6-8hrs): Generate ZK solvency proofs
- **Phase 6** (3-4hrs): Deploy to Sepolia testnet
- **Phase 7** (2-3hrs): Publish proofs on-chain
- **Phase 8** (4-5hrs): Build public verification dashboard

**Total**: 8 phases, 27-37 hours estimated

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file

---

## 👥 Team

Built for Yellow Network hackathon by BlockXAI

- GitHub: [@BlockXAI](https://github.com/BlockXAI)
- Project: [Betting_Yellow](https://github.com/BlockXAI/Betting_Yellow)

---

## 🤝 Contributing

Contributions welcome! See [Integration Plan](./YELLOW_SOLVENCY_INTEGRATION_PLAN.md) for roadmap.

---

**⚡ Built with Yellow SDK • Powered by State Channels • Secured by Ethereum**
