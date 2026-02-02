/**
 * Phase 3: Merkle Tree Builder
 * 
 * Converts liabilities CSV → Merkle tree → root + inclusion proofs
 * 
 * Usage:
 *   npx ts-node scripts/build-merkle-tree.ts <epoch-id>
 *   npx ts-node scripts/build-merkle-tree.ts epoch_1738525000000
 * 
 * Outputs:
 *   - solvency/epochs/<epoch>/merkle_root.txt
 *   - solvency/epochs/<epoch>/inclusion_<address>.json (per user)
 */

import { MerkleTree } from 'merkletreejs';
import { keccak256 } from 'ethers';
import * as fs from 'fs/promises';
import * as path from 'path';

// Types
interface LiabilityEntry {
  address: string;
  balance: string;
  leaf: string; // Computed hash
}

interface InclusionProof {
  address: string;
  balance: string;
  leaf: string;
  proof: string[];
  root: string;
  index: number;
}

/**
 * Read and parse liabilities CSV
 */
async function readLiabilitiesCSV(epochPath: string): Promise<LiabilityEntry[]> {
  const csvPath = path.join(epochPath, 'liabilities.csv');
  
  try {
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // Skip header
    const dataLines = lines.slice(1);
    
    const entries: LiabilityEntry[] = [];
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      // Parse CSV: address,balance
      const [address, balance] = line.split(',').map(s => s.trim());
      
      if (!address || !balance) {
        console.warn(`⚠️  Skipping invalid line: ${line}`);
        continue;
      }
      
      // Create leaf hash: keccak256(abi.encodePacked(address, balance))
      // For compatibility with Solidity, we encode as: address (20 bytes) + balance (32 bytes as uint256)
      const balanceWei = balance; // Already in wei from CSV
      const leaf = keccak256(
        '0x' + 
        address.slice(2).padStart(40, '0') + // address (20 bytes)
        BigInt(balanceWei).toString(16).padStart(64, '0') // balance as uint256 (32 bytes)
      );
      
      entries.push({
        address,
        balance: balanceWei,
        leaf
      });
    }
    
    console.log(`📄 Read ${entries.length} liability entries from CSV`);
    return entries;
    
  } catch (error: any) {
    throw new Error(`Failed to read CSV: ${error.message}`);
  }
}

/**
 * Build Merkle tree from liability entries
 */
function buildMerkleTree(entries: LiabilityEntry[]): MerkleTree {
  if (entries.length === 0) {
    throw new Error('Cannot build Merkle tree with 0 entries');
  }
  
  const leaves = entries.map(e => e.leaf);
  
  // Build tree with keccak256 hashing, sorted
  const tree = new MerkleTree(leaves, keccak256, { 
    sortPairs: true,
    hashLeaves: false // Leaves are already hashed
  });
  
  console.log(`🌳 Built Merkle tree with ${entries.length} leaves`);
  console.log(`   Root: ${tree.getRoot().toString('hex')}`);
  console.log(`   Depth: ${Math.ceil(Math.log2(entries.length))}`);
  
  return tree;
}

/**
 * Generate inclusion proofs for all participants
 */
function generateInclusionProofs(
  tree: MerkleTree,
  entries: LiabilityEntry[]
): InclusionProof[] {
  const root = '0x' + tree.getRoot().toString('hex');
  const proofs: InclusionProof[] = [];
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const leaf = entry.leaf;
    
    // Get proof for this leaf
    const proof = tree.getProof(leaf);
    const hexProof = proof.map(p => '0x' + p.data.toString('hex'));
    
    // Verify proof is valid
    const isValid = tree.verify(proof, leaf, tree.getRoot());
    
    if (!isValid) {
      console.error(`❌ Invalid proof generated for ${entry.address}`);
      throw new Error(`Proof verification failed for ${entry.address}`);
    }
    
    proofs.push({
      address: entry.address,
      balance: entry.balance,
      leaf,
      proof: hexProof,
      root,
      index: i
    });
  }
  
  console.log(`✅ Generated ${proofs.length} inclusion proofs (all verified)`);
  return proofs;
}

/**
 * Save Merkle root to file
 */
