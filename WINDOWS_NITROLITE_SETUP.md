# Nitrolite Setup for Windows

## Problem
Nitrolite repo contains files with colons (`:`) in filenames (e.g., `2025-06-25T08:21:35.json`), which are invalid on Windows NTFS filesystems.

## Solution: Use WSL2

### Step 1: Open WSL2 Ubuntu

```powershell
# Open Ubuntu terminal
wsl
```

If Ubuntu isn't installed, install it first:
```powershell
wsl --install -d Ubuntu
# Follow prompts to create username/password
# Then run: wsl
```

### Step 2: Install Dependencies in WSL2

Inside WSL2 Ubuntu terminal:

```bash
# Update packages
sudo apt-get update

# Install git (if not present)
sudo apt-get install -y git

# Install Docker (if not present)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install docker-compose
sudo apt-get install -y docker-compose

# Logout and login for docker group to take effect
exit
```

Then restart WSL:
```powershell
wsl --shutdown
wsl
```

### Step 3: Clone Nitrolite in WSL2

```bash
# Inside WSL2 Ubuntu
cd ~
git clone https://github.com/erc7824/nitrolite.git
cd nitrolite
```

### Step 4: Start Nitrolite

```bash
# Inside WSL2, in ~/nitrolite directory
docker-compose up
```

This will:
- Start Anvil blockchain on `localhost:8545`
- Start ClearNode coordinator on `ws://localhost:8000/ws`
- Deploy contracts (Custody, Adjudicator, Token)

### Step 5: Get Contract Addresses

**In a NEW terminal** (while docker-compose is running):

```powershell
wsl bash -c "cd ~/nitrolite && docker-compose logs | grep 'deployed to'"
```

You should see output like:
```
Custody deployed to: 0x8658501c98C3738026c4e5c361c6C3fa95DfB255
Adjudicator deployed to: 0xcbbc03a873c11beeFA8D99477E830be48d8Ae6D7
Token deployed to: 0xbD24c53072b9693A35642412227043Ffa5fac382
```

### Step 6: Update .env

Copy the addresses from Step 5 into your `.env` file:

```
NEXT_PUBLIC_CUSTODY_CONTRACT=0x...
NEXT_PUBLIC_ADJUDICATOR_CONTRACT=0x...
NEXT_PUBLIC_TOKEN_CONTRACT=0x...
```

### Step 7: Start Your App

```powershell
# In Windows PowerShell (your project directory)
npm run dev
```

## Network Details

- **Blockchain RPC:** http://localhost:8545
- **Chain ID:** 31337 (Anvil)
- **ClearNode WebSocket:** ws://localhost:8000/ws
- **Test Accounts:** Anvil provides 10 accounts with 10,000 ETH each

## Troubleshooting

### "Cannot connect to Docker daemon"
```bash
# In WSL2
sudo service docker start
```

### "Port already in use"
```bash
# In WSL2
docker-compose down
docker-compose up
```

### "Contract addresses not showing"
```bash
# Check logs
docker-compose logs nitrolite-setup
```

### Reset Everything
```bash
# In WSL2
docker-compose down -v
docker-compose up
```

## Quick Reference

**Start Nitrolite:**
```powershell
wsl bash -c "cd ~/nitrolite && docker-compose up"
```

**Stop Nitrolite:**
```powershell
wsl bash -c "cd ~/nitrolite && docker-compose down"
```

**View Logs:**
```powershell
wsl bash -c "cd ~/nitrolite && docker-compose logs"
```

**Get Contract Addresses:**
```powershell
wsl bash -c "cd ~/nitrolite && docker-compose logs | grep deployed"
```
