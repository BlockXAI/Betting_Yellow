/**
 * Deploy SolvencyVerifier Contract to Avalanche Fuji
 * 
 * This script deploys the on-chain verifier for solvency proofs.
 * 
 * Usage:
 *   node scripts/deploy-verifier.js
 * 
 * Requirements:
 *   - PRIVATE_KEY in .env
 *   - Testnet AVAX in deployer wallet
 */

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Avalanche Fuji configuration
const FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
const CHAIN_ID = 43113;

// Load compiled contract artifacts
const artifactPath = path.join(__dirname, '../artifacts/SolvencyVerifier.json');
let VERIFIER_ABI, VERIFIER_BYTECODE;

try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  VERIFIER_ABI = artifact.abi;
  VERIFIER_BYTECODE = artifact.bytecode;
} catch (error) {
  console.error('❌ Error: Compiled contract not found!');
  console.log('\nPlease compile the contract first:');
  console.log('  node scripts/compile-verifier.js\n');
  process.exit(1);
}

// Old ABI for reference (replaced by compiled version)
const OLD_VERIFIER_ABI = [
  "function publishProof(bytes32 epochId, bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, bytes32 witnessHash, bytes32 reservesCommitment, bytes32 liabilitiesCommitment, bytes32 solvencyAssertion) external",
  "function verifyProof(bytes32 epochId, bytes32 expectedMerkleRoot) external returns (bool)",
  "function getProof(bytes32 epochId) external view returns (bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, address publisher, bool verified)",
  "function getProofCount() external view returns (uint256)",
  "function getLatestProof() external view returns (bytes32 epochId, bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment)",
  "function proofExists(bytes32 epochId) external view returns (bool)",
  "event ProofPublished(bytes32 indexed epochId, bytes32 indexed merkleRoot, bool isSolvent, address publisher, uint256 timestamp)",
  "event ProofVerified(bytes32 indexed epochId, bool valid, address verifier)"
];

async function main() {
  console.log('\n🚀 SolvencyVerifier Deployment to Avalanche Fuji\n');
  console.log('═'.repeat(60));
  
  // Load private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === 'your_private_key_here') {
    console.error('❌ Error: PRIVATE_KEY not found or not configured in .env');
    console.log('\nPlease export your MetaMask private key:');
    console.log('1. Open MetaMask');
    console.log('2. Click account menu → Account details → Export private key');
    console.log('3. Add to .env: PRIVATE_KEY=0x...');
    process.exit(1);
  }
  
  // Connect to Avalanche Fuji
  console.log('🌐 Connecting to Avalanche Fuji...');
  const provider = new ethers.JsonRpcProvider(FUJI_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`📍 Deployer address: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} AVAX`);
  
  if (balance === 0n) {
    console.error('\n❌ Error: Insufficient AVAX balance');
    console.log('\nGet testnet AVAX from faucet:');
    console.log('https://faucets.chain.link/fuji');
    process.exit(1);
  }
  
  console.log('\n📦 Deploying SolvencyVerifier contract...');
  
  // Create contract factory
  const factory = new ethers.ContractFactory(VERIFIER_ABI, VERIFIER_BYTECODE, wallet);
  
  // Estimate gas
  const deployTx = factory.getDeployTransaction();
  const gasEstimate = await provider.estimateGas(deployTx);
  console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
  
  // Deploy contract
  console.log('\n🚀 Deploying contract...');
  const contract = await factory.deploy();
  
  console.log(`📤 Transaction hash: ${contract.deploymentTransaction().hash}`);
  console.log('⏳ Waiting for confirmation...');
  
  // Wait for deployment
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log('\n✅ Deployment successful!');
  console.log('═'.repeat(60));
  console.log(`📍 Contract Address: ${address}`);
  console.log(`🔗 View on SnowTrace: https://testnet.snowtrace.io/address/${address}`);
  console.log('═'.repeat(60));
  
  // Save deployment info
  const deploymentInfo = {
    address,
    deployer: wallet.address,
    chainId: CHAIN_ID,
    timestamp: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction().hash
  };
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, 'SolvencyVerifier-fuji.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('\n📋 Next steps:');
  console.log('1. Update .env file:');
  console.log(`   NEXT_PUBLIC_VERIFIER_CONTRACT=${address}`);
  console.log('2. Restart dev server');
  console.log('3. Test proof publication:');
  console.log('   npm run proof:publish epoch_<timestamp>');
  console.log('\n💡 Deployment info saved to: deployments/SolvencyVerifier-fuji.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
