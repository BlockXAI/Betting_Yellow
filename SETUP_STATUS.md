# Nitrolite Setup Status & Next Steps

## ✅ Completed

### 1. Code Integration (Ready)
- ✅ `package.json` - Added @erc7824/nitrolite and viem dependencies
- ✅ `lib/contracts.ts` - Smart contract interaction layer
- ✅ `lib/nitroliteService.ts` - State channel service (replaces clearnode.ts)
- ✅ `components/ChannelManager.tsx` - Deposit/withdraw UI
- ✅ `.env` and `.env.example` - Configuration templates
- ✅ Documentation:
  - `NITROLITE_SETUP.md`
  - `WINDOWS_NITROLITE_SETUP.md`
  - `MIGRATION_GUIDE.md`

### 2. Dependencies
- ✅ `npm install` completed
- ✅ New packages installed: @erc7824/nitrolite, viem

### 3. WSL2 Setup
- 🔄 Ubuntu 22.04 WSL2 downloading (42% complete)

## ⏳ In Progress

- Ubuntu WSL2 installation (wait ~5 more minutes)

## 📋 Next Steps (Once Ubuntu Finishes)

### Step 1: Complete Ubuntu Setup

When the download finishes, an Ubuntu terminal will open. You'll be prompted to:
1. Create a username (e.g., your name)
2. Create a password
3. Confirm password

**Complete this setup**, then continue below.

### Step 2: Install Nitrolite in Ubuntu

**Copy and paste this entire block** into the Ubuntu terminal:

```bash
# Install dependencies
sudo apt-get update && \
sudo apt-get install -y git docker.io docker-compose && \
sudo usermod -aG docker $USER && \
newgrp docker

# Clone Nitrolite
cd ~ && \
git clone https://github.com/erc7824/nitrolite.git && \
cd nitrolite

# Start Nitrolite
docker-compose up
```

**What this does:**
- Installs git, docker, docker-compose
- Clones Nitrolite repository (works in Linux, no path issues!)
- Starts Anvil blockchain + ClearNode + Deploys contracts

### Step 3: Get Contract Addresses

**While Nitrolite is running**, open a **NEW PowerShell window** and run:

```powershell
wsl -d Ubuntu-22.04 bash -c "cd ~/nitrolite && docker-compose logs | grep 'deployed to'"
```

You should see output like:
```
Custody deployed to: 0x8658501c98C3738026c4e5c361c6C3fa95DfB255
Adjudicator deployed to: 0xcbbc03a873c11beeFA8D99477E830be48d8Ae6D7
Token deployed to: 0xbD24c53072b9693A35642412227043Ffa5fac382
```

### Step 4: Update .env

Copy those addresses into `.env`:

```env
NEXT_PUBLIC_CUSTODY_CONTRACT=0x... # from logs
NEXT_PUBLIC_ADJUDICATOR_CONTRACT=0x... # from logs  
NEXT_PUBLIC_TOKEN_CONTRACT=0x... # from logs
```

### Step 5: Start Your App

In your **original PowerShell** (project directory):

```powershell
npm run dev
```

Open http://localhost:3000

## 🎯 Expected Services Running

After setup completes:

| Service | Location | Status |
|---------|----------|--------|
| Ubuntu WSL2 | wsl -d Ubuntu-22.04 | 🔄 Installing (42%) |
| Nitrolite Docker | ~/nitrolite (in WSL2) | ⏳ Pending |
| Anvil Blockchain | http://localhost:8545 | ⏳ Pending |
| ClearNode | ws://localhost:8000/ws | ⏳ Pending |
| Your App | http://localhost:3000 | ✅ Ready (npm run dev) |

## 🔍 Verification Checklist

After starting everything:

### Nitrolite Check
```powershell
# Should return block number
curl -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://localhost:8545
```

### ClearNode Check
```powershell
# Should show WebSocket logs
wsl -d Ubuntu-22.04 bash -c "cd ~/nitrolite && docker-compose logs clearnode | tail -20"
```

### Contract Check
```powershell
# Should show 3 contract addresses
wsl -d Ubuntu-22.04 bash -c "cd ~/nitrolite && docker-compose logs | grep deployed"
```

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"
```bash
# In Ubuntu WSL2 terminal
sudo service docker start
```

### "Port 8545 already in use"
```bash
# In Ubuntu WSL2
cd ~/nitrolite
docker-compose down
docker-compose up
```

### Reset Everything
```bash
# In Ubuntu WSL2
cd ~/nitrolite
docker-compose down -v
docker-compose up
```

## 📚 Architecture Overview

```
Windows (Your Machine)
│
├─ PowerShell
│  └─ npm run dev → http://localhost:3000 (Your PvP App)
│
└─ WSL2 Ubuntu
   └─ ~/nitrolite
      ├─ Anvil (localhost:8545) - Blockchain
      ├─ ClearNode (localhost:8000/ws) - Coordinator
      └─ Contracts:
         ├─ Custody (holds deposits)
         ├─ Adjudicator (resolves disputes)
         └─ Token (ERC20 token)
```

## 🎮 Once Running: Test Flow

1. **Connect MetaMask** → Anvil network (Chain ID 31337)
2. **Deposit ETH** → Transfer to state channel (1 gas)
3. **Create Match** → Off-chain session (0 gas)
4. **Play Rounds** → Off-chain state updates (0 gas each)
5. **Close Match** → Off-chain finalization (0 gas)
6. **Withdraw** → Settle on-chain (1 gas)

**Total gas: 2 transactions** vs N traditional transactions = 83%+ savings!

---

## ⏰ Current Status: Waiting for Ubuntu

Ubuntu WSL2: **42% downloaded**

**When it reaches 100%:**
1. Terminal will open
2. Create username/password
3. Run the commands from Step 2 above
4. Get contract addresses (Step 3)
5. Update .env (Step 4)
6. Start app (Step 5)

**Estimated time remaining:** ~5 minutes
