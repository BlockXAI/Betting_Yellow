# Phase-1 Sandbox Test Script - 2-Wallet Manual Validation

**Mode:** Evidence Capture & Launch Readiness  
**Test Type:** Manual 2-Wallet Flow  
**Target:** Yellow ClearNode Sandbox  

---

## Pre-Test Setup

### Requirements
- [ ] Two separate browsers OR two incognito windows
- [ ] Two MetaMask wallets with different addresses
- [ ] Browser console open in BOTH windows (F12 → Console tab)
- [ ] Event Log visible in UI for BOTH windows
- [ ] Network stable

### Wallet Preparation
```
Browser A (Player A): Wallet Address 0x742d...bEb
Browser B (Player B): Wallet Address 0x8e4C...56c
```

**Important:** Copy both addresses to notepad for easy access.

---

## Test Flow Overview

```
Player A                          Player B
├─ Step 1-6: Setup               ├─ Step 7-9: Setup
├─ Step 10: Create Session       │
├─ Step 11: Share SessionId ────→│
│                                ├─ Step 12-13: Join Session
├─ Step 14-18: Play Rounds      ├─ Step 14-18: Play Rounds
├─ Step 19: Close Session        │
└─ Step 20: Verify Payout       └─ Step 20: Verify Payout
```

---

## 🔵 Player A - Steps 1-6: Initial Setup

### Step 1: Launch Application (Player A)

**Action:**
```bash
npm run dev
```
Open Browser A → `http://localhost:3000`

**Visual Confirmation:**
- [ ] Page loads with title "Yellow PvP Wager Demo"
- [ ] Subtitle: "Phase 1 - ClearNode WebSocket + Unified Balance"
- [ ] "Connect Wallet" button visible
- [ ] WebSocket status shows disconnected/connecting

**Expected Logs (Browser Console):**
```
[WebSocket] Connecting to wss://sandbox.clearnode.yellow.com
[WebSocket] Connection established
```

**Event Log Should Show:**
```
info | WebSocket connected to sandbox
```

**🚨 Failure Signature:**
```
❌ WebSocket error: Connection refused
❌ Failed to connect: timeout after 10s
```

---

### Step 2: Auto get_config (Player A)

**Trigger:** Automatic on WebSocket connect

**Expected Outbound Message (Browser Console):**
```json
▶ OUTBOUND [get_config]
{
  "raw": "{\"id\":\"1\",\"method\":\"get_config\",\"params\":{}}",
  "parsed": {
    "id": "1",
    "method": "get_config",
    "params": {}
  }
}
```

**Expected Inbound Response:**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"1\",\"result\":{\"chains\":[...]}}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "1",
    "result": {
      "version": "1.0.0",
      "chains": [
        {
          "chainId": "43113",
          "name": "Avalanche Fuji",
          "contracts": { ... }
        }
      ]
    }
  }
}

✅ SUCCESS RESPONSE [id=1]
```

**Visual Confirmation (UI):**
- [ ] Chain selector appears (dropdown or text)
- [ ] Shows "Avalanche Fuji" or "Avalanche" (auto-selected)

**Event Log Proof Line:**
```
info | Detected chains: Avalanche Fuji. Selected: Avalanche Fuji
```

**🚨 Failure Signature:**
```
❌ ERROR RESPONSE [id=1] { "code": 500, "message": "..." }
⚠ PROTOCOL ERROR: Response missing id field
❌ Invalid get_config response: missing chains
```

---

### Step 3: Connect Wallet (Player A)

**Action:** Click "Connect Wallet" button

**Expected Flow:**
1. MetaMask popup appears
2. Select account: `0x742d...bEb`
3. Click "Connect"

**Visual Confirmation:**
- [ ] MetaMask popup closed
- [ ] UI shows: "Connected: 0x742d...bEb" (truncated address)
- [ ] Green indicator appears
- [ ] "Connect Wallet" button disappears

**Event Log Proof Line:**
```
info | Wallet connected: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**🚨 Failure Signature:**
```
error | Failed to connect wallet: User rejected request
error | MetaMask not detected
```

---

