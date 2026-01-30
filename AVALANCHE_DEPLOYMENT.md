# 🔺 Avalanche Deployment Guide

Complete guide for deploying Yellow Network state channel contracts to Avalanche Fuji testnet.

---

## 🎯 Overview

This guide covers:
1. Setting up Avalanche Fuji testnet environment
2. Getting testnet AVAX tokens
3. Deploying Yellow Network contracts (Custody, Adjudicator, Tokens)
4. Configuring the frontend for Avalanche
5. Testing the complete flow

---

## 📋 Prerequisites

### Required Tools
- Node.js 18+ and npm
- MetaMask browser extension
- Foundry (for contract deployment)
- Git

### Install Foundry
```bash
# Install Foundry (includes forge, cast, anvil)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

---

## 🔑 Step 1: Get Avalanche Fuji Testnet AVAX

### Option A: ChainLink Faucet (Recommended)
1. Visit: https://faucets.chain.link/fuji
2. Connect MetaMask wallet
3. Request testnet AVAX (0.5 AVAX per request)
4. Wait ~30 seconds for confirmation

### Option B: Official Avalanche Faucet
1. Visit: https://core.app/tools/testnet-faucet/
2. Connect Core wallet or enter address
3. Complete CAPTCHA
4. Receive 2 AVAX for testing

### Verify Balance
```bash
# Check balance via RPC
cast balance <YOUR_ADDRESS> --rpc-url https://api.avax-test.network/ext/bc/C/rpc

# Or check on SnowTrace
# https://testnet.snowtrace.io/address/<YOUR_ADDRESS>
```

---

## 🏗️ Step 2: Clone and Prepare Nitrolite Contracts

### Clone Nitrolite Repository
```bash
cd ~/
git clone https://github.com/erc7824/nitrolite.git
cd nitrolite

# Initialize submodules
git submodule update --init --recursive
```

### Navigate to Contracts
```bash
cd contracts
```

---

## 🚀 Step 3: Deploy Contracts to Avalanche Fuji

### Set Up Environment
Create `.env` file in `contracts/` directory:

```bash
# contracts/.env
PRIVATE_KEY=your_private_key_here
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
SNOWTRACE_API_KEY=your_snowtrace_api_key_optional
```

**⚠️ Security Warning**: Never commit your private key. Add `.env` to `.gitignore`.

### Deploy Custody Contract
```bash
forge create src/Custody.sol:Custody \
  --rpc-url $FUJI_RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --verifier-url https://api.testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

**Save the deployed address**: `Deployed to: 0x...`

### Deploy Adjudicator Contract
```bash
forge create src/Adjudicator.sol:Adjudicator \
  --rpc-url $FUJI_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args <CUSTODY_ADDRESS> \
  --verify \
  --verifier-url https://api.testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

### Deploy Test USDC Token
```bash
forge create src/MockToken.sol:MockToken \
  --rpc-url $FUJI_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "Test USDC" "USDC" 6 \
  --verify \
  --verifier-url https://api.testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

### Deploy Test WETH Token
```bash
forge create src/MockToken.sol:MockToken \
  --rpc-url $FUJI_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "Wrapped Ether" "WETH" 18 \
  --verify \
  --verifier-url https://api.testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

---

## 📝 Step 4: Update Frontend Configuration

### Update `.env` File
In your `Betting_Yellow` project:

```bash
# .env
NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_CHAIN_ID=43113

NEXT_PUBLIC_CLEARNODE_URL=ws://localhost:8001/ws

# Paste your deployed contract addresses
NEXT_PUBLIC_CUSTODY_CONTRACT=0xYourCustodyAddress
NEXT_PUBLIC_ADJUDICATOR_CONTRACT=0xYourAdjudicatorAddress
NEXT_PUBLIC_TOKEN_CONTRACT=0xYourUSDCAddress

NEXT_PUBLIC_WAGER_AMOUNT=0.01
NEXT_PUBLIC_TEST_TOKEN=USDC
```

### Verify Configuration
```bash
# Test RPC connection
curl -X POST https://api.avax-test.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Expected response: {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

---

## 🌐 Step 5: Deploy ClearNode Coordinator (Optional)

### Option A: Use Local ClearNode
If you still want to run ClearNode locally:

```bash
cd ~/nitrolite
sudo docker-compose up clearnode database

# ClearNode will run on ws://localhost:8001/ws
```

### Option B: Deploy ClearNode to Cloud
For production, deploy ClearNode to a cloud provider:

