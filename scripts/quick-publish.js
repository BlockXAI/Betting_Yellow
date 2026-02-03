/**
 * Quick publish script using require() for .env
 */
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  const epochId = process.argv[2] || 'epoch_test_1738525000000';
  
  console.log('\n📡 Quick Proof Publisher\n');
  console.log('═'.repeat(60));
  console.log(`📁 Epoch: ${epochId}\n`);
  
  // Read proof
  const proofPath = path.join(__dirname, '../solvency/epochs', epochId, 'proof.json');
  const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
  
  console.log(`🌳 Merkle Root: ${proofData.publicSignals.merkle_root}`);
  console.log(`✅ Is Solvent: ${proofData.publicSignals.is_solvent ? 'YES' : 'NO'}\n`);
  
  // Connect
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`📍 Publisher: ${wallet.address}`);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} AVAX\n`);
  
  // Contract
  const contractAddress = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT;
  const abi = [
    'function publishProof(bytes32 epochId, bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, bytes32 witnessHash, bytes32 reservesCommitment, bytes32 liabilitiesCommitment, bytes32 solvencyAssertion) external'
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log('🚀 Publishing proof...');
  
  const epochIdBytes32 = ethers.id(epochId);
  
  const tx = await contract.publishProof(
    epochIdBytes32,
    proofData.publicSignals.merkle_root,
    proofData.publicSignals.timestamp,
    proofData.publicSignals.is_solvent,
    proofData.proof.commitment,
    proofData.proof.witness_hash,
    proofData.proof.reserves_commitment,
    proofData.proof.liabilities_commitment,
    proofData.proof.solvency_assertion
  );
  
  console.log(`📤 Transaction: ${tx.hash}`);
  console.log('⏳ Waiting for confirmation...');
  
  await tx.wait();
  
  console.log('\n✅ Proof published successfully!');
  console.log('═'.repeat(60));
  console.log(`🔗 View on SnowTrace: https://testnet.snowtrace.io/tx/${tx.hash}`);
  console.log(`\n🌐 View on dashboard: http://localhost:3000/solvency\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
