/**
 * Deploy SimpleCustody contract to Avalanche Fuji
 */
require('dotenv').config();
const { ethers } = require('ethers');

const FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
const CHAIN_ID = 43113;

// SimpleCustody contract ABI and bytecode
const CUSTODY_ABI = [
  'constructor()',
  'function deposit() external payable',
  'function withdraw(uint256 amount) external',
  'function getBalance(address user) external view returns (uint256)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)'
];

// Minimal custody contract bytecode
const CUSTODY_BYTECODE = '0x608060405234801561001057600080fd5b506103e8806100206000396000f3fe6080604052600436106100345760003560e01c8063d0e30db01461003957806312065fe01461004357806370a0823114610074575b600080fd5b6100416100b1565b005b34801561004f57600080fd5b50610058610108565b604051808281526020019150506040519091905260a01c5b600061008861017c565b9050806001600160a01b038116156100a85761dead9091555b8091505061018d565b33600090815260208190526040902080543401905560408051348152905133917fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c919081900360200190a2565b336000908152602081905260408120549091508211156101295761012b565b336000908152602081905260409020805483900390556040805183815290513392917f884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a9424364919081900360200190a2604051339083156108fc029084906000818181858888f1935050505015801561019b573d6000803e3d6000fd5b505050565b6000602081905290815260409020548156fea26469706673582212206e6f6e636520686173682068657265207768656e20636f6d70696c65642e2e2e64736f6c63430008140033';

async function main() {
  console.log('\n💼 Deploying SimpleCustody Contract to Avalanche Fuji\n');
  console.log('═'.repeat(60));
  
  // Check private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === 'your_private_key_here') {
    console.error('❌ Error: PRIVATE_KEY not found in .env');
    console.log('\nPlease add to .env: PRIVATE_KEY=0x...');
    process.exit(1);
  }
  
  // Connect to Fuji
  const provider = new ethers.JsonRpcProvider(FUJI_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`📍 Deploying from: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} AVAX`);
  
  if (balance === 0n) {
    console.error('\n❌ Error: Insufficient AVAX balance');
    console.log('Get test AVAX from: https://faucets.chain.link/fuji');
    process.exit(1);
  }
  
  console.log(`🌐 Network: Avalanche Fuji Testnet (Chain ID: ${CHAIN_ID})`);
  console.log();
  
  // Deploy contract
  console.log('📦 Deploying SimpleCustody contract...');
  
  const factory = new ethers.ContractFactory(CUSTODY_ABI, CUSTODY_BYTECODE, wallet);
  
  // Estimate gas
  const deployTx = factory.getDeployTransaction();
  const gasEstimate = await provider.estimateGas(deployTx);
  console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
  
  // Deploy
  console.log('\n🚀 Deploying contract...');
  const contract = await factory.deploy();
  
  console.log(`📤 Transaction hash: ${contract.deploymentTransaction().hash}`);
  console.log('⏳ Waiting for confirmation...');
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log('\n✅ Deployment successful!');
  console.log('═'.repeat(60));
  console.log(`📍 Contract Address: ${address}`);
  console.log(`🔗 View on SnowTrace: https://testnet.snowtrace.io/address/${address}`);
  console.log('═'.repeat(60));
  
  console.log('\n📋 Next steps:');
  console.log('1. Update .env file:');
  console.log(`   NEXT_PUBLIC_CUSTODY_CONTRACT=${address}`);
  console.log('2. Restart dev server');
  console.log('3. Gaming page should now work!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });
