# Yellow + SolvencyProof Integration Plan

## 🎯 Goal
Bridge the PvP Wager Demo with Yellow SDK to generate cryptographic solvency proofs that demonstrate:
**Total Reserves (on-chain) ≥ Total Liabilities (off-chain)**

---

## 📊 Current System Status

### ✅ What We Have (Yellow SDK Infrastructure)

| Component | Status | Details |
|-----------|--------|---------|
| Yellow SDK | ✅ Installed | `@erc7824/nitrolite` v0.1.0 |
| Smart Contracts | ✅ Deployed | Custody, Adjudicator, USDC, WETH on Anvil (localhost) |
| Contract Integration | ✅ Created | `lib/contracts.ts` with deposit/withdraw functions |
| State Channel Service | ✅ Created | `lib/nitroliteService.ts` with EIP-712 signing |
| Off-chain Updates | ✅ Supported | PvP session allocations tracked in real-time |
| WebSocket Coordinator | ✅ Ready | ClearNode running on ws://localhost:8001 |
| On-chain Settlement | ✅ Coded | Channel close triggers on-chain finalization |

### ❌ What We're Missing (SolvencyProof Integration)

| Component | Status | Required For |
|-----------|--------|--------------|
| Frontend Migration | ❌ Missing | App still uses old sandbox, not Yellow SDK |
| Session State Export | ❌ Missing | Export final allocations to CSV/JSON |
| Merkle Tree Builder | ❌ Missing | Convert liabilities to Merkle root |
| Inclusion File Generator | ❌ Missing | Per-user Merkle proof files |
| Reserves Scanner | ❌ Missing | Read on-chain balances from custody contract |
| ZK Proof Circuit | ❌ Missing | Circom circuit for solvency proof |
| ZK Prover Backend | ❌ Missing | Generate proof.json + publicSignals.json |
| Sepolia Deployment | ❌ Missing | Deploy SolvencyRegistry contract on Sepolia |
| Proof Publisher | ❌ Missing | Submit proofs to Sepolia contract |
| Public Dashboard | ❌ Missing | Display verified epochs and proofs |

---

## 🔄 Flow Comparison

### Current System Flow (Incomplete)

```
User Actions (Frontend)
    ↓
Yellow Session (Off-chain) ← 🛑 STOPS HERE
    ↓
[NO EXPORT] ← 🛑 GAP
    ↓
[NO SOLVENCY PROOF]
```

### Required Yellow + SolvencyProof Flow

```
User Actions (Frontend - PvP Wager Demo)
    ↓
Yellow Session (Off-chain, instant updates)
    | • Player A deposits ETH
    | • Player B deposits ETH  
    | • Round 1: A wins (+5, B -5)
    | • Round 2: B wins (+5, A -5)
    | • Multiple rounds...
    ↓
Close Session → Settlement (1 on-chain tx)
    ↓
Export Final State → CSV/JSON
    | Liabilities:
    | - Player A: 0.15 ETH
    | - Player B: 0.05 ETH
    ↓
Build Merkle Tree
    | liabilities_root: 0xabc123...
    | inclusion_playerA.json
    | inclusion_playerB.json
    ↓
Scan Reserves (On-chain)
    | Custody Contract: 0.25 ETH (≥ 0.20 liabilities ✅)
    ↓
Generate ZK Proof
    | Prove: reserves_total ≥ sum(liabilities)
    | Output: proof.json, publicSignals.json
    ↓
Publish to Sepolia
    | SolvencyRegistry.submitProof(epoch, root, proof)
    | → Event: SolvencyProved(epoch, root, reserves)
    ↓
Public Dashboard
    | Users verify inclusion + onchain proof
    | Yellow judges see: SDK usage ✅ + Settlement tx ✅ + Solvency proof ✅
```

---

## 🎯 Gap Analysis Summary

### Gap 1: Frontend Not Using Yellow SDK ❌
**Issue:** `app/page.tsx` still connects to sandbox WebSocket (`wss://sandbox.clearnode.yellow.com`)  
**Impact:** Yellow SDK features (deposits, withdrawals, local ClearNode) are not active  
**Severity:** 🔴 Critical - Blocks everything else

### Gap 2: No Session State Export ❌
**Issue:** When a session closes, final allocations are not exported to CSV/JSON  
**Impact:** Cannot feed liabilities into Merkle tree builder  
**Severity:** 🔴 Critical - Required by Yellow track

### Gap 3: No Merkle Tree Builder ❌
**Issue:** No backend service to convert liabilities → Merkle tree → root + inclusion files  
**Impact:** Cannot generate user inclusion proofs  
**Severity:** 🔴 Critical - Required for solvency proof