### Step 4: Auto get_balance (Player A)

**Trigger:** Automatic after wallet connect

**Expected Outbound Message:**
```json
▶ OUTBOUND [get_balance]
{
  "raw": "{\"id\":\"2\",\"method\":\"get_balance\",\"params\":{\"address\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\"}}",
  "parsed": {
    "id": "2",
    "method": "get_balance",
    "params": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

**Expected Inbound Response (First Time User):**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"2\",\"result\":[]}" }

◀ INBOUND PARSED
{ "parsed": { "id": "2", "result": [] } }

✅ SUCCESS RESPONSE [id=2]
```

**Visual Confirmation:**
- [ ] Balance section shows: "No balance found"
- [ ] "Request Test Funds" button appears
- [ ] NO balance amount displayed (not "0")

**Event Log Proof Line:**
```
info | ℹ️ No balance found (server returned empty array)
```

**🚨 Failure Signature:**
```
❌ Failed to fetch balance
⚠ Shows balance: 0 ytest.usd (WRONG - should show "No balance")
```

---

### Step 5: Request Faucet (Player A)

**Action:** Click "Request Test Funds" (or "Request Faucet") button

**Expected Outbound Message:**
```json
▶ OUTBOUND [faucet_request]
{
  "raw": "{\"id\":\"3\",\"method\":\"faucet_request\",\"params\":{\"address\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"token\":\"ytest.usd\",\"amount\":\"100\"}}",
  "parsed": {
    "id": "3",
    "method": "faucet_request",
    "params": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "token": "ytest.usd",
      "amount": "100"
    }
  }
}
```

**Expected Inbound Response:**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"3\",\"result\":{\"success\":true,\"amount\":\"100\",\"token\":\"ytest.usd\"}}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "3",
    "result": {
      "success": true,
      "amount": "100",
      "token": "ytest.usd"
    }
  }
}

✅ SUCCESS RESPONSE [id=3]
```

**Visual Confirmation:**
- [ ] Loading indicator appears briefly
- [ ] Balance section updates automatically

**Event Log Proof Lines:**
```
info | ✅ Faucet credited successfully { success: true, amount: "100", token: "ytest.usd" }
```

**🚨 Failure Signature:**
```
❌ ERROR RESPONSE [id=3] { "code": 429, "message": "Rate limit exceeded" }
❌ Faucet request failed: no success confirmation
```

---

### Step 6: Verify Balance Updated (Player A)

**Trigger:** Automatic balance refresh after faucet

**Expected Outbound Message:**
```json
▶ OUTBOUND [get_balance]
{
  "raw": "{\"id\":\"4\",\"method\":\"get_balance\",\"params\":{\"address\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\"}}",
  "parsed": {
    "id": "4",
    "method": "get_balance",
    "params": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

**Expected Inbound Response:**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"4\",\"result\":[{\"token\":\"ytest.usd\",\"amount\":\"100\",\"available\":\"100\",\"locked\":\"0\"}]}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "4",
    "result": [
      {
        "token": "ytest.usd",
        "amount": "100",
        "available": "100",
        "locked": "0"
      }
    ]
  }
}

✅ SUCCESS RESPONSE [id=4]
```

**Visual Confirmation:**
- [ ] Balance section shows: "100 ytest.usd"
- [ ] Available: 100
- [ ] Locked: 0
- [ ] "Request Test Funds" button disappears
- [ ] "Create Match" section appears

**Event Log Proof Line:**
```
info | ✅ Balance fetched from server { token: "ytest.usd", amount: "100", available: "100", locked: "0" }
```

**🚨 Failure Signature:**
```
info | ℹ️ No balance found (WRONG - should show balance now)
error | ❌ Failed to fetch balance
```

---

## 🟢 Player B - Steps 7-9: Setup (Parallel)

### Step 7: Launch Browser B

**Action:** Open Browser B (or new incognito) → `http://localhost:3000`

**Visual Confirmation:**
- [ ] Same UI as Player A
- [ ] WebSocket auto-connects
- [ ] get_config auto-runs

**Event Log Should Show:**
```
info | WebSocket connected to sandbox
info | Detected chains: Avalanche Fuji. Selected: Avalanche Fuji
```

---

### Step 8: Connect Wallet (Player B)

**Action:** Click "Connect Wallet" → Select `0x8e4C...56c`

**Visual Confirmation:**
- [ ] UI shows: "Connected: 0x8e4C...56c"
- [ ] Balance shows: "No balance found"

**Event Log Proof Line:**
```
info | Wallet connected: 0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c
info | ℹ️ No balance found (server returned empty array)
```

---

### Step 9: Request Faucet (Player B)

**Action:** Click "Request Test Funds"

**Expected Logs:**
```
▶ OUTBOUND [faucet_request] { address: "0x8e4C...56c", token: "ytest.usd", amount: "100" }
✅ SUCCESS RESPONSE [id=3]
info | ✅ Faucet credited successfully
▶ OUTBOUND [get_balance]
✅ SUCCESS RESPONSE [id=4]
info | ✅ Balance fetched from server { available: "100" }
```

**Visual Confirmation:**
- [ ] Balance shows: "100 ytest.usd"
- [ ] Available: 100, Locked: 0

---

## 🎮 Player A - Step 10: Create Match

### Step 10: Create App Session (Player A)

**Action:**
1. Scroll to "Create Match" section
2. Enter Opponent Address: `0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c` (Player B)
3. Enter Wager: `10`
4. Click "Create Match" button

**Expected Outbound Message:**
```json
▶ OUTBOUND [create_app_session]
{
  "raw": "{\"id\":\"5\",\"method\":\"create_app_session\",\"params\":{\"participants\":[\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c\"],\"token\":\"ytest.usd\",\"wager_amount\":\"10\",\"rules\":{\"participant_count\":2,\"approval_threshold\":2}}}",
  "parsed": {
    "id": "5",
    "method": "create_app_session",
    "params": {
      "participants": [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c"
      ],
      "token": "ytest.usd",
      "wager_amount": "10",
      "rules": {
        "participant_count": 2,
        "approval_threshold": 2
      }
    }
  }
}
```

**Expected Inbound Response:**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"5\",\"result\":{\"sessionId\":\"session-abc-123-xyz\",\"status\":\"created\",\"participants\":[...],\"allocations\":{...}}}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "5",
    "result": {
      "sessionId": "session-abc-123-xyz-789",
      "status": "created",
      "participants": [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c"
      ],
      "allocations": {
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "10",
        "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c": "10"
      }
    }
  }
}

✅ SUCCESS RESPONSE [id=5]
```

**Visual Confirmation (Player A):**
- [ ] Screen transitions to "Match" view
- [ ] Shows: "Session: session-abc-123-xyz-789" (copy this!)
- [ ] Player A allocation: 10 ytest.usd
- [ ] Player B allocation: 10 ytest.usd
- [ ] Round: 0

**Event Log Proof Line:**
```
info | ✅ Session created. SessionId: session-abc-123-xyz-789 { sessionId: "...", status: "created", allocations: {...} }
```

**🔴 CRITICAL: Copy SessionId to Clipboard/Notepad**
```
SessionId: session-abc-123-xyz-789
```
You will share this with Player B.

**Expected Balance Update (Auto-refresh):**
```
▶ OUTBOUND [get_balance]
✅ SUCCESS RESPONSE [id=6]
info | ✅ Balance fetched from server { available: "90", locked: "10" }
```

**Visual Confirmation (Balance Section):**
- [ ] Available: 90
- [ ] Locked: 10 ✅ (Proves session locked funds)

**🚨 Failure Signature:**
```
❌ ERROR RESPONSE [id=5] { "code": 400, "message": "Insufficient balance" }
❌ Session creation failed: no sessionId returned
❌ PvP requires exactly 2 participants
```

---

## 🔗 Step 11: Share SessionId

**Action (Player A):**
Copy `SessionId` from UI or Event Log and send to Player B via:
- Slack
- Discord
- Text message
- Notepad (if same person testing)

**What to Share:**
```
SessionId: session-abc-123-xyz-789
```

**⚠️ WARNING:** Both players MUST use the EXACT same SessionId.

---

## 🟢 Player B - Steps 12-13: Join Session

### Step 12: Join App Session (Player B)

**Action (Player B):**
1. Stay on Lobby screen (DO NOT create a match)
2. Scroll to "Join Match" section
3. Paste SessionId: `session-abc-123-xyz-789`
4. Click "Join Match" button

**Expected Outbound Message (Step 1: Join):**
```json
▶ OUTBOUND [join_app_session]
{
  "raw": "{\"id\":\"5\",\"method\":\"join_app_session\",\"params\":{\"session_id\":\"session-abc-123-xyz-789\",\"address\":\"0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c\"}}",
  "parsed": {
    "id": "5",
    "method": "join_app_session",
    "params": {
      "session_id": "session-abc-123-xyz-789",
      "address": "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c"
    }
  }
}
```

**Expected Inbound Response (Step 1):**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"5\",\"result\":{\"success\":true,\"sessionId\":\"session-abc-123-xyz-789\",\"status\":\"active\"}}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "5",
    "result": {
      "success": true,
      "sessionId": "session-abc-123-xyz-789",
      "status": "active"
    }
  }
}

✅ SUCCESS RESPONSE [id=5]
```

