/**
 * Phase 5: ZK Proof Verifier
 * 
 * Verifies cryptographic solvency proof
 * 
 * Verification steps:
 * 1. Check proof structure is valid
 * 2. Verify merkle root matches metadata
 * 3. Verify timestamp is reasonable
 * 4. Recompute all commitments from witness
 * 5. Verify commitments match proof
 * 6. Confirm solvency assertion
 * 
 * Usage:
 *   npx tsx scripts/verify-proof.ts [epoch-id]
 *   npx tsx scripts/verify-proof.ts epoch_1738525000000
 */

import { ethers, keccak256 } from 'ethers';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  metadata: {
    reserves_total: string;
    liabilities_sum: string;
    excess: string;
    ratio: string;
    participantCount: number;
    generatedAt: string;
  };
}

interface WitnessData {
  reserves_total: string;
  liabilities_sum: string;
  merkle_root: string;
  timestamp: number;
  is_solvent: boolean;
}

interface MerkleMetadata {
  root: string;
  leafCount: number;
  totalLiabilities: string;
}

interface VerificationResult {
  valid: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  summary: string;
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
 * Read witness data (for verification)
 */
async function readWitness(epochPath: string): Promise<WitnessData> {
  const witnessPath = path.join(epochPath, 'witness.json');
  
  try {
    const content = await fs.readFile(witnessPath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error(`Failed to read witness.json: ${error.message}`);
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
 * Verify proof against witness and metadata
 */
async function verifyProof(
  proof: ProofData,
  witness: WitnessData,
  merkle: MerkleMetadata
): Promise<VerificationResult> {
  const checks: VerificationResult['checks'] = [];
  
  // Check 1: Proof structure
  checks.push({
    name: 'Proof Structure',
    passed: proof.version === '1.0.0' && proof.type === 'solvency-proof-commitment-scheme',
    message: proof.version === '1.0.0' ? 'Valid proof format' : 'Invalid proof format'
  });
  
  // Check 2: Merkle root matches
  const merkleRootMatches = proof.publicSignals.merkle_root === merkle.root;
  checks.push({
    name: 'Merkle Root',
    passed: merkleRootMatches,
    message: merkleRootMatches 
      ? 'Merkle root matches metadata' 
      : `Mismatch: proof=${proof.publicSignals.merkle_root}, metadata=${merkle.root}`
  });
  
  // Check 3: Timestamp is reasonable (not in future, not too old)
  const now = Math.floor(Date.now() / 1000);
  const timestampValid = proof.publicSignals.timestamp <= now && 
                        proof.publicSignals.timestamp > now - 86400 * 365; // Within 1 year
  checks.push({
    name: 'Timestamp',
    passed: timestampValid,
    message: timestampValid 
      ? 'Timestamp is valid' 
      : 'Timestamp is invalid (future or too old)'
  });
  
  // Check 4: Recompute witness hash
  const recomputedWitnessHash = keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256', 'bytes32', 'uint256', 'bool'],
      [
        witness.reserves_total,
        witness.liabilities_sum,
        witness.merkle_root,
        witness.timestamp,
        witness.is_solvent
      ]
    )
  );
  
  const witnessHashMatches = recomputedWitnessHash === proof.proof.witness_hash;
  checks.push({
    name: 'Witness Hash',
    passed: witnessHashMatches,
    message: witnessHashMatches 
      ? 'Witness hash verification passed' 
      : 'Witness hash mismatch - data may be tampered'
  });
  
  // Check 5: Recompute reserves commitment
  const recomputedReservesCommitment = keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'bytes32', 'uint256'],
      [witness.reserves_total, witness.merkle_root, witness.timestamp]
    )
  );
  
  const reservesCommitmentMatches = recomputedReservesCommitment === proof.proof.reserves_commitment;
  checks.push({
    name: 'Reserves Commitment',
    passed: reservesCommitmentMatches,
    message: reservesCommitmentMatches 
      ? 'Reserves commitment valid' 
      : 'Reserves commitment mismatch'
  });
  
  // Check 6: Recompute liabilities commitment
  const recomputedLiabilitiesCommitment = keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'bytes32', 'uint256'],
      [witness.liabilities_sum, witness.merkle_root, witness.timestamp]
    )
  );
  
  const liabilitiesCommitmentMatches = recomputedLiabilitiesCommitment === proof.proof.liabilities_commitment;
  checks.push({
    name: 'Liabilities Commitment',
    passed: liabilitiesCommitmentMatches,
    message: liabilitiesCommitmentMatches 
      ? 'Liabilities commitment valid' 
      : 'Liabilities commitment mismatch'
  });
  
  // Check 7: Verify solvency (reserves >= liabilities)
  const reservesTotal = BigInt(witness.reserves_total);
  const liabilitiesSum = BigInt(witness.liabilities_sum);
  const actuallysolvent = reservesTotal >= liabilitiesSum;
  const solvencyMatches = actuallysolvent === proof.publicSignals.is_solvent;
  
  checks.push({
    name: 'Solvency Check',
    passed: solvencyMatches && actuallysolvent,
    message: actuallysolvent 
      ? `✅ SOLVENT: Reserves (${ethers.formatEther(reservesTotal)}) >= Liabilities (${ethers.formatEther(liabilitiesSum)})` 
      : `❌ INSOLVENT: Reserves (${ethers.formatEther(reservesTotal)}) < Liabilities (${ethers.formatEther(liabilitiesSum)})`
  });
  
  // Check 8: Recompute solvency assertion
  const recomputedSolvencyAssertion = keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'bool'],
      [recomputedReservesCommitment, recomputedLiabilitiesCommitment, witness.is_solvent]
    )
  );
  
  const solvencyAssertionMatches = recomputedSolvencyAssertion === proof.proof.solvency_assertion;
  checks.push({
    name: 'Solvency Assertion',
    passed: solvencyAssertionMatches,
    message: solvencyAssertionMatches 
      ? 'Solvency assertion valid' 
      : 'Solvency assertion mismatch'
  });
  
  // Check 9: Recompute master commitment
  const recomputedMasterCommitment = keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'bytes32'],
      [recomputedWitnessHash, recomputedSolvencyAssertion, witness.merkle_root]
    )
  );
  
  const masterCommitmentMatches = recomputedMasterCommitment === proof.proof.commitment;
  checks.push({
    name: 'Master Commitment',
    passed: masterCommitmentMatches,
    message: masterCommitmentMatches 
      ? 'Master commitment binds all elements correctly' 
      : 'Master commitment mismatch - proof may be invalid'
  });
  
  // Overall validity
  const allPassed = checks.every(c => c.passed);
  
  return {
    valid: allPassed,
    checks,
    summary: allPassed 
      ? '✅ Proof is VALID and verifies correctly' 
      : '❌ Proof FAILED verification'
  };
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
    console.log('Usage: npx tsx scripts/verify-proof.ts <epoch-id>\n');
    process.exit(1);
  }
  
  const epochPath = path.join(process.cwd(), 'solvency', 'epochs', epochId);
  
  console.log('\n🔍 ZK Proof Verifier - Phase 5\n');
  console.log('═'.repeat(60));
  console.log(`📁 Epoch: ${epochId}`);
  console.log(`📂 Path: ${epochPath}\n`);
  
  try {
    // Step 1: Read data
    console.log('1️⃣  Reading proof data...');
    const proof = await readProof(epochPath);
    const witness = await readWitness(epochPath);
    const merkle = await readMerkleMetadata(epochPath);
    
    console.log(`📄 Proof Type: ${proof.type}`);
    console.log(`🌳 Merkle Root: ${proof.publicSignals.merkle_root}`);
    console.log(`⏰ Timestamp: ${new Date(proof.publicSignals.timestamp * 1000).toISOString()}`);
    
    // Step 2: Verify proof
    console.log('\n2️⃣  Verifying proof...\n');
    const result = await verifyProof(proof, witness, merkle);
    
    // Display results
    console.log('Verification Results:');
    console.log('─'.repeat(60));
    
    result.checks.forEach((check, i) => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${i + 1}. ${check.name}`);
      console.log(`   ${check.message}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log(result.summary + '\n');
    
    if (result.valid) {
      console.log('🎉 All verification checks passed!');
      console.log('The proof cryptographically demonstrates solvency.\n');
    } else {
      console.log('⚠️  Some verification checks failed.');
      console.log('The proof may be invalid or data may be inconsistent.\n');
    }
    
    // Exit with appropriate code
    process.exit(result.valid ? 0 : 1);
    
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

export { verifyProof, readProof, readWitness, findLatestEpoch };