async function saveMerkleRoot(epochPath: string, tree: MerkleTree): Promise<void> {
  const rootPath = path.join(epochPath, 'merkle_root.txt');
  const root = '0x' + tree.getRoot().toString('hex');
  
  await fs.writeFile(rootPath, root, 'utf-8');
  console.log(`💾 Saved Merkle root to: merkle_root.txt`);
}

/**
 * Save inclusion proofs to individual JSON files
 */
async function saveInclusionProofs(
  epochPath: string,
  proofs: InclusionProof[]
): Promise<void> {
  for (const proof of proofs) {
    const filename = `inclusion_${proof.address.toLowerCase()}.json`;
    const filepath = path.join(epochPath, filename);
    
    const proofData = {
      address: proof.address,
      balance: proof.balance,
      leaf: proof.leaf,
      proof: proof.proof,
      root: proof.root,
      index: proof.index,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(filepath, JSON.stringify(proofData, null, 2), 'utf-8');
  }
  
  console.log(`💾 Saved ${proofs.length} inclusion proof files`);
}

/**
 * Save tree metadata summary
 */
async function saveTreeMetadata(
  epochPath: string,
  tree: MerkleTree,
  entries: LiabilityEntry[]
): Promise<void> {
  const metadataPath = path.join(epochPath, 'merkle_metadata.json');
  
  const totalLiabilities = entries.reduce((sum, e) => sum + BigInt(e.balance), BigInt('0'));
  
  const metadata = {
    root: '0x' + tree.getRoot().toString('hex'),
    leafCount: entries.length,
    treeDepth: Math.ceil(Math.log2(entries.length)),
    totalLiabilities: totalLiabilities.toString(),
    participants: entries.map(e => ({
      address: e.address,
      balance: e.balance,
      leaf: e.leaf
    })),
    generatedAt: new Date().toISOString()
  };
  
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`💾 Saved tree metadata to: merkle_metadata.json`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('\n❌ Error: Epoch ID required\n');
    console.log('Usage: npx ts-node scripts/build-merkle-tree.ts <epoch-id>\n');
    console.log('Example: npx ts-node scripts/build-merkle-tree.ts epoch_1738525000000\n');
    process.exit(1);
  }
  
  const epochId = args[0];
  const epochPath = path.join(process.cwd(), 'solvency', 'epochs', epochId);
  
  console.log('\n🌳 Merkle Tree Builder - Phase 3\n');
  console.log('═'.repeat(60));
  console.log(`📁 Epoch: ${epochId}`);
  console.log(`📂 Path: ${epochPath}\n`);
  
  // Verify epoch directory exists
  try {
    await fs.access(epochPath);
  } catch {
    console.error(`❌ Epoch directory not found: ${epochPath}\n`);
    console.log('Tip: Export a session first using the frontend or API\n');
    process.exit(1);
  }
  
  try {
    // Step 1: Read CSV
    console.log('1️⃣  Reading liabilities CSV...');
    const entries = await readLiabilitiesCSV(epochPath);
    
    if (entries.length === 0) {
      console.error('❌ No liability entries found in CSV\n');
      process.exit(1);
    }
    
    // Step 2: Build Merkle tree
    console.log('\n2️⃣  Building Merkle tree...');
    const tree = buildMerkleTree(entries);
    
    // Step 3: Generate inclusion proofs
    console.log('\n3️⃣  Generating inclusion proofs...');
    const proofs = generateInclusionProofs(tree, entries);
    
    // Step 4: Save outputs
    console.log('\n4️⃣  Saving outputs...');
    await saveMerkleRoot(epochPath, tree);
    await saveInclusionProofs(epochPath, proofs);
    await saveTreeMetadata(epochPath, tree, entries);
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Merkle tree generation complete!\n');
    console.log('📋 Generated Files:');
    console.log(`   - merkle_root.txt`);
    console.log(`   - merkle_metadata.json`);
    console.log(`   - ${proofs.length} × inclusion_<address>.json\n`);
    console.log(`🔍 Root Hash: 0x${tree.getRoot().toString('hex')}\n`);
    console.log('✅ All proofs verified successfully!\n');
    
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
  readLiabilitiesCSV, 
  buildMerkleTree, 
  generateInclusionProofs,
  saveMerkleRoot,
  saveInclusionProofs,
  saveTreeMetadata
};