**Event Log Proof Line (Player B):**
```
info | ✅ Joined session successfully { success: true, sessionId: "..." }
```

**🚨 Failure Signature:**
```
❌ ERROR RESPONSE [id=5] { "code": 404, "message": "Session not found" }
❌ Failed to join session
❌ Invalid sessionId
```

---

### Step 13: Auto get_app_session (Player B)

**Trigger:** Automatic immediately after join

**Expected Outbound Message (Step 2: Fetch State):**
```json
▶ OUTBOUND [get_app_session]
{
  "raw": "{\"id\":\"6\",\"method\":\"get_app_session\",\"params\":{\"session_id\":\"session-abc-123-xyz-789\"}}",
  "parsed": {
    "id": "6",
    "method": "get_app_session",
    "params": {
      "session_id": "session-abc-123-xyz-789"
    }
  }
}
```

**Expected Inbound Response (Step 2):**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"6\",\"result\":{\"sessionId\":\"session-abc-123-xyz-789\",\"participants\":[...],\"allocations\":{...},\"round\":0,\"status\":\"active\",\"token\":\"ytest.usd\"}}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "6",
    "result": {
      "sessionId": "session-abc-123-xyz-789",
      "participants": [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c"
      ],
      "allocations": {
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "10",
        "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c": "10"
      },
      "round": 0,
      "status": "active",
      "token": "ytest.usd"
    }
  }
}

✅ SUCCESS RESPONSE [id=6]
```

**Visual Confirmation (Player B):**
- [ ] Screen transitions to "Match" view
- [ ] Shows SAME SessionId as Player A
- [ ] Player A (0x742d...): 10 ytest.usd ✅
- [ ] Player B (0x8e4C...): 10 ytest.usd ✅
- [ ] Round: 0 ✅
- [ ] **CRITICAL:** Allocations match Player A's screen

**Event Log Proof Line (Player B):**
```
info | 📥 Fetched session state { participants: [...], allocations: {"0x742d...": "10", "0x8e4C...": "10"}, round: 0 }
```

**Expected Balance Update (Auto-refresh):**
```
▶ OUTBOUND [get_balance]
✅ SUCCESS RESPONSE [id=7]
info | ✅ Balance fetched from server { available: "90", locked: "10" }
```

**Visual Confirmation (Balance Section - Player B):**
- [ ] Available: 90
- [ ] Locked: 10 ✅ (Proves session locked funds)

**🎯 SYNCHRONIZATION CHECKPOINT:**
At this point, BOTH browsers should show:
- Same SessionId
- Same allocations: A=10, B=10
- Same round: 0
- Same locked balances: 10

**🚨 Failure Signature:**
```
error | ❌ Failed to join match (session fetch failed)
⚠ Player B shows empty allocations (WRONG - should show 10/10)
⚠ Player B sees different allocations than Player A
```

---

## 🎲 Steps 14-18: Play Rounds (Both Players)

### Step 14: Round 1 - Player A Wins

**Action (Either Player A or B):**
1. Click "Player A Wins" button

**Expected Outbound Message:**
```json
▶ OUTBOUND [submit_app_state]
{
  "raw": "{\"id\":\"7\",\"method\":\"submit_app_state\",\"params\":{\"session_id\":\"session-abc-123-xyz-789\",\"allocations\":{\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\":\"15\",\"0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c\":\"5\"},\"round\":1}}",
  "parsed": {
    "id": "7",
    "method": "submit_app_state",
    "params": {
      "session_id": "session-abc-123-xyz-789",
      "allocations": {
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "15",
        "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c": "5"
      },
      "round": 1
    }
  }
}
```

**Expected Inbound Response:**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"7\",\"result\":{\"success\":true,\"round\":1,\"state_hash\":\"0xabc123...\",\"timestamp\":1706000000}}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "7",
    "result": {
      "success": true,
      "round": 1,
      "state_hash": "0xabc123...",
      "timestamp": 1706000000
    }
  }
}

✅ SUCCESS RESPONSE [id=7]
```

**Event Log Proof Lines:**
```
info | 💰 Allocation validation: total=20 { "0x742d...": "15", "0x8e4C...": "5" }
info | 📤 Submitting round 1 { "0x742d...": "15", "0x8e4C...": "5" }
✅ SUCCESS RESPONSE [id=7]
info | ✅ Round 1 confirmed by server. Winner: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Visual Confirmation (BOTH Browsers):**
- [ ] Player A allocation: 15 ytest.usd (+5)
- [ ] Player B allocation: 5 ytest.usd (-5)
- [ ] Round: 1
- [ ] UI updates ONLY after ✅ log appears

**🚨 Failure Signature:**
```
❌ ERROR RESPONSE [id=7] { "code": 400, "message": "Invalid allocation sum" }
❌ State update rejected by server
error | Allocation mismatch: 20 -> 18 (WRONG sum)
```

---

### Step 15: Round 2 - Player B Wins

**Action:** Click "Player B Wins"

**Expected Logs:**
```
info | 💰 Allocation validation: total=20
info | 📤 Submitting round 2
✅ SUCCESS RESPONSE [id=8]
info | ✅ Round 2 confirmed by server. Winner: 0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c
```

**Visual Confirmation (BOTH Browsers):**
- [ ] Player A: 10 ytest.usd (-5)
- [ ] Player B: 10 ytest.usd (+5)
- [ ] Round: 2

---

### Step 16: Round 3 - Player A Wins

**Action:** Click "Player A Wins"

**Expected Logs:**
```
info | 💰 Allocation validation: total=20
info | 📤 Submitting round 3
✅ SUCCESS RESPONSE [id=9]
info | ✅ Round 3 confirmed by server. Winner: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Visual Confirmation (BOTH Browsers):**
- [ ] Player A: 15 ytest.usd
- [ ] Player B: 5 ytest.usd
- [ ] Round: 3

---

### Step 17: Round 4 - Player A Wins

**Action:** Click "Player A Wins"

**Expected Logs:**
```
info | 💰 Allocation validation: total=20
info | 📤 Submitting round 4
✅ SUCCESS RESPONSE [id=10]
info | ✅ Round 4 confirmed by server. Winner: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Visual Confirmation (BOTH Browsers):**
- [ ] Player A: 20 ytest.usd
- [ ] Player B: 0 ytest.usd ⚠️ (Bankrupt)
- [ ] Round: 4

---

### Step 18: Verify Final Allocations

**Before Closing, Confirm (BOTH Browsers):**
- [ ] Player A: 20 ytest.usd
- [ ] Player B: 0 ytest.usd
- [ ] Round: 4
- [ ] **BOTH screens show IDENTICAL values**

**If NOT identical, DO NOT PROCEED. Report desync.**

---

## 🏁 Step 19: Close Session (Either Player)

### Step 19: Close App Session

**Action (Player A or B):** Click "Close Session" button

**Expected Outbound Message:**
```json
▶ OUTBOUND [close_app_session]
{
  "raw": "{\"id\":\"11\",\"method\":\"close_app_session\",\"params\":{\"session_id\":\"session-abc-123-xyz-789\"}}",
  "parsed": {
    "id": "11",
    "method": "close_app_session",
    "params": {
      "session_id": "session-abc-123-xyz-789"
    }
  }
}
```

**Expected Inbound Response:**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"11\",\"result\":{\"success\":true,\"sessionId\":\"session-abc-123-xyz-789\",\"status\":\"closed\",\"final_allocations\":{...}}}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "11",
    "result": {
      "success": true,
      "sessionId": "session-abc-123-xyz-789",
      "status": "closed",
      "final_allocations": {
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "20",
        "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c": "0"
      }
    }
  }
}

✅ SUCCESS RESPONSE [id=11]
```

