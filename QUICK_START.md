# Quick Start Guide

## Installation

```bash
npm install
```

## Run the Demo

```bash
npm run dev
```

Open http://localhost:3000

## 5-Minute Demo Flow

1. **Connect Wallet** - Click the button, approve MetaMask
2. **Get Test Funds** - Click "Request Test Funds" button
3. **Create Match** - Enter opponent address + wager amount
4. **Play Rounds** - Select winner, submit results, watch balances update instantly
5. **Close Session** - Finalize and see final payouts

## Key Features

- Real-time WebSocket to ClearNode
- Dynamic chain discovery (no hardcoded addresses)
- Instant off-chain balance updates
- Full event logging

## Troubleshooting

- **Can't connect?** Check internet connection
- **Balance not updating?** Wait 2-3 seconds after faucet request
- **MetaMask issues?** Refresh page and try again

## Check Event Log

All WebSocket messages appear in the Event Log on the right side.

- Blue = Sent messages
- Green = Received messages  
- Red = Errors
- Gray = Info
