# 🟡 ClearNode Setup Guide - Yellow Network

## What is ClearNode?

ClearNode is the **WebSocket coordinator** for Yellow Network state channels. It:
- Routes off-chain state updates between participants
- Tracks channel sessions
- Enables instant transfers without gas fees

**Without ClearNode running, Yellow SDK cannot function.**

---

## Quick Start (Docker - Easiest)

### 1. Start ClearNode

```bash
# From project root
docker-compose up -d
```

**Expected output:**
```
✅ Creating yellow_db ... done
✅ Creating yellow_clearnode ... done
```

### 2. Verify ClearNode is Running

```bash
# Check logs
docker-compose logs -f clearnode

# Should see:
# ClearNode listening on ws://0.0.0.0:8001
```

### 3. Test WebSocket Connection

Open browser console at http://localhost:3001 and run:
```javascript
const ws = new WebSocket('ws://localhost:8001/ws');
ws.onopen = () => console.log('✅ Connected to ClearNode!');
ws.onerror = (e) => console.error('❌ Connection failed', e);
```

---

## Alternative: Manual Setup (If Docker Doesn't Work)

If Docker isn't available, you can run a **mock ClearNode** for testing:

```bash
# I'll create a simple mock server
npm run clearnode:mock
```

This starts a basic WebSocket server that accepts Yellow SDK messages.

---

## Verify Your App Connects

1. Start dev server: `npm run dev`
2. Open http://localhost:3001
3. Check Event Log (right side) - should show:
   - ✅ Connected to ClearNode
   - No WebSocket errors

---

## Troubleshooting

### Error: "WebSocket connection failed"
**Cause**: ClearNode not running
**Fix**: `docker-compose up -d`

### Error: "Port 8001 already in use"
**Cause**: Another service using port 8001
**Fix**: 
```bash
# Find process
netstat -ano | findstr :8001
# Kill it
taskkill /PID <pid> /F
```

### Error: "Cannot connect to Docker daemon"
**Cause**: Docker Desktop not running
**Fix**: Start Docker Desktop

---

## Next Steps

Once ClearNode is running:
1. ✅ Your app will connect automatically
2. ✅ Session open/close will work
3. ✅ Off-chain actions will be instant
4. ✅ Settlement txs will be recorded

**Return to main README for full demo flow.**