### Gap 4: No Reserves Scanner ❌
**Issue:** No service to read custody contract balance on Sepolia  
**Impact:** Cannot prove reserves ≥ liabilities  
**Severity:** 🔴 Critical - Core solvency proof requirement

### Gap 5: No ZK Proof Generation ❌
**Issue:** No Circom circuit + snarkjs prover for solvency proof  
**Impact:** Cannot generate cryptographic proof  
**Severity:** 🔴 Critical - Core solvency proof requirement

### Gap 6: No Sepolia Deployment ❌
**Issue:** Contracts only on Anvil (localhost), not Sepolia testnet  
**Impact:** Cannot publish proofs publicly  
**Severity:** 🟡 High - Required for public verification

### Gap 7: No Public Dashboard ❌
**Issue:** Users/judges can't view proofs and verify inclusion  
**Impact:** Reduced credibility, harder to judge  
**Severity:** 🟢 Medium - Nice to have

---

## 📋 Implementation Plan

### Phase 1: Complete Yellow SDK Frontend Migration ⏱️ 4-6 hours

**Goal:** Activate all Yellow SDK features in the UI

**Tasks:**
1. ✅ Update `app/page.tsx` to use `NitroliteService` instead of `ClearNodeClient`
2. ✅ Add `ChannelManager` component to UI for deposits/withdrawals
3. ✅ Connect to local ClearNode (`ws://localhost:8001/ws`)
4. ✅ Test full flow: deposit → play → withdraw
5. ✅ Verify settlement transaction is recorded on Anvil

**Deliverable:** Fully functional Yellow SDK PvP demo with on-chain deposits/withdrawals

**Files to Modify:**
- `app/page.tsx` - Replace ClearNodeClient with NitroliteService
- `app/layout.tsx` - Add ChannelManager component
- `lib/wallet.ts` - Ensure MetaMask connects to Anvil (Chain ID 31337)

---

### Phase 2: Add Session State Export ⏱️ 2-3 hours

**Goal:** Export final session allocations to CSV/JSON format

**Tasks:**
1. ✅ Create `lib/sessionExporter.ts` service
2. ✅ Hook into `closeAppSession` in `NitroliteService`
3. ✅ Generate CSV format:
   ```csv
   address,balance
   0x123...,0.15
   0x456...,0.05
   ```
4. ✅ Store exports in `solvency/epochs/<epoch_id>/liabilities.csv`
5. ✅ Add admin endpoint: `POST /api/export-epoch`

**Deliverable:** Automatic CSV export of session liabilities after settlement

**Files to Create:**
- `lib/sessionExporter.ts` - Export service
- `solvency/epochs/<epoch>/liabilities.csv` - Output files
- `app/api/export-epoch/route.ts` - API endpoint

---

### Phase 3: Build Merkle Tree Backend ⏱️ 4-5 hours

**Goal:** Convert liabilities CSV → Merkle tree → root + inclusion files

**Tasks:**
1. ✅ Install merkletreejs library
2. ✅ Create `scripts/build-merkle-tree.ts`
3. ✅ Read `liabilities.csv` → hash each entry
4. ✅ Build Merkle tree → compute root
5. ✅ Generate `inclusion_<address>.json` for each user:
   ```json
   {
     "leaf": "0x...",
     "proof": ["0x...", "0x..."],
     "root": "0x..."
   }
   ```
6. ✅ Store outputs in `solvency/epochs/<epoch>/`

**Deliverable:** Merkle tree builder script + inclusion files

**Files to Create:**
- `scripts/build-merkle-tree.ts` - Main builder
- `solvency/epochs/<epoch>/merkle_root.txt` - Root hash
- `solvency/epochs/<epoch>/inclusion_<address>.json` - Per-user proofs

---

### Phase 4: Build Reserves Scanner ⏱️ 2-3 hours

**Goal:** Read custody contract balance on Sepolia

**Tasks:**
1. ✅ Create `scripts/scan-reserves.ts`
2. ✅ Connect to Sepolia RPC (Alchemy/Infura)
3. ✅ Read balance from custody contract:
   ```typescript
   const reserves = await custodyContract.balanceOf(custodyAddress);
   ```
4. ✅ Read token balances (USDC/WETH) if applicable
5. ✅ Output `reserves.json`:
   ```json
   {
     "epoch": "20260130-001",
     "reserves_eth": "0.25",
     "reserves_usdc": "100.00",
     "timestamp": 1738252800
   }
   ```

**Deliverable:** Reserves scanner script + reserves.json

