# Solvency Proof Data

This directory contains exported session data and solvency proof artifacts.

## Directory Structure

```
solvency/
├── epochs/
│   ├── 20260130-123456/
│   │   ├── liabilities.csv       # CSV export of user balances
│   │   ├── session.json          # Full session data
│   │   ├── metadata.json         # Epoch metadata
│   │   ├── merkle_root.txt       # Merkle tree root hash (Phase 3)
│   │   ├── inclusion_*.json      # Per-user inclusion proofs (Phase 3)
│   │   ├── reserves.json         # On-chain reserves scan (Phase 4)
│   │   ├── proof.json            # ZK proof data (Phase 5)
│   │   └── publicSignals.json    # ZK public signals (Phase 5)
│   └── ...
└── README.md
```

## Phase 2: Session Export ✅

### Files Generated

When a session closes, the following files are automatically generated:

#### 1. `liabilities.csv`
CSV format of final user balances:
```csv
address,balance
0x1234...,0.15
0x5678...,0.05
```

#### 2. `session.json`
Complete session data including:
- Epoch ID
- Session ID
- Participants
- Final allocations
- Total rounds
- Total liabilities
- Export timestamp

#### 3. `metadata.json`
Quick reference metadata:
- Epoch ID
- Participant count
- Total liabilities
- Export date/time

### API Endpoints

#### Export Session
```bash
POST /api/export-epoch
Content-Type: application/json

{
  "sessionId": "channel-abc123",
  "participants": ["0x123...", "0x456..."],
  "allocations": {
    "0x123...": "0.15",
    "0x456...": "0.05"
  },
  "timestamp": 1738252800000,
  "rounds": 5
}
```

Response:
```json
{
  "success": true,
  "data": {
    "epochId": "20260130-123456",
    "csvPath": "/path/to/liabilities.csv",
    "jsonPath": "/path/to/session.json",
    "totalLiabilities": "0.2000",
    "participantCount": 2
  }
}
```

#### List Epochs
```bash
GET /api/export-epoch
```

Response:
```json
{
  "success": true,
  "data": {
    "epochs": ["20260130-123456", "20260130-123457"],
    "count": 2
  }
}
```

#### Get Epoch Data
```bash
GET /api/export-epoch?epochId=20260130-123456
```

Response:
```json
{
  "success": true,
  "data": {
    "metadata": { ... },
    "csv": "address,balance\n..."
  }
}
```

## Usage

### Automatic Export
Sessions are automatically exported when closed via the UI.

### Manual Export
Use the "Re-export Data" button in the closed session screen.

### Programmatic Export
```typescript
import { sessionExporter } from '@/lib/sessionExporter';

const result = await sessionExporter.exportSession({
  sessionId: 'channel-123',
  participants: ['0x123...', '0x456...'],
  allocations: {
    '0x123...': '0.15',
    '0x456...': '0.05',
  },
  timestamp: Date.now(),
  rounds: 5,
});

console.log('Exported to epoch:', result.epochId);
```

## Next Phases

### Phase 3: Merkle Tree (Planned)
- Build Merkle tree from liabilities.csv
- Generate inclusion proofs for each user
- Output: `merkle_root.txt`, `inclusion_*.json`

### Phase 4: Reserves Scanner (Planned)
- Scan custody contract balance
- Read token balances (USDC/WETH)
- Output: `reserves.json`

### Phase 5: ZK Proof Generation (Planned)
- Generate cryptographic solvency proof
- Prove: reserves ≥ total liabilities
- Output: `proof.json`, `publicSignals.json`

### Phase 6: Sepolia Deployment (Planned)
- Deploy SolvencyRegistry contract
- Submit proofs on-chain
- Enable public verification

## Security Notes

⚠️ **Important**: This directory contains sensitive user data.

- Session data includes wallet addresses and balances
- Do not commit epoch data to public repositories
- The `.gitignore` is configured to exclude `epochs/*` by default
- Only commit the directory structure and documentation

## Verification

To verify an epoch's integrity:

1. Check `metadata.json` for basic info
2. Parse `liabilities.csv` and sum balances
3. Compare with `metadata.totalLiabilities`
4. Verify timestamp matches expected session close time

## Troubleshooting

### "Failed to export session"
- Check that the session has valid allocation data
- Ensure write permissions for `solvency/epochs/` directory
- Check server logs for detailed error messages

### "Epoch not found"
- Verify the epoch ID format: `YYYYMMDD-HHMMSS`
- List all epochs with `GET /api/export-epoch`
- Check that the epoch directory exists

### CSV parsing errors
- Ensure CSV format: `address,balance` header + data rows
- Check for proper UTF-8 encoding
- Verify no trailing commas or whitespace

---

**Status**: Phase 2 Complete ✅  
**Next**: Phase 3 - Merkle Tree Builder  
**Updated**: Jan 30, 2026
