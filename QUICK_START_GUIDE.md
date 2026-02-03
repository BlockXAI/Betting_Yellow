# Quick Start Guide - Yellow PvP Wager Demo

## 🚀 For Judges & Reviewers

### Option 1: View Public Dashboard (No Setup Required) ⭐

The **public solvency dashboard** works without any configuration:

1. **Start the app**:
   ```bash
   npm install
   npm run dev
   ```

2. **Navigate to the public dashboard**:
   ```
   http://localhost:3000/solvency
   ```

3. **What you can do**:
   - ✅ View all published proofs (if any exist on-chain)
   - ✅ See proof statistics
   - ✅ Search and filter proofs
   - ✅ Upload and verify inclusion proofs
   - ✅ No wallet, no AVAX, no config needed!

---

### Option 2: Full Demo with State Channels

This requires wallet setup and testnet AVAX.

## 📋 Prerequisites

1. **MetaMask Extension** - [Install here](https://metamask.io/)
2. **Node.js** - Already installed
3. **Testnet AVAX** - Free from faucet (see below)

---

## 🔧 Setup Steps

### Step 1: Get Testnet AVAX (Required)

Your wallet currently has **0 ETH** on Avalanche Fuji. You need testnet AVAX to:
- Deposit to state channels
- Play matches
- Deploy contracts

**Get Free Testnet AVAX**:
1. Visit: https://faucets.chain.link/fuji
2. Connect your wallet: `0x356435901c4bF97E2f695a4377087670201e5588`
3. Request test AVAX (usually 2-5 AVAX)
4. Wait 30-60 seconds for transaction
5. Check MetaMask - you should see your balance

**Alternative Faucets** (if first one doesn't work):
- https://core.app/tools/testnet-faucet/?subnet=c&token=c
- https://faucet.avax.network/ (requires Twitter)

---

### Step 2: Configure Environment

1. **Open `.env` file**

2. **Verify these settings** (already configured):
   ```env
   NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
   NEXT_PUBLIC_CHAIN_ID=43113
   NEXT_PUBLIC_CUSTODY_CONTRACT=0x44b43cd9e870f76ddD3Ab004348aB38a634bD870
   ```

3. **Add your private key** (for deployment only):
   ```env
   PRIVATE_KEY=your_metamask_private_key_here
   ```

   **How to export MetaMask private key**:
   - Open MetaMask
   - Click the 3 dots menu
   - Account Details → Show Private Key
   - Enter password
   - Copy the key (starts with `0x...`)
   - Paste into `.env`

   ⚠️ **SECURITY WARNING**: 
   - Never commit `.env` to git (already in `.gitignore`)
   - Only use testnet wallets with no real funds
   - This key is only for deployment scripts

---

### Step 3: Deploy Solvency Verifier (Optional)

Only needed if you want to test automated proof publishing:

```bash
npm run verifier:deploy
```

**Expected Output**:
```
🚀 SolvencyVerifier Deployment to Avalanche Fuji
✅ Deployed to: 0xYourNewAddress
💰 Cost: ~0.05 AVAX
```

**Then update `.env`**:
```env
NEXT_PUBLIC_VERIFIER_CONTRACT=0xYourNewAddress
```

---

### Step 4: Start the Application

```bash
npm run dev
```

Open http://localhost:3000

---

## 🎮 Using the Application

### Main App Features

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Select MetaMask
   - Approve connection
   - Switch to Avalanche Fuji (automatic prompt)

2. **Deposit to Channel**
   - Click "Manage" under Channel Balance
   - Enter amount (e.g., 0.1 AVAX)
   - Click "Deposit 0.1 ETH"
   - Approve MetaMask transaction (1 gas fee)
   - Wait for confirmation

3. **Play Matches** (Requires ClearNode)
   - Enter opponent address
   - Set wager amount
   - Click "Create Match"
   - Play rounds (instant, no gas!)

### Public Dashboard (`/solvency`)

1. **View Proofs**
   - Navigate to http://localhost:3000/solvency
   - See all published proofs
   - Filter by epoch, merkle root, or publisher

2. **Verify Inclusion**
   - Select an epoch
   - Upload `inclusion_<address>.json`
   - Click "Verify Inclusion"
   - See cryptographic proof result

---

## ❌ Troubleshooting

### Error: "Insufficient wallet balance"

**Cause**: Your wallet has 0 AVAX on Avalanche Fuji

**Solution**: Get testnet AVAX from faucet (see Step 1 above)

---

### Error: "Invalid private key"

**Cause**: Missing or incorrect `PRIVATE_KEY` in `.env`

**Solution**:
1. Export private key from MetaMask
2. Add to `.env`: `PRIVATE_KEY=0x...`
3. Make sure it starts with `0x`
4. No spaces, no quotes

---

### Error: "WebSocket connection failed"

**Cause**: ClearNode not running (expected)

**Solution**: 
- **Option A**: Ignore - public dashboard works without it
- **Option B**: Start ClearNode:
  ```bash
  cd ~/nitrolite
  sudo docker-compose up clearnode database
  ```

See [NITROLITE_SETUP.md](./NITROLITE_SETUP.md) for ClearNode setup.

---

### Error: "Missing revert data" / "Failed to load balances"

**Cause**: Wrong network or contract issues

**Solution**:
1. Check MetaMask is on **Avalanche Fuji** (Chain ID 43113)
2. Make sure you have testnet AVAX
3. Refresh the page
4. Try clearing browser cache

---

### Error: "Filter not found"

**Cause**: Avalanche RPC rate limiting

**Solution**: Ignore - these are warnings from event listeners, not critical errors

---

## 📊 What Works Without ClearNode

Even without ClearNode, these features work:

✅ **Public Dashboard** (`/solvency`)
- View published proofs
- Verify inclusion proofs
- Search and filter
- Statistics

✅ **Manual Proof Pipeline**
```bash
npm run merkle:build epoch_123
npm run reserves:scan epoch_123
npm run proof:generate epoch_123
npm run proof:verify epoch_123
npm run proof:publish epoch_123    # Needs PRIVATE_KEY
npm run proof:verify-onchain epoch_123
```

✅ **On-Chain Verification**
- Read proofs from blockchain
- Verify Merkle roots
- Check solvency status

---

## 🎯 Testing Checklist for Judges

### Phase 8: Public Dashboard (No Setup)
- [ ] Visit `/solvency`
- [ ] See statistics cards
- [ ] View proof list (if any proofs exist)
- [ ] Test search functionality
- [ ] Review code quality

### Full System (With Setup)
- [ ] Get testnet AVAX
- [ ] Connect wallet
- [ ] Deposit to channel
- [ ] Check channel balance
- [ ] Review contract integration
- [ ] Test public dashboard
- [ ] Verify inclusion proof

---

## 📚 Additional Documentation

- [CONSOLE_ERRORS_EXPLAINED.md](./CONSOLE_ERRORS_EXPLAINED.md) - Understanding console warnings
- [PHASE_8_COMPLETE.md](./PHASE_8_COMPLETE.md) - Phase 8 implementation details
- [AVALANCHE_DEPLOYMENT.md](./AVALANCHE_DEPLOYMENT.md) - Contract deployment guide
- [NITROLITE_SETUP.md](./NITROLITE_SETUP.md) - ClearNode coordinator setup

---

## 💡 Quick Command Reference

```bash
# Start app
npm run dev

# Manual proof pipeline
npm run merkle:build <epoch_id>
npm run reserves:scan <epoch_id>
npm run proof:generate <epoch_id>
npm run proof:verify <epoch_id>
npm run proof:publish <epoch_id>
npm run proof:verify-onchain <epoch_id>

# Automated proof pipeline
npm run proof:automate <epoch_id>

# Deploy verifier contract
npm run verifier:deploy
```

---

## 🔗 Useful Links

- **Avalanche Fuji Faucet**: https://faucets.chain.link/fuji
- **SnowTrace Explorer**: https://testnet.snowtrace.io
- **Our Custody Contract**: [0x44b43cd9e870f76ddD3Ab004348aB38a634bD870](https://testnet.snowtrace.io/address/0x44b43cd9e870f76ddD3Ab004348aB38a634bD870)
- **MetaMask Download**: https://metamask.io/

---

## ⚡ TL;DR

**Quickest way to see the project**:
1. `npm install && npm run dev`
2. Go to http://localhost:3000/solvency
3. Public dashboard works with zero setup!

**Full demo**:
1. Get testnet AVAX from faucet
2. Add `PRIVATE_KEY` to `.env`
3. `npm run verifier:deploy`
4. Connect wallet and deposit

---

**Need help?** Check [CONSOLE_ERRORS_EXPLAINED.md](./CONSOLE_ERRORS_EXPLAINED.md) for detailed error solutions.
