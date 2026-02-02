/**
 * Phase 4: Reserves Scanner
 * 
 * Scans on-chain reserves from Custody contract on Avalanche Fuji
 * Compares reserves vs liabilities for solvency verification
 * 
 * Usage:
 *   npx tsx scripts/scan-reserves.ts [epoch-id]
 *   npx tsx scripts/scan-reserves.ts epoch_1738525000000
 * 
 * If no epoch-id provided, uses latest epoch
 * 
 * Outputs:
 *   - solvency/epochs/<epoch>/reserves.json
 */

import { ethers } from 'ethers';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const AVALANCHE_FUJI_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const CUSTODY_CONTRACT = process.env.NEXT_PUBLIC_CUSTODY_CONTRACT || '0x44b43cd9e870f76ddD3Ab004348aB38a634bD870';

// Minimal ABI for balance checking
const CUSTODY_ABI = [
  'function getBalance() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
];

// Types
interface MerkleMetadata {
  root: string;
  leafCount: number;
  treeDepth: number;
  totalLiabilities: string;
  participants: Array<{
    address: string;
    balance: string;
    leaf: string;
  }>;
  generatedAt: string;
}

interface ReservesData {
  epoch: string;
  network: string;
  chainId: number;
  custodyContract: string;
  reserves: {
    native: string;
    nativeFormatted: string;
  };
  liabilities: {
    total: string;
    totalFormatted: string;
    participantCount: number;
  };
  solvency: {
    isSolvent: boolean;
    ratio: string;
    excess: string;
    excessFormatted: string;
  };
  timestamp: number;
  timestampISO: string;
  scannedAt: string;
}

/**
 * Find latest epoch directory
 */
async function findLatestEpoch(): Promise<string | null> {
  const epochsDir = path.join(process.cwd(), 'solvency', 'epochs');
  
  try {
    const entries = await fs.readdir(epochsDir, { withFileTypes: true });
    const epochDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('epoch_'))
      .map(e => e.name)
      .sort()
      .reverse();
    
    return epochDirs.length > 0 ? epochDirs[0] : null;
  } catch {
    return null;
  }
}

/**
 * Read Merkle metadata to get total liabilities
 */
async function readMerkleMetadata(epochPath: string): Promise<MerkleMetadata> {
  const metadataPath = path.join(epochPath, 'merkle_metadata.json');
  
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error(`Failed to read merkle metadata: ${error.message}`);
  }
}

/**
 * Scan reserves from Custody contract
 */
async function scanReserves(provider: ethers.Provider): Promise<bigint> {
  console.log(`📡 Connecting to Custody contract: ${CUSTODY_CONTRACT}`);
  
  // Get native AVAX balance directly from contract address
  const balance = await provider.getBalance(CUSTODY_CONTRACT);
  
  console.log(`💰 Native AVAX balance: ${ethers.formatEther(balance)} AVAX`);
  
  return balance;
}

/**
 * Calculate solvency metrics
 */
function calculateSolvency(reserves: bigint, liabilities: bigint) {
  const isSolvent = reserves >= liabilities;
  const excess = reserves - liabilities;
  
  // Calculate ratio as percentage (reserves / liabilities * 100)
  let ratio = '0';
  if (liabilities > BigInt(0)) {
    // Use basis points for precision (10000 = 100%)
    const ratioBps = (reserves * BigInt(10000)) / liabilities;
    ratio = (Number(ratioBps) / 100).toFixed(2);
  } else if (reserves > BigInt(0)) {
    ratio = '∞';
  } else {
    ratio = '100.00';
  }
  
  return {
    isSolvent,
    ratio: `${ratio}%`,
    excess: excess.toString(),
    excessFormatted: ethers.formatEther(excess)
  };
}

/**
 * Save reserves data to JSON
 */
async function saveReservesData(epochPath: string, data: ReservesData): Promise<void> {
  const reservesPath = path.join(epochPath, 'reserves.json');
  await fs.writeFile(reservesPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 Saved reserves data to: reserves.json`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  let epochId: string | null = null;
  
  // Determine epoch
  if (args.length > 0) {
    epochId = args[0];
  } else {
    console.log('⏳ No epoch specified, finding latest...');
    epochId = await findLatestEpoch();
  }
  
  if (!epochId) {
    console.error('\n❌ Error: No epoch found\n');
    console.log('Usage: npx tsx scripts/scan-reserves.ts <epoch-id>\n');
    console.log('Or create an epoch first using the frontend or API\n');
    process.exit(1);
  }
  
  const epochPath = path.join(process.cwd(), 'solvency', 'epochs', epochId);
  
  console.log('\n💰 Reserves Scanner - Phase 4\n');
  console.log('═'.repeat(60));
  console.log(`📁 Epoch: ${epochId}`);
  console.log(`📂 Path: ${epochPath}`);
  console.log(`🌐 Network: Avalanche Fuji Testnet`);
  console.log(`📍 RPC: ${AVALANCHE_FUJI_RPC}`);
  console.log(`🏦 Custody: ${CUSTODY_CONTRACT}\n`);
  
  // Verify epoch directory exists
  try {
    await fs.access(epochPath);
  } catch {
    console.error(`❌ Epoch directory not found: ${epochPath}\n`);
    console.log('Tip: Run merkle tree builder first\n');
    process.exit(1);
  }
  
  try {
    // Step 1: Read liabilities from Merkle metadata
    console.log('1️⃣  Reading liabilities from Merkle metadata...');
    const metadata = await readMerkleMetadata(epochPath);
    const totalLiabilities = BigInt(metadata.totalLiabilities);
    
    console.log(`📊 Total Liabilities: ${ethers.formatEther(totalLiabilities)} AVAX`);
    console.log(`👥 Participants: ${metadata.leafCount}`);
    
    // Step 2: Connect to Avalanche Fuji
    console.log('\n2️⃣  Connecting to Avalanche Fuji...');
    const provider = new ethers.JsonRpcProvider(AVALANCHE_FUJI_RPC);
    
    // Verify connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to chain ID: ${network.chainId}`);
    
    if (network.chainId !== BigInt(43113)) {
      console.warn(`⚠️  Warning: Expected chain ID 43113 (Fuji), got ${network.chainId}`);
    }
    
    // Step 3: Scan reserves
    console.log('\n3️⃣  Scanning reserves from Custody contract...');
    const reserves = await scanReserves(provider);
    
    // Step 4: Calculate solvency
    console.log('\n4️⃣  Calculating solvency...');
    const solvency = calculateSolvency(reserves, totalLiabilities);
    
    console.log(`\n📊 Solvency Analysis:`);
    console.log(`   Reserves:    ${ethers.formatEther(reserves)} AVAX`);
    console.log(`   Liabilities: ${ethers.formatEther(totalLiabilities)} AVAX`);
    console.log(`   Ratio:       ${solvency.ratio}`);
    console.log(`   Excess:      ${solvency.excessFormatted} AVAX`);
    console.log(`   Status:      ${solvency.isSolvent ? '✅ SOLVENT' : '❌ INSOLVENT'}`);
    
    // Step 5: Save results
    console.log('\n5️⃣  Saving reserves data...');
    
    const reservesData: ReservesData = {
      epoch: epochId,
      network: 'Avalanche Fuji Testnet',
      chainId: Number(network.chainId),
      custodyContract: CUSTODY_CONTRACT,
      reserves: {
        native: reserves.toString(),
        nativeFormatted: ethers.formatEther(reserves)
      },
      liabilities: {
        total: totalLiabilities.toString(),
        totalFormatted: ethers.formatEther(totalLiabilities),
        participantCount: metadata.leafCount
      },
      solvency: solvency,
      timestamp: Math.floor(Date.now() / 1000),
      timestampISO: new Date().toISOString(),
      scannedAt: new Date().toISOString()
    };
    
    await saveReservesData(epochPath, reservesData);
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Reserves scan complete!\n');
    console.log('📋 Generated Files:');
    console.log(`   - reserves.json\n`);
    
    if (solvency.isSolvent) {
      console.log('✅ System is SOLVENT! Reserves cover all liabilities.\n');
    } else {
      console.log('❌ WARNING: System is INSOLVENT! Reserves < liabilities.\n');
    }
    
    // Exit with appropriate code
    process.exit(solvency.isSolvent ? 0 : 1);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

export { 
  scanReserves, 
  readMerkleMetadata, 
  calculateSolvency,
  saveReservesData,
  findLatestEpoch
};
