# 🚀 Quick Deployment Instructions

## Prerequisites Checklist

- [x] Node.js installed
- [x] MetaMask wallet with private key
- [ ] Testnet AVAX (0.5 AVAX recommended)

---

## Step 1: Get Testnet AVAX

Visit the ChainLink faucet to get free testnet AVAX:

🔗 **https://faucets.chain.link/fuji**

1. Connect your MetaMask wallet
2. Click "Send me 0.5 test AVAX"
3. Wait 30 seconds for confirmation
4. Check balance: https://testnet.snowtrace.io/address/YOUR_ADDRESS

---

## Step 2: Export Your Private Key

⚠️ **Security Warning**: Never share your private key or commit it to Git!

### From MetaMask:
1. Open MetaMask
2. Click the three dots (⋮) → Account Details
3. Click "Show Private Key"
4. Enter your password
5. Copy the private key (starts with `0x`)

---

## Step 3: Deploy Contracts

### Option A: PowerShell (Recommended for Windows)

```powershell
# Set private key (will be hidden in current session)
$env:PRIVATE_KEY="0xyour_private_key_here"

# Install dependencies if needed
npm install

# Run deployment script
node scripts/deploy-avalanche.js
```

### Option B: Command Prompt

```cmd
set PRIVATE_KEY=0xyour_private_key_here
node scripts/deploy-avalanche.js
```

### Option C: Create .env.deploy file (Most Secure)

Create a file named `.env.deploy` (gitignored):
```
PRIVATE_KEY=0xyour_private_key_here
```

Then run:
```powershell
Get-Content .env.deploy | ForEach-Object { if($_ -match "^([^=]+)=(.+)$"){ $env:($matches[1])=$matches[2] } }
node scripts/deploy-avalanche.js
```

---

## Step 4: Expected Output

```
🔺 Deploying Yellow Network Contracts to Avalanche Fuji

═══════════════════════════════════════════

📡 Connecting to Avalanche Fuji...
   Deployer: 0x1234...5678
   Balance: 0.5 AVAX

1️⃣  Deploying USDC Token...
   ✅ USDC deployed: 0xabcd...ef01
   🔍 SnowTrace: https://testnet.snowtrace.io/address/0xabcd...ef01

2️⃣  Deploying WETH Token...
   ✅ WETH deployed: 0x1234...5678
   🔍 SnowTrace: https://testnet.snowtrace.io/address/0x1234...5678

3️⃣  Deploying Custody Contract...
   ✅ Custody deployed: 0xdef0...1234
   🔍 SnowTrace: https://testnet.snowtrace.io/address/0xdef0...1234

4️⃣  Deploying Adjudicator Contract...
   ✅ Adjudicator deployed: 0x5678...9abc
   🔍 SnowTrace: https://testnet.snowtrace.io/address/0x5678...9abc

═══════════════════════════════════════════

🎉 Deployment Complete!

📋 Deployed Contract Addresses:
───────────────────────────────────────────
   Custody         0xdef01234...
   Adjudicator     0x56789abc...
   USDC            0xabcdef01...
   WETH            0x12345678...

💾 Addresses saved to: deployed-addresses.txt
```

---

## Step 5: Update .env File

Copy the deployed addresses to your `.env` file:

```bash
NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_CLEARNODE_URL=ws://localhost:8001/ws

# Paste your deployed addresses here:
NEXT_PUBLIC_CUSTODY_CONTRACT=0xYourCustodyAddress
NEXT_PUBLIC_ADJUDICATOR_CONTRACT=0xYourAdjudicatorAddress
NEXT_PUBLIC_TOKEN_CONTRACT=0xYourUSDCAddress
```

---

## Step 6: Start the Application

```bash
npm run dev
```

Open http://localhost:3000 and test!

---

## Troubleshooting

### Error: "Insufficient AVAX balance"
**Solution**: Get more AVAX from faucet: https://faucets.chain.link/fuji

### Error: "PRIVATE_KEY environment variable not set"
**Solution**: Set the environment variable before running the script

### Error: "Transaction underpriced"
**Solution**: Network might be congested. Wait a minute and try again.

### Error: "Replacement fee too low"
**Solution**: Clear pending transactions in MetaMask or wait for them to complete

### Deployment stuck?
**Solution**: Check your internet connection and Avalanche Fuji network status

---

## Verify Deployment

1. Visit SnowTrace for each contract
2. Check transaction history
3. Verify contract bytecode matches
4. Test deposit/withdraw in the UI

---

## Cost Breakdown

- USDC Token: ~0.01 AVAX
- WETH Token: ~0.01 AVAX
- Custody Contract: ~0.03 AVAX
- Adjudicator Contract: ~0.02 AVAX

**Total**: ~0.07 AVAX (FREE from faucet!)

---

## Security Best Practices

✅ **DO**:
- Use a dedicated testnet wallet
- Keep private keys in environment variables
- Never commit `.env` files with keys
- Use `.env.deploy` for deployment keys (gitignored)

❌ **DON'T**:
- Hardcode private keys in scripts
- Share private keys
- Use mainnet wallets for testnet
- Commit private keys to Git

---

## Next Steps After Deployment

1. ✅ Verify all contracts on SnowTrace
2. ✅ Update `.env` with deployed addresses
3. ✅ Start development server: `npm run dev`
4. ✅ Connect MetaMask to Avalanche Fuji
5. ✅ Test deposit → play → withdraw flow
6. ✅ Export session data (Phase 2)
7. ✅ Build Merkle tree (Phase 3)

---

**Need Help?**
- Avalanche Docs: https://docs.avax.network/
- Yellow SDK: https://github.com/erc7824/nitrolite
- SnowTrace: https://testnet.snowtrace.io/