**Event Log Proof Line:**
```
info | ✅ Session closed successfully { success: true, status: "closed", final_allocations: {...} }
```

**Visual Confirmation (BOTH Browsers):**
- [ ] Screen transitions to "Session Closed" view
- [ ] Shows final payout summary:
  - Player A (0x742d...): 20 ytest.usd ✅
  - Player B (0x8e4C...): 0 ytest.usd
- [ ] "Back to Lobby" button appears

**🚨 Failure Signature:**
```
❌ ERROR RESPONSE [id=11] { "code": 400, "message": "Session already closed" }
❌ Session closure failed
```

---

## 💰 Step 20: Verify Balance Unlocked (Both Players)

### Step 20: Check Final Balances

**Trigger:** Automatic balance refresh after session close

**Expected Outbound Message (Player A):**
```json
▶ OUTBOUND [get_balance]
{
  "raw": "{\"id\":\"12\",\"method\":\"get_balance\",\"params\":{\"address\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\"}}",
  "parsed": {
    "id": "12",
    "method": "get_balance",
    "params": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

**Expected Inbound Response (Player A):**
```json
◀ INBOUND RAW
{ "raw": "{\"id\":\"12\",\"result\":[{\"token\":\"ytest.usd\",\"amount\":\"110\",\"available\":\"110\",\"locked\":\"0\"}]}" }

◀ INBOUND PARSED
{
  "parsed": {
    "id": "12",
    "result": [
      {
        "token": "ytest.usd",
        "amount": "110",
        "available": "110",
        "locked": "0"
      }
    ]
  }
}

