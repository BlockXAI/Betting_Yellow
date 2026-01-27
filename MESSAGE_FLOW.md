# Yellow ClearNode - Complete Message Flow Reference

## Message Format

All WebSocket messages follow this structure:

**Request:**
```json
{
  "id": "unique-message-id",
  "method": "method_name",
  "params": { ... }
}
```

**Response:**
```json
{
  "id": "same-as-request-id",
  "result": { ... }
}
```

**Error Response:**
```json
{
  "id": "same-as-request-id",
  "error": {
    "code": 400,
    "message": "Error description"
  }
}
```

## 1. get_config

**Purpose:** Discover supported chains and contract addresses dynamically.

**When:** Immediately after WebSocket connection.

**Request:**
```json
{
  "id": "1",
  "method": "get_config",
  "params": {}
}
```

**Response:**
```json
{
  "id": "1",
  "result": {
    "version": "1.0",
    "capabilities": ["app_sessions", "unified_balance"],
    "chains": [
      {
        "chainId": "43113",
        "name": "Avalanche Fuji",
        "contracts": {
          "deposit": "0x...",
          "withdrawal": "0x...",
          "settlement": "0x..."
        }
      }
    ]
  }
}
```

**Key Points:**
- Returns all supported chains
- Provides contract addresses per chain
- No hardcoding needed in your app
- Call this before any other operations

---

## 2. get_balance

**Purpose:** Fetch off-chain Unified Balance for an address.

**When:** After wallet connection or after balance changes.

**Request:**
```json
{
  "id": "2",
  "method": "get_balance",
  "params": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

**Response:**
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

**Fields:**
- `token`: Token identifier
- `amount`: Total balance
- `available`: Amount available for use
- `locked`: Amount locked in sessions

---

## 3. faucet_request

**Purpose:** Request test funds in sandbox environment.

**When:** When user needs test tokens for demo.

**Request:**
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

**Response:**
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

**Key Points:**
- Only works in sandbox
- Instantly credits Unified Balance
- No blockchain transaction needed

---

## 4. create_app_session

**Purpose:** Create a new PvP app session (game room).

**When:** Player A creates a match.

**Request:**
```json
{
  "id": "4",
  "method": "create_app_session",
  "params": {
    "participants": [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "0x123d45Cc6634C0532925a3b844Bc9e7595f0aEf"
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

**Response:**
```json
{
  "id": "4",
  "result": {
    "sessionId": "session-abc-123-xyz",
    "status": "created",
    "participants": [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "0x123d45Cc6634C0532925a3b844Bc9e7595f0aEf"
    ]
  }
}
```

**Fields Explained:**
- `participants`: Array of wallet addresses (2 players)
- `wager_amount`: Initial allocation per player
- `approval_threshold`: How many signatures needed for state changes
- `sessionId`: Unique identifier to share with opponent

---

## 5. join_app_session

**Purpose:** Join an existing app session.

**When:** Player B joins Player A's session.

**Request:**
```json
{
  "id": "5",
  "method": "join_app_session",
  "params": {
    "session_id": "session-abc-123-xyz",
    "address": "0x123d45Cc6634C0532925a3b844Bc9e7595f0aEf"
  }
}
```

**Response:**
```json
{
  "id": "5",
  "result": {
    "success": true,
    "sessionId": "session-abc-123-xyz",
    "status": "active"
  }
}
```

---

## 6. submit_app_state

**Purpose:** Submit updated allocations (balance changes) for a round.

**When:** After each game round when balances change.

**Request:**
```json
{
  "id": "6",
  "method": "submit_app_state",
  "params": {
    "session_id": "session-abc-123-xyz",
    "round": 1,
    "allocations": {
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "15",
      "0x123d45Cc6634C0532925a3b844Bc9e7595f0aEf": "5"
    }
  }
}
```

**Response:**
```json
{
  "id": "6",
  "result": {
    "success": true,
    "round": 1,
    "state_hash": "0xabc123...",
    "timestamp": 1706000000
  }
}
```

**Key Points:**
- Allocations must sum to original total
- Round number increments with each update
- Updates happen instantly off-chain
- ClearNode validates before accepting

---

## 7. close_app_session

**Purpose:** Finalize and close the app session.

**When:** Game is over and final payouts are determined.

**Request:**
```json
{
  "id": "7",
  "method": "close_app_session",
  "params": {
    "session_id": "session-abc-123-xyz"
  }
}
```

**Response:**
```json
{
  "id": "7",
  "result": {
    "success": true,
    "sessionId": "session-abc-123-xyz",
    "status": "closed",
    "final_allocations": {
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": "15",
      "0x123d45Cc6634C0532925a3b844Bc9e7595f0aEf": "5"
    }
  }
}
```

**Key Points:**
- Session becomes immutable after closing
- Balances return to Unified Balance
- Can be used for on-chain settlement later

---

## Complete Flow Example

### Scenario: Player A vs Player B, 10 token wager

```
1. Player A connects wallet → WebSocket established
   
2. get_config called → Avalanche discovered
   
3. get_balance for Player A → Shows 100 ytest.usd
   
4. Player A creates match:
   create_app_session(participants: [A, B], wager: 10)
   → sessionId: "xyz123"
   
5. Player B joins:
   join_app_session(sessionId: "xyz123")
   → status: "active"
   
6. Round 1 - Player A wins:
   submit_app_state(allocations: { A: 15, B: 5 })
   → Balances updated instantly
   
7. Round 2 - Player B wins:
   submit_app_state(allocations: { A: 10, B: 10 })
   → Balances updated instantly
   
8. Game over:
   close_app_session(sessionId: "xyz123")
   → Final: A: 10, B: 10
```

---

## Error Codes

Common error responses:

**400 - Bad Request**
```json
{
  "error": {
    "code": 400,
    "message": "Invalid parameters"
  }
}
```

**401 - Unauthorized**
```json
{
  "error": {
    "code": 401,
    "message": "Signature required"
  }
}
```

**404 - Not Found**
```json
{
  "error": {
    "code": 404,
    "message": "Session not found"
  }
}
```

**500 - Internal Error**
```json
{
  "error": {
    "code": 500,
    "message": "Internal server error"
  }
}
```

---

## Implementation Tips

### Request ID Management

Always use unique IDs to correlate requests/responses:

```typescript
let messageId = 0;
const id = `${++messageId}`;
```

### Timeout Handling

Set timeouts for requests:

```typescript
setTimeout(() => {
  if (pendingRequests.has(id)) {
    reject(new Error('Request timeout'));
  }
}, 30000); // 30 seconds
```

### Reconnection Strategy

Implement exponential backoff:

```typescript
const delay = baseDelay * Math.pow(2, attemptNumber);
setTimeout(() => reconnect(), delay);
```

### State Validation

Before submitting:

```typescript
// Ensure allocations sum correctly
const total = Object.values(allocations)
  .reduce((sum, val) => sum + parseFloat(val), 0);
  
if (total !== originalWager * participantCount) {
  throw new Error('Allocations must sum to total wager');
}
```

---

## WebSocket Events

Beyond request/response, ClearNode may send events:

**Session State Changed**
```json
{
  "event": "session_state_changed",
  "data": {
    "sessionId": "xyz123",
    "round": 2,
    "allocations": { ... }
  }
}
```

**Balance Updated**
```json
{
  "event": "balance_updated",
  "data": {
    "address": "0x...",
    "token": "ytest.usd",
    "amount": "110"
  }
}
```

Listen for these to keep UI in sync across players.
