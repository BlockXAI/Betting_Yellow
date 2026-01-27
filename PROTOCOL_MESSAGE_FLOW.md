# Yellow ClearNode Protocol - Verified Message Flow

## Complete End-to-End Flow with Real JSON Payloads

This document contains the **actual JSON messages** used in the demo, verified against the protocol implementation in `lib/clearnode.ts`.

---

## 1. WebSocket Connection

```
Client → wss://sandbox.clearnode.yellow.com
Status: OPEN
```

**Logging Pattern:**
- `▶ OUTBOUND [method_name]` - Request sent
- `◀ INBOUND RAW` - Raw response received
- `◀ INBOUND PARSED` - Parsed response
- `✅ SUCCESS RESPONSE [id=X]` - Success
- `❌ ERROR RESPONSE [id=X]` - Error

---

## 2. get_config - Dynamic Chain Discovery

### Request

```json
{
  "id": "1",
  "method": "get_config",
  "params": {}
}
```

**Why this shape:**
- `id`: Unique request identifier for correlation (auto-generated)
- `method`: Yellow protocol method name
- `params`: Empty object (no params needed)

### Response

```json
{
  "id": "1",
  "result": {
    "version": "1.0.0",
    "capabilities": ["app_sessions", "unified_balance", "faucet"],
    "chains": [
      {
        "chainId": "43113",
        "name": "Avalanche Fuji",
        "contracts": {
          "deposit": "0x1234567890abcdef1234567890abcdef12345678",
          "withdrawal": "0xabcdef1234567890abcdef1234567890abcdef12",
          "settlement": "0x567890abcdef1234567890abcdef1234567890ab"
        }
      }
    ]
  }
}
```

**Protocol Rules:**
- ✅ Response MUST have `result.chains` array
- ✅ Client MUST NOT hardcode chain addresses
- ✅ Client dynamically searches for Avalanche in returned chains
- ✅ Contract addresses are stored from this response

**Implementation:** `clearnode.ts:157-170`

---

## 3. get_balance - Fetch Unified Balance

### Request

```json
{
  "id": "2",
  "method": "get_balance",
  "params": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

**Why this shape:**
- `params.address`: User's wallet address (required, must start with 0x)

### Response (Balance Exists)

```json
{
  "id": "2",
  "result": [
    {
      "token": "ytest.usd",
      "amount": "100",
      "available": "100",
      "locked": "0"
    }
  ]
}
```

### Response (No Balance)

```json
{
  "id": "2",
  "result": []
}
```

**Protocol Rules:**
- ✅ Server returns array (may be empty)
- ✅ Client MUST NOT create fake zero balances
- ✅ Empty array = user has no balance yet
- ✅ `available` = spendable amount
- ✅ `locked` = amount locked in active sessions

**Implementation:** `clearnode.ts:172-188`

---

## 4. faucet_request - Get Test Funds

### Request

```json
{
  "id": "3",
  "method": "faucet_request",
  "params": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "token": "ytest.usd",
    "amount": "100"
  }
}
```

**Why this shape:**
- `params.token`: Token identifier (ytest.usd for sandbox)
- `params.amount`: Amount to request (string, not number)

### Response

```json
{
  "id": "3",
  "result": {
    "success": true,
    "amount": "100",
    "token": "ytest.usd"
  }
}
```

**Protocol Rules:**
- ✅ SANDBOX ONLY - not available in production
- ✅ Credits Unified Balance immediately
- ✅ Client MUST wait for `success: true` before assuming balance updated
- ✅ After success, client SHOULD refetch balance

**Implementation:** `clearnode.ts:190-209`

**Application Flow:** `app/page.tsx:137-155`
1. Call `requestFaucet()`
2. Wait for server ACK (`success: true`)
3. Wait 1 second for propagation
4. Refetch balance with `get_balance`

---

## 5. create_app_session - Create PvP Session

### Request

```json
{
  "id": "4",
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
```

**Why this shape:**
- `params.participants`: Array of exactly 2 addresses (PvP)
- `params.wager_amount`: Initial allocation per player (snake_case)
- `params.rules.approval_threshold`: Both players must sign state updates

### Response

```json
{
  "id": "4",
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
```

**Protocol Rules:**
- ✅ Exactly 2 participants required for PvP
- ✅ Server MUST return `sessionId` (critical for Player B to join)
- ✅ `wager_amount` is locked from Unified Balance
- ✅ Both players start with equal allocations
- ✅ Player A shares `sessionId` with Player B

**Implementation:** `clearnode.ts:211-247`

**Application Flow:** `app/page.tsx:157-192`
1. Validate participants and wager
2. Call `createAppSession()`
3. Wait for `sessionId` in response
4. Store session state locally
5. Transition to match screen
6. Refetch balance (should show locked amount)

---

## 6. join_app_session - Join Existing Session

### Request

```json
{
  "id": "5",
  "method": "join_app_session",
  "params": {
    "session_id": "session-abc-123-xyz-789",
    "address": "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c"
  }
}
```

**Why this shape:**
- `params.session_id`: Session ID from Player A (snake_case)
- `params.address`: Player B's address

### Response

```json
{
  "id": "5",
  "result": {
    "success": true,
    "sessionId": "session-abc-123-xyz-789",
    "status": "active"
  }
}
```

**Protocol Rules:**
- ✅ Player B uses `sessionId` from Player A
- ✅ Wait for `success: true` before proceeding
- ⚠️ CRITICAL: Join response does NOT include session state

---

## 7. get_app_session - Fetch Session State

**CRITICAL:** After joining, Player B MUST fetch session state to sync allocations.

### Request

```json
{
  "id": "6",
  "method": "get_app_session",
  "params": {
    "session_id": "session-abc-123-xyz-789"
  }
}
```

### Response

```json
{
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
```

**Protocol Rules:**
- ✅ Returns complete session state
- ✅ Player B MUST use server's allocations (not guess)
- ✅ Ensures both players see SAME state

**Implementation:** `clearnode.ts:276-290`

**Application Flow:** `app/page.tsx:194-231`
1. Player B calls `joinAppSession()` → wait for ACK
2. **Immediately** call `getAppSession()` → fetch real state
3. Extract `participants`, `allocations`, `round` from server
4. Update UI with server data (NOT client assumptions)
5. Transition to match screen

---

## 8. submit_app_state - Update Allocations Per Round

### Request

```json
{
  "id": "7",
  "method": "submit_app_state",
  "params": {
    "session_id": "session-abc-123-xyz-789",
    "round": 1,
    "allocations": {
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "15",
      "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c": "5"
    }
  }
}
```

**Why this shape:**
- `params.round`: Increments with each update
- `params.allocations`: New balance distribution
- ⚠️ **CRITICAL:** Allocations MUST sum to original total (10+10=20)

### Response

```json
{
  "id": "7",
  "result": {
    "success": true,
    "round": 1,
    "state_hash": "0xabc123def456...",
    "timestamp": 1706000000
  }
}
```

**Protocol Rules:**
- ✅ Allocations MUST sum to same total (validated client-side)
- ✅ Server validates before accepting
- ✅ Client MUST wait for `success: true` before updating UI
- ✅ UI updates ONLY after server confirmation
- ⚠️ **DO NOT update UI speculatively**

**Implementation:** `clearnode.ts:292-327`

**Allocation Validation:**
```typescript
// Before sending to server
const total = Object.values(allocations).reduce((sum, v) => sum + parseFloat(v), 0);
// Must equal original total (e.g., 20)
```

**Application Flow:** `app/page.tsx:233-279`
1. Calculate new allocations (winner +5, loser -5)
2. **Validate total unchanged**
3. Log `📤 Submitting round X`
4. Call `submitAppState()` → **WAIT for server ACK**
5. Log `✅ Round X confirmed by server`
6. **ONLY NOW** update UI with new allocations

---

## 9. close_app_session - Finalize Session

### Request

```json
{
  "id": "8",
  "method": "close_app_session",
  "params": {
    "session_id": "session-abc-123-xyz-789"
  }
}
```

### Response

```json
{
  "id": "8",
  "result": {
    "success": true,
    "sessionId": "session-abc-123-xyz-789",
    "status": "closed",
    "final_allocations": {
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "15",
      "0x8e4C9BE9F9e24AA99F09E8e5e6eF48dD1f23456c": "5"
    }
  }
}
```

**Protocol Rules:**
- ✅ Session becomes immutable after closing
- ✅ Balances unlock and return to Unified Balance
- ✅ Use server's `final_allocations` for payout summary
- ✅ After success, refetch balance (should show unlocked amounts)

**Implementation:** `clearnode.ts:329-348`

**Application Flow:** `app/page.tsx:281-312`
1. Call `closeAppSession()`
2. Wait for `success: true`
3. Extract `final_allocations` from server
4. Display payout summary
5. Wait 1 second for propagation
6. Refetch balance (amounts now unlocked)

---

## Error Response Format

### Example Error

```json
{
  "id": "5",
  "error": {
    "code": 400,
    "message": "Invalid session_id"
  }
}
```

**Error Codes:**
- `400` - Bad Request (invalid params)
- `401` - Unauthorized (signature required)
- `404` - Not Found (session doesn't exist)
- `500` - Internal Server Error

**Protocol Rules:**
- ✅ Response has `error` instead of `result`
- ✅ Client logs `❌ ERROR RESPONSE [id=X]`
- ✅ Request promise rejects with error object
- ✅ UI shows error to user

---

## Complete Flow: Player A vs Player B

```
┌─────────────────────────────────────────────────────────────┐
│ PLAYER A                          PLAYER B                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Connect to ClearNode                                     │
│    ↓                                                         │
│ 2. get_config → Discover Avalanche                          │
│    ↓                                                         │
│ 3. Connect wallet (MetaMask)                                │
│    ↓                              ↓                          │
│ 4. get_balance → 0                get_balance → 0           │
│    ↓                              ↓                          │
│ 5. faucet_request → 100           faucet_request → 100      │
│    ↓                              ↓                          │
│ 6. create_app_session                                       │
│    → sessionId: "xyz"                                        │
│    → allocations: {A:10, B:10}                              │
│    ↓                                                         │
│ 7. Share sessionId "xyz" ──────────────────→                │
│                                   ↓                          │
│                              8. join_app_session("xyz")     │
│                                   ↓                          │
│                              9. get_app_session("xyz")      │
│                                   → participants: [A, B]    │
│                                   → allocations: {A:10,B:10}│
│    ↓                              ↓                          │
│ 10. Both players see same state now                         │
│    ↓                              ↓                          │
│ 11. Round 1: A wins                                         │
│     submit_app_state → {A:15, B:5}                          │
│     ✅ Server confirms                                      │
│     Update UI                                               │
│    ↓                              ↓                          │
│ 12. Round 2: B wins                                         │
│     submit_app_state → {A:10, B:10}                         │
│     ✅ Server confirms                                      │
│     Update UI                                               │
│    ↓                              ↓                          │
│ 13. close_app_session                                       │
│     → final: {A:10, B:10}                                   │
│    ↓                              ↓                          │
│ 14. get_balance → 100 (unlocked)  get_balance → 100         │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Protocol Guarantees

### 1. No Fake Balances
```typescript
// ❌ WRONG
setBalance({ token: 'ytest.usd', amount: '0', available: '0', locked: '0' });

// ✅ CORRECT
const balances = await client.getBalance(address);
if (balances.length === 0) {
  setBalance(null); // Show "Request test funds" UI
}
```

### 2. Wait for Server ACK
```typescript
// ❌ WRONG - UI updates before server confirms
setCurrentSession({ ...newAllocations });
await client.submitAppState(...);

// ✅ CORRECT - Wait for confirmation first
const result = await client.submitAppState(...);
if (result.success) {
  setCurrentSession({ ...newAllocations });
}
```

### 3. Fetch Real Session State After Join
```typescript
// ❌ WRONG - Guess allocations
await client.joinAppSession(sessionId, address);
setCurrentSession({ allocations: {} }); // Empty guess

// ✅ CORRECT - Fetch from server
await client.joinAppSession(sessionId, address);
const state = await client.getAppSession(sessionId);
setCurrentSession({ allocations: state.allocations }); // Real data
```

### 4. Dynamic Chain Discovery Only
```typescript
// ❌ WRONG - Hardcoded
const avalancheContract = "0x1234...";

// ✅ CORRECT - Dynamic
const config = await client.getConfig();
const avalanche = config.chains.find(c => c.name.includes('Avalanche'));
const contract = avalanche.contracts.deposit;
```

### 5. Allocation Sum Validation
```typescript
// ✅ CORRECT - Validate before submit
const total = Object.values(allocations).reduce((sum, v) => sum + parseFloat(v), 0);
if (Math.abs(total - originalTotal) > 0.01) {
  throw new Error('Allocations must sum to original total');
}
```

---

## Logging Interpretation Guide

When reading event logs:

**▶ OUTBOUND [method_name]**
```json
{ "raw": "{...}", "parsed": {...} }
```
→ Your app sent this to ClearNode

**◀ INBOUND RAW**
```json
{ "raw": "{...}" }
```
→ ClearNode sent this (before parsing)

**◀ INBOUND PARSED**
```json
{ "parsed": {...} }
```
→ JSON parsed successfully

**✅ SUCCESS RESPONSE [id=X]**
```json
{ "result": {...} }
```
→ Request succeeded, `result` field present

**❌ ERROR RESPONSE [id=X]**
```json
{ "error": { "code": 400, "message": "..." } }
```
→ Request failed, `error` field present

**⚠ PROTOCOL ERROR**
```
Response missing id field
```
→ ClearNode sent malformed response

**⏱ TIMEOUT [method_name] after 30s**
```
{ "id": "5" }
```
→ Request took >30s, no response received

**📨 UNSOLICITED MESSAGE**
```json
{ "event": "session_updated", "data": {...} }
```
→ ClearNode sent event (not correlated to request)

---

## Testing Checklist

Use this to verify protocol compliance:

- [ ] WebSocket connects to sandbox endpoint
- [ ] get_config called immediately on connect
- [ ] Avalanche discovered dynamically (not hardcoded)
- [ ] get_balance returns empty array for new user
- [ ] No fake zero balance shown when server returns []
- [ ] faucet_request waits for success:true ACK
- [ ] Balance refreshed after faucet success
- [ ] create_app_session returns sessionId
- [ ] Player B uses exact sessionId from Player A
- [ ] join_app_session followed by get_app_session
- [ ] Both players see same allocations
- [ ] submit_app_state validates allocation sum
- [ ] UI updates ONLY after server confirms state
- [ ] close_app_session waits for success
- [ ] Balance unlocks after session closure
- [ ] All requests have unique IDs
- [ ] All responses have matching IDs
- [ ] Raw JSON logged for every message
- [ ] Errors properly logged with ❌ marker