**Files to Create:**
- `scripts/scan-reserves.ts` - Scanner script
- `solvency/epochs/<epoch>/reserves.json` - Output

---

### Phase 5: Integrate ZK Proof Generation ⏱️ 6-8 hours

**Goal:** Generate cryptographic proof that reserves ≥ liabilities

**Tasks:**
1. ✅ Install circom + snarkjs
2. ✅ Create Circom circuit `circuits/solvency.circom`:
   ```circom
   template Solvency() {
       signal input reserves_total;
       signal input liabilities_root;
       signal input liabilities_sum;
       
       // Prove: reserves_total >= liabilities_sum
       signal output valid;
       valid <== (reserves_total >= liabilities_sum) ? 1 : 0;
   }
   ```
3. ✅ Compile circuit → generate proving/verification keys
4. ✅ Create `scripts/generate-proof.ts`:
   - Read `liabilities.csv` → compute sum
   - Read `reserves.json` → get reserves_total
   - Generate witness
   - Generate proof with snarkjs
   - Output `proof.json` + `publicSignals.json`
5. ✅ Store outputs in `solvency/epochs/<epoch>/`

**Deliverable:** ZK proof generation pipeline

**Files to Create:**
- `circuits/solvency.circom` - Circuit definition
- `scripts/compile-circuit.sh` - Build script
- `scripts/generate-proof.ts` - Proof generator
- `solvency/epochs/<epoch>/proof.json` - ZK proof
- `solvency/epochs/<epoch>/publicSignals.json` - Public inputs

---

### Phase 6: Deploy Contracts to Sepolia ⏱️ 3-4 hours

**Goal:** Deploy Yellow contracts + SolvencyRegistry to Sepolia testnet

**Tasks:**
1. ✅ Get Sepolia ETH from faucet
2. ✅ Deploy Yellow contracts (Custody, Adjudicator, Tokens) to Sepolia
3. ✅ Create `contracts/SolvencyRegistry.sol`:
   ```solidity
   contract SolvencyRegistry {
       event SolvencyProved(
           string indexed epoch,
           bytes32 liabilities_root,
           uint256 reserves_total,
           address prover
       );
       
       function submitProof(
           string calldata epoch,
           bytes32 root,
           bytes calldata proof
       ) external {
           // Verify ZK proof
           require(verifier.verifyProof(proof, publicSignals), "Invalid proof");
           emit SolvencyProved(epoch, root, reserves_total, msg.sender);
       }
   }
   ```
4. ✅ Deploy `SolvencyRegistry` to Sepolia
5. ✅ Update `.env` with Sepolia contract addresses

**Deliverable:** All contracts live on Sepolia testnet

**Files to Create:**
- `contracts/SolvencyRegistry.sol` - Registry contract
- `scripts/deploy-sepolia.ts` - Deployment script
- `.env.sepolia` - Sepolia configuration

---

### Phase 7: Build Proof Publisher ⏱️ 2-3 hours

**Goal:** Submit proofs to Sepolia SolvencyRegistry contract

**Tasks:**
1. ✅ Create `scripts/publish-proof.ts`
2. ✅ Read `proof.json` + `publicSignals.json`
3. ✅ Call `SolvencyRegistry.submitProof(epoch, root, proof)`
4. ✅ Wait for transaction confirmation
5. ✅ Store tx hash in `solvency/epochs/<epoch>/settlement_tx.txt`
6. ✅ Add admin UI: "Publish Proof to Sepolia" button

**Deliverable:** Proof publishing script + UI

**Files to Create:**
- `scripts/publish-proof.ts` - Publisher script
- `app/api/publish-proof/route.ts` - API endpoint
- `components/AdminPanel.tsx` - Admin UI

---

### Phase 8: Build Public Dashboard ⏱️ 4-5 hours

**Goal:** Public interface for users/judges to verify proofs

**Tasks:**
1. ✅ Create `app/solvency/page.tsx` - Public dashboard
2. ✅ Fetch `SolvencyProved` events from Sepolia
3. ✅ Display epoch list with:
   - Epoch ID
   - Liabilities root
   - Reserves total
   - Settlement tx link (Sepolia Etherscan)
   - Proof verification status ✅/❌
4. ✅ Allow user to upload `inclusion_<address>.json` and verify locally
5. ✅ Show result: "Your balance of X ETH is included in epoch Y ✅"

**Deliverable:** Public solvency dashboard

**Files to Create:**
- `app/solvency/page.tsx` - Dashboard UI
- `lib/proofVerifier.ts` - Client-side Merkle verification
- `components/EpochCard.tsx` - Epoch display component

---

## 📊 Implementation Timeline

| Phase | Duration | Dependencies | Output |
|-------|----------|--------------|--------|
| Phase 1 | 4-6 hrs | None | ✅ Yellow SDK active in UI |
| Phase 2 | 2-3 hrs | Phase 1 | ✅ CSV export after settlement |
| Phase 3 | 4-5 hrs | Phase 2 | ✅ Merkle tree + inclusion files |
| Phase 4 | 2-3 hrs | Phase 3 | ✅ Reserves scanner |
| Phase 5 | 6-8 hrs | Phase 3, 4 | ✅ ZK proof generation |
| Phase 6 | 3-4 hrs | None (parallel) | ✅ Sepolia contracts |
| Phase 7 | 2-3 hrs | Phase 5, 6 | ✅ Proof publisher |
| Phase 8 | 4-5 hrs | Phase 7 | ✅ Public dashboard |

**Total Estimated Time:** 27-37 hours (~1 week of focused work)

**Critical Path:** Phase 1 → 2 → 3 → 5 → 7 → 8

---

## 🎯 Final System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PvP Wager Demo (Frontend)                    │
│  • Deposit ETH to Yellow state channel (on-chain)               │
│  • Play PvP rounds (off-chain, instant updates)                 │
│  • Close session → Settlement (on-chain tx)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Yellow SDK State Channel Layer                      │
│  • NitroliteService (ClearNode WebSocket coordinator)           │
│  • Off-chain allocations tracking                               │
│  • EIP-712 signatures for state transitions                     │
│  • On-chain settlement via Custody contract                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Session State Exporter (Phase 2)                    │
│  • Export final allocations → liabilities.csv                   │
│  • Timestamp + epoch metadata                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Merkle Tree Builder (Phase 3)                       │
│  • liabilities.csv → Merkle tree                                │
│  • Output: liabilities_root + inclusion_<user>.json files       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ├──────────────┐
                         ▼              ▼
┌──────────────────────────────┐  ┌─────────────────────────────┐
│  Reserves Scanner (Phase 4)  │  │  Merkle Root + Liabilities  │
│  • Read Sepolia Custody      │  │  • liabilities_root         │
│  • reserves_total            │  │  • liabilities_sum          │
└──────────────┬───────────────┘  └──────────────┬──────────────┘
               │                                  │
               └──────────────┬───────────────────┘
                              ▼
                  ┌─────────────────────────────┐
                  │  ZK Prover (Phase 5)        │
                  │  • Circom circuit           │
                  │  • Prove: reserves ≥ sum    │
                  │  • proof.json               │
                  └──────────────┬──────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │  Proof Publisher (Phase 7)  │
                  │  • Submit to Sepolia        │
                  │  • SolvencyRegistry.submit  │
                  │  • Event: SolvencyProved    │
                  └──────────────┬──────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │  Public Dashboard (Phase 8) │
                  │  • View epochs + proofs     │
                  │  • Verify inclusion         │
                  │  • Sepolia tx links         │
                  └─────────────────────────────┘
```

---

## 🏆 Yellow Prize Eligibility Checklist

### Required for Yellow Track:

- ✅ Yellow SDK usage (`@erc7824/nitrolite`)
- ✅ Off-chain session-based transactions (multiple rounds)
- ✅ On-chain settlement transaction (channel close)
- ✅ Integration with solvency proof system
- ✅ Public verification (Sepolia + dashboard)
- ✅ Demo showing complete flow

### What Judges Will See:

1. **Yellow SDK Demo:**
   - User deposits ETH → Opens state channel (on-chain tx)
   - Plays multiple PvP rounds → Instant off-chain updates
   - Closes channel → Settlement tx on Sepolia

2. **SolvencyProof Integration:**
   - Final session state → Exported to CSV
   - CSV → Merkle tree → liabilities_root
   - Reserves scanned from Sepolia custody contract
   - ZK proof generated: reserves ≥ liabilities
   - Proof published to Sepolia SolvencyRegistry

3. **Public Verification:**
   - Dashboard shows epoch with Yellow settlement tx hash
   - Users download inclusion file → Verify locally
   - Anyone can verify proof on-chain (Sepolia)

---

## 🚀 Next Steps

**Immediate Action:** Start with Phase 1 (Frontend Migration)

This will:
1. Unblock all Yellow SDK features
2. Enable testing of deposit → play → settle flow
3. Generate the settlement tx needed for solvency proof pipeline

**Command:**
```bash
# Start Phase 1 implementation
# Migrate app/page.tsx to use NitroliteService
```

Would you like me to proceed with Phase 1 implementation now?
