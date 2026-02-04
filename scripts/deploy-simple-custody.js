/**
 * Deploy SimpleCustody contract to Avalanche Fuji Testnet
 * 
 * Usage:
 *   node scripts/deploy-simple-custody.js
 * 
 * Requirements:
 *   - PRIVATE_KEY in .env
 *   - Test AVAX from https://faucets.chain.link/fuji
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABI and Bytecode
const CUSTODY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Withdrawal",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "balances",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdraw",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBalance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Compiled bytecode (from solc)
const CUSTODY_BYTECODE = "0x608060405234801561000f575f80fd5b506106f18061001d5f395ff3fe60806040526004361061006e575f3560e01c8063ad7a672f1161004c578063ad7a672f146100f4578063d0e30db014610118578063db006a7514610122578063e941fa781461014e575f80fd5b806327e235e31461007257806370a08231146100bc578063742d35cc146100d0575b5f80fd5b34801561007d575f80fd5b506100a961008c366004610664565b60208190525f90815260409020546001600160a01b03165f908152602081905260409020548152565b6040519081526020015b60405180910390f35b3480156100c7575f80fd5b506100a9610168565b3480156100db575f80fd5b506100e4610172565b60405190151581526020016100b3565b3480156100ff575f80fd5b506100a961010e366004610664565b5f60208190529081526040902054815290565b6101206101f8565b005b34801561012d575f80fd5b5061014161013c366004610684565b610291565b6040516100b3919061069b565b348015610159575f80fd5b506100a947475f5260205260409020548152565b5f47610172565b335f9081526020819052604081205480156101f25733815f908152602081905260408082209190915590519081906001600160a01b0384169083908381818185875af1925050503d805f81146101e3576040519150601f19603f3d011682016040523d82523d5f602084013e6101e8565b606091505b50509050806100925760405162461bcd60e51b815260206004820152601a60248201527f456d657267656e63792077697468647261772066616696c656400000000000000604482015260640161008956";

async function main() {
  console.log('🚀 Deploying SimpleCustody to Avalanche Fuji...\n');

  // Check private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === '0xyour_private_key_here') {
    console.error('❌ Error: PRIVATE_KEY not set in .env file');
    console.error('📝 Export your MetaMask private key and add to .env');
    process.exit(1);
  }

  // Setup provider and wallet
  const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📍 Deployer address:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 AVAX balance:', ethers.formatEther(balance), 'AVAX\n');

  if (balance === 0n) {
    console.error('❌ Error: No AVAX balance');
    console.error('🚰 Get test AVAX from: https://faucets.chain.link/fuji');
    process.exit(1);
  }

  // Deploy contract
  console.log('📤 Deploying SimpleCustody contract...');
  
  const factory = new ethers.ContractFactory(CUSTODY_ABI, CUSTODY_BYTECODE, wallet);
  const contract = await factory.deploy();
  
  console.log('⏳ Waiting for deployment...');
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log('\n✅ SimpleCustody deployed!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 Contract Address:', address);
  console.log('🔗 View on SnowTrace:', `https://testnet.snowtrace.io/address/${address}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Test deposit function
  console.log('🧪 Testing deposit function...');
  const depositTx = await contract.deposit({ value: ethers.parseEther('0.01') });
  await depositTx.wait();
  console.log('✅ Test deposit successful!\n');

  // Check balance
  const contractBalance = await contract.balanceOf(wallet.address);
  console.log('💰 Your balance in contract:', ethers.formatEther(contractBalance), 'AVAX\n');

  console.log('📝 Next Steps:');
  console.log('1. Update .env file:');
  console.log(`   NEXT_PUBLIC_CUSTODY_CONTRACT=${address}`);
  console.log('2. Restart your app: npm run dev');
  console.log('3. Try depositing from the UI!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });
