/**
 * Phase 6: Verify Solvency Proof On-Chain
 * 
 * Verifies a published solvency proof against the on-chain SolvencyVerifier contract.
 * 
 * Usage:
 *   npx tsx scripts/verify-on-chain.ts [epoch-id]
 *   npx tsx scripts/verify-on-chain.ts epoch_1738525000000
 */

import { ethers } from 'ethers';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const AVALANCHE_FUJI_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const VERIFIER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT || '';

// SolvencyVerifier ABI
const VERIFIER_ABI = [
  'function verifyProof(bytes32 epochId, bytes32 expectedMerkleRoot) external returns (bool)',
  'function getProof(bytes32 epochId) external view returns (bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, address publisher, bool verified)',
  'function getDetailedProof(bytes32 epochId) external view returns (tuple(bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, bytes32 witnessHash, bytes32 reservesCommitment, bytes32 liabilitiesCommitment, bytes32 solvencyAssertion, address publisher, uint256 blockNumber, bool verified))',
  'function proofExists(bytes32 epochId) external view returns (bool)',
  'function getLatestProof() external view returns (bytes32 epochId, bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment)',
  'event ProofVerified(bytes32 indexed epochId, bool valid, address verifier)'
];

// Types
interface MerkleMetadata {
  root: string;
  leafCount: number;
  totalLiabilities: string;
}

/**
 * Find latest epoch
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
 * Read merkle metadata
 */
async function readMerkleMetadata(epochPath: string): Promise<MerkleMetadata> {
  const metadataPath = path.join(epochPath, 'merkle_metadata.json');
  
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error(`Failed to read merkle_metadata.json: ${error.message}`);
  }
}

/**
 * Convert epoch ID string to bytes32
 */
function epochToBytes32(epochId: string): string {
  return ethers.id(epochId);
}

/**
 * Verify proof on-chain
 */