✅ SUCCESS RESPONSE [id=12]
```

**Visual Confirmation (Player A):**
- [ ] Balance: 110 ytest.usd (started 100, won 10) ✅
- [ ] Available: 110 ✅
- [ ] Locked: 0 ✅ (Funds unlocked)

**Event Log Proof Line (Player A):**
```
info | ✅ Balance fetched from server { amount: "110", available: "110", locked: "0" }
```

---

**Expected Balance (Player B):**
```json
◀ INBOUND PARSED
{
  "parsed": {
    "id": "12",
    "result": [
      {
        "token": "ytest.usd",
        "amount": "90",
        "available": "90",
        "locked": "0"
      }
    ]
  }
}
```

**Visual Confirmation (Player B):**
- [ ] Balance: 90 ytest.usd (started 100, lost 10) ✅
- [ ] Available: 90 ✅
- [ ] Locked: 0 ✅ (Funds unlocked)

**Event Log Proof Line (Player B):**
```
info | ✅ Balance fetched from server { amount: "90", available: "90", locked: "0" }
```

---

## 📊 Success Proof Summary

### Protocol Method Success Patterns

| Method | Success Proof Line | Response Field |
|--------|-------------------|----------------|
| `get_config` | `✅ SUCCESS RESPONSE [id=1]` | `result.chains` present |
| `get_balance` | `✅ SUCCESS RESPONSE [id=X]` | `result` is array (may be empty) |
| `faucet_request` | `✅ Faucet credited successfully` | `result.success: true` |
| `create_app_session` | `✅ Session created. SessionId: ...` | `result.sessionId` present |
| `join_app_session` | `✅ Joined session successfully` | `result.success: true` |
| `get_app_session` | `📥 Fetched session state` | `result.allocations` present |
| `submit_app_state` | `✅ Round X confirmed by server` | `result.success: true` |
| `close_app_session` | `✅ Session closed successfully` | `result.success: true` |

---

## 🚨 Failure Signature Reference

### Connection Failures
```
❌ WebSocket error: Connection refused
❌ Failed to connect: timeout after 10s
⚠ WebSocket closed unexpectedly
```

### Protocol Errors
```
⚠ PROTOCOL ERROR: Response missing id field
⚠ PROTOCOL ERROR: Response has neither result nor error
⏱ TIMEOUT [method_name] after 30s
```

### Method-Specific Errors

**get_config:**
```
❌ ERROR RESPONSE [id=1] { "code": 500, "message": "Service unavailable" }
❌ Invalid get_config response: missing chains
```

**get_balance:**
```
❌ Failed to fetch balance
❌ Invalid address format
```

**faucet_request:**
```
❌ ERROR RESPONSE [id=3] { "code": 429, "message": "Rate limit exceeded" }
❌ Faucet request failed: no success confirmation
❌ ERROR RESPONSE [id=3] { "code": 400, "message": "Insufficient faucet funds" }
```

**create_app_session:**
```
❌ ERROR RESPONSE [id=5] { "code": 400, "message": "Insufficient balance" }
❌ Session creation failed: no sessionId returned
❌ PvP requires exactly 2 participants
❌ Invalid wager amount
```

**join_app_session:**
```
❌ ERROR RESPONSE [id=5] { "code": 404, "message": "Session not found" }
❌ Failed to join session
❌ Invalid sessionId
```

**get_app_session:**
```
❌ ERROR RESPONSE [id=6] { "code": 404, "message": "Session not found" }
❌ Failed to join match (session fetch failed)
```

**submit_app_state:**
```
❌ ERROR RESPONSE [id=7] { "code": 400, "message": "Invalid allocation sum" }
❌ State update rejected by server
error | Allocation mismatch: 20 -> 18 (sum validation failed)
```

**close_app_session:**
```
❌ ERROR RESPONSE [id=11] { "code": 400, "message": "Session already closed" }
❌ Session closure failed
❌ ERROR RESPONSE [id=11] { "code": 404, "message": "Session not found" }
```

### Synchronization Errors
```
⚠ Player B shows empty allocations (should be 10/10)
⚠ Player A and B see different allocations (DESYNC!)
⚠ Balance not locked after session creation
⚠ Balance not unlocked after session closure
```

### Client-Side Validation Errors
```
error | Invalid address format
error | Invalid sessionId
error | Allocation mismatch: 20 -> 18
error | Invalid wager amount
```

---

## 🎯 Phase-1 Completion Checklist

**Date:** _________  
**Tester:** _________

### Pre-Test Setup
- [ ] Two browsers/wallets prepared
- [ ] Browser consoles open
- [ ] Event logs visible

### Protocol Compliance - Message Shapes
- [ ] All outbound messages have `id`, `method`, `params`
- [ ] All IDs are unique strings
- [ ] All `params` use snake_case (e.g., `session_id`, `wager_amount`)
- [ ] All inbound responses have `id` matching request
- [ ] Success responses have `result` field
- [ ] Error responses have `error` field

### Brutal Logging - Visibility
- [ ] Every outbound message shows `▶ OUTBOUND [method]`
- [ ] Every outbound message shows `raw` JSON string
- [ ] Every inbound message shows `◀ INBOUND RAW`
- [ ] Every inbound message shows `◀ INBOUND PARSED`
- [ ] Success responses show `✅ SUCCESS RESPONSE [id=X]`
- [ ] Error responses show `❌ ERROR RESPONSE [id=X]`
- [ ] Protocol errors show `⚠ PROTOCOL ERROR`
- [ ] Timeouts show `⏱ TIMEOUT [method] after 30s`

### Dynamic Chain Discovery
- [ ] `get_config` called automatically on connect
- [ ] Avalanche chain discovered from `result.chains` array
- [ ] Chain selector shows discovered chain
- [ ] No hardcoded addresses observed in logs

### Unified Balance - No Fake Data
- [ ] Initial `get_balance` returns `[]` for new user
- [ ] UI shows "No balance found" (NOT "0 ytest.usd")
- [ ] After faucet, balance shows real server value
- [ ] No fake zero balances created

### Faucet Request - ACK Wait
- [ ] Faucet request sent with correct params
- [ ] Response shows `success: true`
- [ ] Log shows `✅ Faucet credited successfully`
- [ ] Balance auto-refreshed after success
- [ ] Balance update shows credited amount

### Session Creation
- [ ] `create_app_session` sent with 2 participants
- [ ] `wager_amount` is snake_case (not camelCase)
- [ ] Response contains `sessionId`
- [ ] Log shows `✅ Session created. SessionId: ...`
- [ ] UI transitions to Match screen
- [ ] Allocations show equal split (10/10)
- [ ] Balance auto-refreshed showing locked amount
- [ ] Available balance decreased by wager
- [ ] Locked balance equals wager

### Session Join - Fetch Real State
- [ ] Player B uses exact SessionId from Player A
- [ ] `join_app_session` sent with `session_id` (snake_case)
- [ ] Join response shows `success: true`
- [ ] **CRITICAL:** `get_app_session` called immediately after join
- [ ] Session state response shows `participants` array
- [ ] Session state response shows `allocations` object
- [ ] Player B UI shows SAME allocations as Player A
- [ ] Player B balance shows locked amount

### State Updates - Server Confirmation
- [ ] Log shows `💰 Allocation validation: total=20` before submit
- [ ] Log shows `📤 Submitting round X` before submit
- [ ] `submit_app_state` sent with correct allocations
- [ ] Allocations sum equals original total (20)
- [ ] Response shows `success: true`
- [ ] Log shows `✅ Round X confirmed by server`
- [ ] UI updates ONLY AFTER `✅` log appears
- [ ] Both players see identical allocations after update
- [ ] No speculative UI updates observed

### Session Closure
- [ ] `close_app_session` sent with `session_id`
- [ ] Response shows `success: true`
- [ ] Response contains `final_allocations`
- [ ] Log shows `✅ Session closed successfully`
- [ ] UI transitions to "Session Closed" screen
- [ ] Final payout summary shows correct amounts
- [ ] Balance auto-refreshed after closure
- [ ] Available balance updated with payout
- [ ] Locked balance returned to 0

### End-to-End Correctness
- [ ] Player A won 10 ytest.usd (100 → 110)
- [ ] Player B lost 10 ytest.usd (100 → 90)
- [ ] Total tokens conserved: 200 = 110 + 90 ✅
- [ ] Both players' balances fully unlocked
- [ ] No desync issues observed

### Error Handling
- [ ] No `⚠ PROTOCOL ERROR` messages observed
- [ ] No `⏱ TIMEOUT` messages observed
- [ ] No uncaught exceptions in console
- [ ] All errors (if any) properly logged with `❌`

### Documentation Accuracy
- [ ] `PROTOCOL_MESSAGE_FLOW.md` matches observed messages
- [ ] All inline code comments match behavior
- [ ] No discrepancies between docs and reality

---

## ✅ Phase-1 Certification Statement

**I certify that:**

- [ ] All 20 test steps completed successfully
- [ ] All 8 protocol methods executed correctly
- [ ] Both wallets synchronized throughout session
- [ ] No fake client-side data created
- [ ] Server ACK required for all state changes
- [ ] Session state fetched from server after join
- [ ] Allocation integrity maintained (sum = 20)
- [ ] Balances locked/unlocked correctly
- [ ] Brutal logging provided full visibility
- [ ] No hardcoded chains or contracts
- [ ] Message formats comply with Yellow protocol
- [ ] No protocol errors observed

**Phase-1 Yellow PvP Wager Demo is COMPLETE and COMPLIANT.**

---

**Signature:** ___________________________  
**Date:** _____________________________  
**Environment:** Sandbox / Production (circle one)
