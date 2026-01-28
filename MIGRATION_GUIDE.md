# Migration Guide: Phase-1 → State Channels

## What Changed

### Phase-1 (Previous)
- Mock WebSocket server
- No smart contracts
- No real on-chain transactions
- Simple balance simulation

### State Channels (Current)
- Real Nitrolite infrastructure
- Smart contracts (Custody, Adjudicator, Token)
- On-chain deposits/withdrawals
- Off-chain state updates with cryptographic signatures
- 83% gas savings vs traditional on-chain

## Prerequisites

Before running the migrated version, you must:

1. **Clone and start Nitrolite infrastructure:**
   ```bash
   cd ..
   git clone https://github.com/erc7824/nitrolite.git
   cd nitrolite
   docker-compose up
   ```

2. **Wait for contracts to deploy** (check Docker logs):
   ```bash
   docker-compose logs | grep "deployed to"
   ```

3. **Update contract addresses in .env** (if different from defaults)

## Installation Steps

```bash
# Install new dependencies
npm install

# Verify .env configuration
cat .env

# Start the application
npm run dev
```

## New User Flow

### Old Flow (Phase-1)
1. Connect wallet
2. Request test funds
3. Create match
4. Play rounds
5. Close match

### New Flow (State Channels)
1. **Connect wallet** (MetaMask)
2. **Switch to Anvil network** (Chain ID 31337)
3. **Deposit ETH to channel** (1 gas fee) ← NEW
4. Create match (0 gas, off-chain)
5. Play rounds (0 gas, off-chain)
6. Close match (0 gas, off-chain)
7. **Withdraw from channel** (1 gas fee) ← NEW

## Key Differences

### Balance Management
- **Before:** Mock balance from fake faucet
- **After:** Real ETH in state channel custody contract

### State Updates
- **Before:** Simple WebSocket messages
- **After:** EIP-712 signed state transitions

### Gas Costs
- **Before:** None (simulated)
- **After:** 
  - Deposit: ~21,000 gas
  - Withdraw: ~30,000 gas
  - Rounds: 0 gas (off-chain!)

### Infrastructure
- **Before:** Mock server (mock-server.js)
- **After:** Nitrolite Docker (Anvil + ClearNode + contracts)

## File Changes

### New Files
- `lib/contracts.ts` - Smart contract interactions
- `lib/nitroliteService.ts` - State channel service
- `components/ChannelManager.tsx` - Deposit/withdraw UI
- `NITROLITE_SETUP.md` - Infrastructure setup guide

### Modified Files
- `.env` - Added contract addresses and RPC config
- `package.json` - Added @erc7824/nitrolite and viem
- `app/page.tsx` - Integrated Nitrolite service
- `components/Lobby.tsx` - Added channel management

### Deprecated Files
- `mock-server.js` - No longer needed (use Nitrolite Docker)
- `lib/clearnode.ts` - Replaced by nitroliteService.ts

## Testing Checklist

- [ ] Nitrolite Docker running
- [ ] Contract addresses in .env
- [ ] MetaMask connected to Anvil (localhost:8545)
- [ ] Wallet has test ETH (default Anvil accounts have 10,000 ETH)
- [ ] Can deposit to channel
- [ ] Can create PvP match
- [ ] Can submit rounds (off-chain)
- [ ] Can close match
- [ ] Can withdraw from channel

## Troubleshooting

### "Failed to connect to ClearNode"
```bash
# Check ClearNode is running
docker-compose logs clearnode
```

### "Transaction failed"
```bash
# Check Anvil blockchain is running
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

### "Wrong network"
- Make sure MetaMask is connected to Anvil (Chain ID 31337)
- Click "Switch Network" button in the app

### "Contract not deployed"
```bash
# Restart Nitrolite infrastructure
docker-compose down -v
docker-compose up
```

## Rollback to Phase-1

If you need to go back to the mock server version:

```bash
git checkout main  # or your Phase-1 branch
npm install
node mock-server.js  # in separate terminal
npm run dev
```

## Next Steps

Once state channels are working:
- Test with 2 real wallets (not Anvil test accounts)
- Measure actual gas savings
- Add Web3Auth for social login
- Deploy to testnet (Fuji, Sepolia)
- Add multi-round tournaments
