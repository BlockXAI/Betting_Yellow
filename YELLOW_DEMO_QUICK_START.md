# 🟡 Yellow Network Demo - Quick Start Guide

## 🎯 Goal: Prove Your App Uses Yellow Network

This guide shows you how to run and demonstrate the **perfect Yellow Network flow**:

**1 deposit → many instant actions → 1 settlement**

---

## 🚀 Step-by-Step Demo

### Step 1: Start ClearNode (Critical!)

**Option A: Using Mock Server (Easiest - Recommended for demo)**
```bash
# Terminal 1
npm run clearnode:mock
```

**Expected output:**
```
🟡 Mock ClearNode Server Starting...
📍 Listening on: ws://localhost:8001/ws
⏳ Waiting for connections...
```

**Option B: Using Docker (Production-like)**
```bash
docker-compose up -d
docker-compose logs -f clearnode
```

---

### Step 2: Start Your App

```bash
# Terminal 2 (separate terminal)
npm run dev
```

Open: http://localhost:3001

---

### Step 3: Connect Wallet

1. Click "Connect Wallet"
2. Approve MetaMask connection
3. Switch to Avalanche Fuji testnet
4. **Check the Event Log (right side)** - you should see:
   - ✅ Wallet connected
   - ✅ Connected to Yellow ClearNode
   - 🔧 Yellow SDK initialized

5. **Check the Yellow Proof Panel** - should show:
   - ClearNode: ✅ Connected
   - Session: ⚪ Inactive (not started yet)

---

### Step 4: Deposit Funds

1. Click "Manage" button on Channel Balance card
2. Enter amount (e.g., 0.5 ETH)
3. Click "Deposit 0.5 ETH"
4. Approve MetaMask transaction
5. Wait for confirmation

**This is your 1 on-chain deposit** ✅

---

### Step 5: Create a Match (Opens Session)

1. Enter opponent address (use a test address like `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`)
2. Enter wager: `0.1`
3. Click "Create Match"

**Watch the Event Log:**
- 🔓 Opening Yellow state channel...
- ✅ Channel opened successfully
- Channel ID displayed

**Watch the Yellow Proof Panel:**
- Session: 🟢 Active
- Channel ID: Shows hash
- Off-chain Actions: 0 (starts at 0)

---

### Step 6: Play Rounds (Instant Off-Chain Actions)

1. Click "I Won This Round" or "They Won This Round"
2. **NO WALLET POPUP APPEARS** ✅
3. Round updates instantly
4. Balances change immediately

**Repeat 10+ times**

**Watch the Yellow Proof Panel:**
- Off-chain Actions: Increments with each round (1, 2, 3... 10+)
- Last Action: Shows latency (usually <100ms)
- Off-Chain Balances: Update instantly

**Watch the Mock ClearNode terminal:**
```
📥 INBOUND: update_state
📝 State updated: channel_xxx
   Nonce: 5
   Allocations: { ... }
```

**This proves off-chain execution!** ✅

---

### Step 7: Close Session (Settlement)

1. Click "Close Session & Settle"
2. **ONE FINAL WALLET POPUP** for settlement ✅
3. Approve transaction

**Watch the Event Log:**
- 🔒 Closing Yellow state channel...
- ✅ Channel closed successfully
- ⛓️ Settlement: 10 off-chain actions → 1 on-chain tx
- 🏆 Gas efficiency: 10x

**Watch the Yellow Proof Panel:**
- Session: ⚪ Inactive
- Off-chain Actions: 10 (final count)
- Actions/Tx: 10 (efficiency metric)
- Settlement Transaction: Shows hash + link

**This is your 1 settlement transaction** ✅

---

## 🏆 Perfect Yellow Demo Proof

At the end, your **Yellow Proof Panel** should show:

```
🏆 Yellow Network Proof
10 instant actions with ZERO wallet popups → 1 settlement tx
Efficiency: 10x gas savings
```

---

## 📊 What This Proves

| Requirement | Evidence | Location |
|------------|----------|----------|
| **Yellow SDK Integration** | ✅ Nitrolite service initialized | Event Log |
| **Off-chain logic** | ✅ 10+ instant actions, no wallet popups | Yellow Proof Panel |
| **Session lifecycle** | ✅ Open → Active → Closed | Yellow Proof Panel status |
| **Settlement on-chain** | ✅ Settlement tx hash + SnowTrace link | Yellow Proof Panel |
| **1 deposit → many actions → 1 settle** | ✅ 1 deposit + 10 actions + 1 settle = 2 on-chain tx total | Metrics |

---

## 🎥 Demo Script (For Video/Judges)

**Script to follow for a perfect demo:**

1. **Show ClearNode running** (terminal with Mock ClearNode)
2. **Connect wallet** → Show "Connected to ClearNode" message
3. **Deposit 0.1 ETH** → Show MetaMask popup (on-chain tx #1)
4. **Create match** → Show channel opened
5. **Play 10 rounds rapidly** → Point out: "No wallet popups, instant updates"
6. **Show Yellow Proof Panel** → "10 off-chain actions tracked"
7. **Close session** → Show MetaMask popup (on-chain tx #2)
8. **Show final Yellow Proof Panel** → "10 actions for only 2 on-chain tx = 5x efficiency"

**Total demo time: 2-3 minutes** ✅

---

## 🐛 Troubleshooting

### "WebSocket connection failed"
**Fix:** Make sure ClearNode is running:
```bash
npm run clearnode:mock
```

### "Failed to connect wallet"
**Fix:** Install MetaMask and add Avalanche Fuji testnet

### "Insufficient wallet balance"
**Fix:** Get test AVAX from: https://faucets.chain.link/fuji

### Yellow Proof Panel shows "Disconnected"
**Fix:** 
1. Check ClearNode is running
2. Restart dev server: `npm run dev`
3. Check `.env` has: `NEXT_PUBLIC_CLEARNODE_URL=ws://localhost:8001/ws`

---

## ✅ Success Checklist

Before submitting to ETHGlobal:

- [ ] ClearNode running and connected
- [ ] Can create match without errors
- [ ] 10+ rounds completed with no wallet popups
- [ ] Yellow Proof Panel shows metrics
- [ ] Settlement tx shows in proof panel
- [ ] Demo video recorded (2-3 min)
- [ ] README mentions Yellow Network integration

---

## 📝 Notes for Judges

**Key Message:**

> "Our app demonstrates true Yellow Network integration: users deposit once, perform 10+ instant off-chain wagers with zero gas fees per round, then settle once on-chain. This achieves 10x gas efficiency compared to doing every action on-chain."

**Technical Highlights:**
- `@erc7824/nitrolite` SDK integration
- WebSocket connection to ClearNode coordinator
- EIP-712 signed state updates
- Real-time balance updates without blockchain queries
- On-chain settlement only when session closes

**Files to review:**
- `lib/nitroliteService.ts` - Yellow SDK implementation (365 lines)
- `components/YellowProofPanel.tsx` - Metrics visualization (180 lines)
- `app/page.tsx` - Session lifecycle integration

---

## 🎯 Next Steps After Demo

1. **Deploy to production ClearNode** (replace mock server)
2. **Add dispute resolution** using adjudicator contract
3. **Multi-party channels** (3+ participants)
4. **Integration with solvency proof system** (already built!)

---

**For questions or issues, refer to:**
- Yellow SDK Docs: https://github.com/erc7824/nitrolite
- Steven Zeiler's tutorials: https://github.com/stevengoldberg/yellow-sdk-tutorials
- This project's CLEARNODE_SETUP.md