#### Railway Deployment
1. Create account on [Railway](https://railway.app)
2. Deploy from GitHub: `erc7824/nitrolite`
3. Set environment variables:
   - `DATABASE_URL` (PostgreSQL)
   - `RPC_URL=https://api.avax-test.network/ext/bc/C/rpc`
   - `CHAIN_ID=43113`
4. Expose WebSocket port
5. Update `NEXT_PUBLIC_CLEARNODE_URL` with Railway URL

---

## 🧪 Step 6: Test the Deployment

### Start Frontend
```bash
cd ~/Betting_Yellow
npm install
npm run dev
```

### Test Flow
1. **Connect Wallet**
   - Open http://localhost:3000
   - Click "Connect Wallet"
   - MetaMask should prompt to add Avalanche Fuji

2. **Deposit AVAX**
   - Click "Manage" in channel balance card
   - Enter amount (e.g., 0.1 AVAX)
   - Confirm transaction in MetaMask
   - Wait for confirmation (~2 seconds on Fuji)

3. **Create Match**
   - Enter opponent address
   - Set wager amount
   - Click "Create Match"
   - Yellow state channel opens

4. **Play Rounds**
   - Click "Player A Wins" or "Player B Wins"
   - Updates happen instantly (off-chain)
   - No gas fees per round!

5. **Close Session**
   - Click "Close Session"
   - Settlement transaction submitted to Avalanche
   - Check on SnowTrace: https://testnet.snowtrace.io/tx/<TX_HASH>

6. **Verify Session Export**
   - Check logs for "Session exported successfully"
   - Files saved to `solvency/epochs/<epochId>/`

---

## 🔍 Verification

### Verify Contracts on SnowTrace

All deployed contracts should be visible at:
- Custody: https://testnet.snowtrace.io/address/<CUSTODY_ADDRESS>
- Adjudicator: https://testnet.snowtrace.io/address/<ADJUDICATOR_ADDRESS>
- USDC Token: https://testnet.snowtrace.io/address/<TOKEN_ADDRESS>

### Check Contract Source Code
If verified during deployment, source code should be visible on SnowTrace.

### Test Contract Interactions
```bash
# Check custody contract balance
cast call <CUSTODY_ADDRESS> \
  "balanceOf(address)(uint256)" <YOUR_ADDRESS> \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc

# Check USDC balance
cast call <USDC_ADDRESS> \
  "balanceOf(address)(uint256)" <YOUR_ADDRESS> \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc
```

---

## 📊 Network Information

### Avalanche Fuji Testnet Details

| Parameter | Value |
|-----------|-------|
| **Network Name** | Avalanche Fuji Testnet |
| **Chain ID** | 43113 (0xA869 hex) |
| **Currency Symbol** | AVAX |
| **RPC URL** | https://api.avax-test.network/ext/bc/C/rpc |
| **Block Explorer** | https://testnet.snowtrace.io/ |
| **Faucet** | https://faucets.chain.link/fuji |
| **WebSocket URL** | wss://api.avax-test.network/ext/bc/C/ws |

### Gas & Performance

- **Block Time**: ~2 seconds
- **Gas Price**: Dynamic (typically 25-100 gwei)
- **Finality**: 1-2 blocks
- **Throughput**: ~4,500 TPS

---

## 🚨 Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution**: Get more testnet AVAX from faucet

### Issue: "Transaction underpriced"
**Solution**: Increase gas price in MetaMask settings

### Issue: "Contract not deployed"
**Solution**: 
- Check contract addresses in `.env`
- Verify deployment on SnowTrace
- Ensure RPC URL is correct

### Issue: "Failed to connect to ClearNode"
**Solution**:
- Check ClearNode is running: `docker ps`
- Verify WebSocket URL in `.env`
- Check firewall/port forwarding

### Issue: "Network request failed"
**Solution**:
- Verify internet connection
- Check RPC URL is accessible
- Try alternative RPC: `https://rpc.ankr.com/avalanche_fuji`

---

## 💰 Cost Estimation

### Deployment Costs (Fuji Testnet)
- Custody Contract: ~0.05 AVAX
- Adjudicator Contract: ~0.04 AVAX
- Token Contracts (2x): ~0.02 AVAX each
- **Total**: ~0.13 AVAX (free from faucet)

### Transaction Costs (Per User)
- Deposit: ~0.001 AVAX
- Withdraw: ~0.001 AVAX
- Channel Close: ~0.002 AVAX
- **Off-chain Rounds**: 0 AVAX ✅

---

## 🔐 Security Best Practices

1. **Never expose private keys**
   - Use `.env` files (gitignored)
   - Use hardware wallets for mainnet
   - Rotate keys regularly

2. **Test thoroughly on Fuji**
   - Run all user flows
   - Test edge cases
   - Verify gas estimates

3. **Verify all contracts**
   - Use `--verify` flag during deployment
   - Check source code on SnowTrace
   - Audit before mainnet

4. **Monitor deployments**
   - Set up alerts for contract events
   - Track transaction success rates
   - Monitor gas usage

---

## 📚 Additional Resources

- [Avalanche Docs](https://docs.avax.network/)
- [SnowTrace Explorer](https://testnet.snowtrace.io/)
- [Avalanche Faucet](https://faucets.chain.link/fuji)
- [Foundry Book](https://book.getfoundry.sh/)
- [Yellow Network Docs](https://docs.yellow.org/)
- [Nitrolite GitHub](https://github.com/erc7824/nitrolite)

---

## 🎯 Next Steps

After successful Avalanche deployment:

1. ✅ Test complete user flow on Fuji
2. ✅ Verify session export works with Avalanche transactions
3. ✅ Proceed with Phase 3: Merkle tree builder
4. ✅ Deploy to Avalanche Mainnet (C-Chain) when ready

---

**Deployment Status**: Ready for Fuji Testnet  
**Estimated Time**: 30-45 minutes  
**Difficulty**: Intermediate  
**Cost**: Free (testnet AVAX from faucet)
