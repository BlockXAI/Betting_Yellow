/**
 * Phase 6: Publish Solvency Proof On-Chain
 * 
 * Publishes a generated solvency proof to the SolvencyVerifier contract
 * on Avalanche Fuji testnet for public verification.
 * 
 * Usage:
 *   npx tsx scripts/publish-proof.ts [epoch-id]
 *   npx tsx scripts/publish-proof.ts epoch_1738525000000
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const AVALANCHE_FUJI_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const CHAIN_ID = 43113;
const VERIFIER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT || '';

// SolvencyVerifier ABI
const VERIFIER_ABI = [
  'function publishProof(bytes32 epochId, bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, bytes32 witnessHash, bytes32 reservesCommitment, bytes32 liabilitiesCommitment, bytes32 solvencyAssertion) external',
  'function getProof(bytes32 epochId) external view returns (bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, address publisher, bool verified)',
  'function proofExists(bytes32 epochId) external view returns (bool)',
  'event ProofPublished(bytes32 indexed epochId, bytes32 indexed merkleRoot, bool isSolvent, address publisher, uint256 timestamp)'
];

// Types
interface ProofData {
  version: string;
  type: string;
  epoch: string;
  publicSignals: {
    merkle_root: string;
    timestamp: number;
    is_solvent: boolean;
  };
  proof: {
    commitment: string;
    witness_hash: string;
    reserves_commitment: string;
    liabilities_commitment: string;
    solvency_assertion: string;
  };
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
 * Read proof data
 */
async function readProof(epochPath: string): Promise<ProofData> {
  const proofPath = path.join(epochPath, 'proof.json');
  
  try {
    const content = await fs.readFile(proofPath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error(`Failed to read proof.json: ${error.message}`);
  }
}

/**
 * Convert epoch ID string to bytes32
 */
function epochToBytes32(epochId: string): string {
  // Convert epoch string to bytes32
  return ethers.id(epochId);
}

/**
 * Publish proof to on-chain verifier
 */
async function publishProof(
  signer: ethers.Signer,
  proof: ProofData,
  epochId: string
): Promise<ethers.ContractTransactionReceipt | null> {
  console.log('📡 Connecting to verifier contract...');
  
  if (!VERIFIER_CONTRACT_ADDRESS) {
    throw new Error('NEXT_PUBLIC_VERIFIER_CONTRACT not set in .env');
  }
  
  const verifier = new ethers.Contract(
    VERIFIER_CONTRACT_ADDRESS,
    VERIFIER_ABI,
    signer
  );
  
  // Convert epoch ID to bytes32
  const epochBytes32 = epochToBytes32(epochId);
  
  // Check if proof already published
  console.log('🔍 Checking if proof already published...');
  const exists = await verifier.proofExists(epochBytes32);
  
  if (exists) {
    console.log('⚠️  Proof already published for this epoch');
    
    const existingProof = await verifier.getProof(epochBytes32);
    console.log('\n📋 Existing Proof:');
    console.log(`   Merkle Root: ${existingProof[0]}`);
    console.log(`   Timestamp: ${new Date(Number(existingProof[1]) * 1000).toISOString()}`);
    console.log(`   Is Solvent: ${existingProof[2]}`);
    console.log(`   Publisher: ${existingProof[4]}`);
    
    return null;
  }
  
  console.log('📤 Publishing proof to blockchain...');
  
  // Prepare transaction
  const tx = await verifier.publishProof(
    epochBytes32,
    proof.publicSignals.merkle_root,
    proof.publicSignals.timestamp,
    proof.publicSignals.is_solvent,
    proof.proof.commitment,
    proof.proof.witness_hash,
    proof.proof.reserves_commitment,
    proof.proof.liabilities_commitment,
    proof.proof.solvency_assertion
  );
  
  console.log(`⏳ Transaction sent: ${tx.hash}`);
  console.log('   Waiting for confirmation...');
  
  const receipt = await tx.wait();
  
  return receipt;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  let epochId: string | null = null;
  
  console.log('\n📡 Proof Publisher - Phase 6\n');
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
    console.log('Usage: npx tsx scripts/publish-proof.ts <epoch-id>\n');
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
    // Step 1: Read proof
    console.log('1️⃣  Reading proof data...');
    const proof = await readProof(epochPath);
    
    console.log(`📄 Proof Type: ${proof.type}`);
    console.log(`🌳 Merkle Root: ${proof.publicSignals.merkle_root}`);
    console.log(`✅ Is Solvent: ${proof.publicSignals.is_solvent ? 'YES' : 'NO'}`);
    
    // Step 2: Connect to blockchain
    console.log('\n2️⃣  Connecting to Avalanche Fuji...');
    
    // Check for private key
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      console.error('\n❌ Error: DEPLOYER_PRIVATE_KEY not found in .env');
      console.log('\nTo publish proofs on-chain:');
      console.log('1. Export your MetaMask private key');
      console.log('2. Add to .env: DEPLOYER_PRIVATE_KEY=0x...');
      console.log('3. Ensure you have testnet AVAX\n');
      process.exit(1);
    }
    
    const provider = new ethers.JsonRpcProvider(AVALANCHE_FUJI_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`📍 Publisher: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} AVAX`);
    
    if (balance === BigInt(0)) {
      console.error('\n❌ Error: Insufficient AVAX balance');
      console.log('Get testnet AVAX: https://faucets.chain.link/fuji\n');
      process.exit(1);
    }
    
    // Step 3: Publish proof
    console.log('\n3️⃣  Publishing proof on-chain...\n');
    
    const receipt = await publishProof(wallet, proof, epochId);
    
    if (!receipt) {
      console.log('\n✅ Proof already published (skipped)\n');
      process.exit(0);
    }
    
    // Step 4: Display results
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Proof published successfully!\n');
    
    console.log('📋 Transaction Details:');
    console.log(`   Hash: ${receipt.hash}`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
    
    console.log('\n🔗 View on SnowTrace:');
    console.log(`   https://testnet.snowtrace.io/tx/${receipt.hash}\n`);
    
    console.log('🔍 Verify proof:');
    console.log(`   npx tsx scripts/verify-on-chain.ts ${epochId}\n`);
    
    process.exit(0);
    
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

export { publishProof, epochToBytes32, findLatestEpoch };