async function verifyOnChain(
  provider: ethers.Provider,
  epochId: string,
  expectedMerkleRoot: string,
  useSigner: boolean = false
): Promise<{
  exists: boolean;
  proof?: any;
  verified?: boolean;
}> {
  console.log('📡 Connecting to verifier contract...');
  
  if (!VERIFIER_CONTRACT_ADDRESS) {
    throw new Error('NEXT_PUBLIC_VERIFIER_CONTRACT not set in .env');
  }
  
  const verifier = new ethers.Contract(
    VERIFIER_CONTRACT_ADDRESS,
    VERIFIER_ABI,
    provider
  );
  
  const epochBytes32 = epochToBytes32(epochId);
  
  // Check if proof exists
  console.log('🔍 Checking if proof exists on-chain...');
  const exists = await verifier.proofExists(epochBytes32);
  
  if (!exists) {
    return { exists: false };
  }
  
  console.log('✅ Proof found on-chain\n');
  
  // Get proof details
  const proof = await verifier.getProof(epochBytes32);
  
  console.log('📋 On-Chain Proof Details:');
  console.log(`   Merkle Root: ${proof[0]}`);
  console.log(`   Timestamp: ${new Date(Number(proof[1]) * 1000).toISOString()}`);
  console.log(`   Is Solvent: ${proof[2] ? '✅ YES' : '❌ NO'}`);
  console.log(`   Commitment: ${proof[3]}`);
  console.log(`   Publisher: ${proof[4]}`);
  console.log(`   Verified: ${proof[5] ? '✅ YES' : '⏳ PENDING'}`);
  
  // Verify merkle root matches
  const merkleRootMatches = proof[0] === expectedMerkleRoot;
  console.log(`\n🌳 Merkle Root Verification: ${merkleRootMatches ? '✅ MATCH' : '❌ MISMATCH'}`);
  
  if (!merkleRootMatches) {
    console.log(`   Expected: ${expectedMerkleRoot}`);
    console.log(`   On-Chain: ${proof[0]}`);
  }
  
  return {
    exists: true,
    proof: {
      merkleRoot: proof[0],
      timestamp: Number(proof[1]),
      isSolvent: proof[2],
      commitment: proof[3],
      publisher: proof[4],
      verified: proof[5]
    },
    verified: merkleRootMatches
  };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  let epochId: string | null = null;
  
  console.log('\n🔍 On-Chain Proof Verifier - Phase 6\n');
  console.log('═'.repeat(60));
  
  // Determine epoch
  if (args.length > 0) {
    epochId = args[0];
  } else {
    console.log('⏳ No epoch specified, finding latest...');
    epochId = await findLatestEpoch();
  }
  
  if (!epochId) {
    console.error('\n❌ Error: No epoch found\n');
    console.log('Usage: npx tsx scripts/verify-on-chain.ts <epoch-id>\n');
    process.exit(1);
  }
  
  const epochPath = path.join(process.cwd(), 'solvency', 'epochs', epochId);
  console.log(`📁 Epoch: ${epochId}\n`);
  
  // Verify epoch directory exists
  try {
    await fs.access(epochPath);
  } catch {
    console.error(`❌ Epoch directory not found: ${epochPath}\n`);
    process.exit(1);
  }
  
  try {
    // Step 1: Read local metadata
    console.log('1️⃣  Reading local metadata...');
    const merkle = await readMerkleMetadata(epochPath);
    
    console.log(`🌳 Expected Merkle Root: ${merkle.root}`);
    console.log(`📊 Total Liabilities: ${ethers.formatEther(merkle.totalLiabilities)} AVAX`);
    
    // Step 2: Connect to blockchain
    console.log('\n2️⃣  Connecting to Avalanche Fuji...');
    const provider = new ethers.JsonRpcProvider(AVALANCHE_FUJI_RPC);
    
    const network = await provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Step 3: Verify on-chain
    console.log('\n3️⃣  Verifying proof on-chain...\n');
    
    const result = await verifyOnChain(provider, epochId, merkle.root);
    
    if (!result.exists) {
      console.log('\n❌ Proof not found on-chain');
      console.log('\nTo publish this proof:');
      console.log(`   npx tsx scripts/publish-proof.ts ${epochId}\n`);
      process.exit(1);
    }
    
    // Step 4: Display results
    console.log('\n' + '═'.repeat(60));
    
    if (result.verified) {
      console.log('✅ PROOF VERIFIED SUCCESSFULLY!\n');
      console.log('The on-chain proof matches local metadata.');
      console.log('Solvency status has been cryptographically verified.\n');
      
      console.log('📊 Verification Summary:');
      console.log(`   ✅ Proof exists on-chain`);
      console.log(`   ✅ Merkle root matches`);
      console.log(`   ✅ Publisher: ${result.proof?.publisher}`);
      console.log(`   ✅ Timestamp: ${new Date(result.proof?.timestamp * 1000).toISOString()}`);
      console.log(`   ${result.proof?.isSolvent ? '✅' : '❌'} Is Solvent: ${result.proof?.isSolvent ? 'YES' : 'NO'}`);
      
      console.log('\n🔗 View on SnowTrace:');
      console.log(`   Contract: https://testnet.snowtrace.io/address/${VERIFIER_CONTRACT_ADDRESS}\n`);
      
      process.exit(0);
    } else {
      console.log('❌ PROOF VERIFICATION FAILED\n');
      console.log('The on-chain proof does not match local metadata.');
      console.log('This could indicate:');
      console.log('   - Data tampering');
      console.log('   - Incorrect epoch');
      console.log('   - Proof was updated\n');
      
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.log('\n💡 This might be because:');
      console.log('   - Verifier contract not deployed');
      console.log('   - Wrong contract address in .env');
      console.log('   - Network mismatch');
    }
    
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

export { verifyOnChain, epochToBytes32, findLatestEpoch };
