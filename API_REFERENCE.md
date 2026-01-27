# ClearNode API Reference

## Message Format

All messages use JSON over WebSocket.

Request:
```json
{
  "id": "1",
  "method": "method_name",
  "params": {}
}
```

Response:
```json
{
  "id": "1",
  "result": {}
}
```

## Methods

### get_config

Discover supported chains and contracts.

```json
{
  "method": "get_config",
  "params": {}
}
```

### get_balance

Fetch off-chain Unified Balance.

```json
{
  "method": "get_balance",
  "params": {
    "address": "0x..."
  }
}
```

### faucet_request

Request test funds (sandbox only).

```json
{
  "method": "faucet_request",
  "params": {
    "address": "0x...",
    "token": "ytest.usd",
    "amount": "100"
  }
}
```

### create_app_session

Create PvP session.

```json
{
  "method": "create_app_session",
  "params": {
    "participants": ["0x...", "0x..."],
    "token": "ytest.usd",
    "wager_amount": "10"
  }
}
```

### join_app_session

Join existing session.

```json
{
  "method": "join_app_session",
  "params": {
    "session_id": "xyz",
    "address": "0x..."
  }
}
```

### submit_app_state

Update allocations per round.

```json
{
  "method": "submit_app_state",
  "params": {
    "session_id": "xyz",
    "round": 1,
    "allocations": {
      "0x...": "15",
      "0x...": "5"
    }
  }
}
```

### close_app_session

Finalize session.

```json
{
  "method": "close_app_session",
  "params": {
    "session_id": "xyz"
  }
}
```

## Implementation

See `lib/clearnode.ts` for the full WebSocket client implementation.
