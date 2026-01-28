# Nitrolite Infrastructure Setup

This guide will help you set up the local Nitrolite infrastructure required for state channels.

## Prerequisites

- Docker Desktop installed and running
- Git
- Node.js 18+

## Step 1: Clone and Start Nitrolite

```bash
# In a separate directory (outside this project)
cd ..
git clone https://github.com/erc7824/nitrolite.git
cd nitrolite

# Start the infrastructure (Anvil blockchain + ClearNode + Contracts)
docker-compose up
```

**What this does:**
- 🔗 Starts Anvil (local Ethereum blockchain) on port 8545
- 🌐 Starts ClearNode coordinator on ws://localhost:8000/ws
- 📋 Deploys smart contracts (Custody, Adjudicator, Token)

## Step 2: Get Contract Addresses

After Docker starts, look for deployment logs:

```bash
# In another terminal
docker-compose logs | grep "deployed to"
```

You should see output like:
```
Custody deployed to: 0x8658501c98C3738026c4e5c361c6C3fa95DfB255
Adjudicator deployed to: 0xcbbc03a873c11beeFA8D99477E830be48d8Ae6D7
Token deployed to: 0xbD24c53072b9693A35642412227043Ffa5fac382
```

## Step 3: Update .env File

Copy the contract addresses from the logs and update your `.env` file:

```bash
# In this project directory
cp .env.example .env
# Edit .env with the actual contract addresses
```

Update these lines:
```
NEXT_PUBLIC_CUSTODY_CONTRACT=0x... # from logs
NEXT_PUBLIC_ADJUDICATOR_CONTRACT=0x... # from logs
NEXT_PUBLIC_TOKEN_CONTRACT=0x... # from logs
```

## Step 4: Install Dependencies

```bash
# In this project directory
npm install
```

## Step 5: Start the Demo

```bash
npm run dev
```

Open http://localhost:3000

## Verify Setup

You should see:
- ✅ Anvil running on localhost:8545
- ✅ ClearNode WebSocket on ws://localhost:8000/ws
- ✅ Contracts deployed with addresses in .env
- ✅ Frontend running on localhost:3000

## Troubleshooting

### Docker won't start
- Make sure Docker Desktop is running
- Check ports 8545 and 8000 are not in use

### Contract addresses not found
```bash
docker-compose logs nitrolite-setup
```

### ClearNode not connecting
```bash
docker-compose logs clearnode
```

### Reset everything
```bash
cd nitrolite
docker-compose down -v
docker-compose up
```

## Architecture

```
┌─────────────────────────────────────────┐
│   Your Browser (localhost:3000)         │
│   - React UI                             │
│   - Yellow SDK Client                    │
└──────────┬──────────────────────────────┘
           │
           ├─► Anvil Blockchain (localhost:8545)
           │   - Custody Contract
           │   - Adjudicator Contract  
           │   - Token Contract
           │
           └─► ClearNode (ws://localhost:8000/ws)
               - State channel coordinator
               - Off-chain state synchronization
```

## Next Steps

Once infrastructure is running, the demo flow will be:

1. **Connect Wallet** → MetaMask to Anvil (Chain ID 31337)
2. **Deposit ETH** → Transfer to state channel (1 gas fee)
3. **Create Match** → Off-chain session (0 gas)
4. **Play Rounds** → Off-chain state updates (0 gas each)
5. **Close Match** → Finalize state off-chain (0 gas)
6. **Withdraw** → Settle on-chain (1 gas fee)

**Total gas: 2 transactions** (deposit + withdraw)
**Gas saved: 83%+** vs traditional on-chain betting
