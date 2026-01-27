# Yellow PvP Wager Demo - Usage Guide

## Overview

This demo showcases Yellow Network's Phase 1 features:
- Real-time WebSocket connection to ClearNode
- Dynamic chain discovery via `get_config`
- Unified Balance management
- PvP app sessions with instant off-chain state updates

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension installed
- Two wallet addresses for testing (Player A and Player B)

## Installation

```bash
npm install
```

## Running the Demo

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Complete Walkthrough

### Step 1: Connect to ClearNode

The app automatically connects to Yellow's sandbox ClearNode WebSocket endpoint when you open it.

**Expected Result:**
- Green "ClearNode Connected" badge appears
- Event log shows: "Connected to ClearNode successfully"

### Step 2: Dynamic Chain Discovery

Immediately after connection, the app calls `get_config` to discover supported chains.

**Expected Result:**
- Chains dropdown populates (e.g., Avalanche)
- Event log shows: "Detected chains: Avalanche, ... Selected: Avalanche"
- No hardcoded contract addresses in the code

### Step 3: Connect Wallet

Click "Connect Wallet" button to connect MetaMask.

**Expected Result:**
- MetaMask popup appears
- After approval, your address shows in top-right
- Event log shows: "Wallet connected: 0x..."

### Step 4: Get Test Funds

Click "Request Test Funds" in the Unified Balance section.

**Expected Result:**
- Balance updates to show test tokens (e.g., 100 ytest.usd)
- Event log shows: "Faucet request successful"

### Step 5: Create PvP Match

**As Player A:**

1. Ensure you're on the "Create Match" tab
2. Enter opponent address (Player B's wallet address)
3. Set wager amount (e.g., 10)
4. Click "Create Match"

**Expected Result:**
- Session ID appears
- Screen transitions to "Match In Progress"
- Event log shows: "App session created" with sessionId

### Step 6: Join Match (Optional)

**As Player B (in different browser/wallet):**

1. Connect wallet as Player B
2. Get test funds
3. Switch to "Join Match" tab
4. Enter the Session ID from Player A
5. Click "Join Match"

**Expected Result:**
- Match screen appears
- Both players see the same session

### Step 7: Play Rounds

During the match:

1. Select round winner (Player A or Player B)
2. Click "Submit Round Result"
3. Watch balances update instantly

**Expected Result:**
- Winner's balance increases by 5 ytest.usd
- Loser's balance decreases by 5 ytest.usd
- Round number increments
- Event log shows: "Round X submitted. Winner: 0x..."
- Updates happen instantly (off-chain)

### Step 8: Close Session

When done playing:

1. Click "Close Session & Finalize"

**Expected Result:**
- Screen shows "Session Closed"
- Final payout summary displays
- Event log shows: "Session closed successfully"
- Final allocations are shown for both players

### Step 9: Return to Lobby

Click "Back to Lobby" to start a new match.

## Key Features Demonstrated

### 1. Real-time WebSocket Communication

Every action sends/receives messages through the ClearNode WebSocket connection. Check the Event Log to see:

- **Sent** messages (blue): Requests from your app
- **Received** messages (green): Responses from ClearNode
- **Error** messages (red): Any failures
- **Info** messages (gray): System events

### 2. Dynamic Configuration

The app calls `get_config` on startup to discover:

- Supported blockchain chains
- Contract addresses per chain
- ClearNode capabilities

**No hardcoded addresses** - everything is discovered dynamically.

### 3. Unified Balance

Your off-chain balance in Yellow Network:

- View available balance
- Request test funds via faucet (sandbox only)
- Track balance changes after sessions

### 4. App Sessions (PvP)

Off-chain "game rooms" where:

- 2 players participate
- State updates happen instantly
- No gas fees during gameplay
- Final settlement can happen on-chain later (not in Phase 1)

### 5. Instant State Updates

When you submit a round result:

- Balance changes happen immediately
- No blockchain confirmation delay
- ClearNode validates and propagates updates
- Both players see changes in real-time

## Message Flow (Technical)

```
1. connect → ClearNode WebSocket
2. get_config → discover chains & contracts
3. get_balance → fetch Unified Balance
4. faucet_request → get test funds
5. create_app_session → create PvP session
6. join_app_session → opponent joins
7. submit_app_state → update balances per round
8. close_app_session → finalize and close
```

## Troubleshooting

### "WebSocket connection failed"

- Check your internet connection
- Verify sandbox endpoint is accessible
- Check browser console for CORS errors

### "Balance not updating"

- Wait 2-3 seconds after faucet request
- Refresh balance manually by reconnecting
- Check Event Log for error messages

### "Failed to create match"

- Ensure you have sufficient balance
- Verify opponent address is valid
- Check both players have test funds

### MetaMask not connecting

- Ensure MetaMask extension is installed
- Check that you're on a supported network
- Try refreshing the page

## Event Log Interpretation

**Blue (Sent):** Your app sent this request to ClearNode
```json
{
  "method": "create_app_session",
  "params": { ... }
}
```

**Green (Received):** ClearNode responded with this data
```json
{
  "result": {
    "sessionId": "abc123"
  }
}
```

**Red (Error):** Something went wrong
```json
{
  "error": {
    "code": 400,
    "message": "Insufficient balance"
  }
}
```

## Next Steps (Not in Phase 1)

- On-chain deposits from Avalanche
- Withdrawals to Avalanche
- Dispute resolution
- Production security hardening
- Multi-round game logic

## Support

For issues with:
- **Yellow Network:** docs.yellow.org
- **Demo code:** Check GitHub issues
- **WebSocket connection:** Verify sandbox status
