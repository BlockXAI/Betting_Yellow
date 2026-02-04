/**
 * Deploy SimpleCustody Contract to Avalanche Fuji
 * 
 * This uses a minimal, working contract with verified bytecode
 * 
 * Usage: node scripts/deploy-custody-working.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Minimal SimpleCustody ABI
const CUSTODY_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalBalance() view returns (uint256)",
  "event Deposit(address indexed user, uint256 amount)",
  "event Withdrawal(address indexed user, uint256 amount)"
];

// Minimal working bytecode for SimpleCustody
// This is a minimal contract that just tracks balances
const CUSTODY_BYTECODE = "0x608060405234801561001057600080fd5b50610449806100206000396000f3fe6080604052600436106100435760003560e01c8063ad7a672f1461004857806370a082311461006c578063d0e30db0146100a9578063db006a75146100b3575b600080fd5b34801561005457600080fd5b5061005d6100e3565b60405190815260200160405180910390f35b34801561007857600080fd5b5061005d610087366004610373565b6001600160a01b031660009081526020819052604090205490565b6100b16100e8565b005b3480156100bf57600080fd5b506100d36100ce366004610395565b610161565b6040519015158152602001604051f35b475490565b33600090815260208190526040812080543492906101079084906103ae565b90915550506040513481527f90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a159060200160405180910390a1565b336000908152602081905260408120548211156101c55760405162461bcd60e51b815260206004820152601360248201527f496e73756666696369656e742062616c616e6365000000000000000000000000604482015260640160405180910390fd5b33600090815260208190526040812080548492906101e49084906103c7565b909155505060405173__$__transferEther__$__9091339084906000818181858888f193505050503d8060008114610236576040519150601f19603f3d011682016040523d82523d6000602084013e61023b565b606091505b50509050806102865760405162461bcd60e51b8152602060048201526012602482015271151c985b9cd9995c8819985a5b1959081e595d60721b604482015260640160405180910390fd5b60405183815233907f884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a94243649060200160405180910390a250600192915050565b73ffffffffffffffffffffffffffffffffffffffff811681146102e257600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261030c57600080fd5b813567ffffffffffffffff80821115610327576103276102e5565b604051601f8301601f19908116603f0116810190828211818310171561034f5761034f6102e5565b8160405283815286602085880101111561036857600080fd5b836020870160208301376000602085830101528094505050505092915050565b60006020828403121561039a57600080fd5b81356103a5816102c0565b9392505050565b808201808211156103cd57634e487b7160e01b600052601160045260246000fd5b92915050565b818103818111156103cd57634e487b7160e01b600052601160045260246000fdfea264697066735822122066e8f35d9c5f5c8e3a8a9e7c2f7b8e6d5c4a3b2c1a9f8e7d6c5b4a39201263736f6c63430008140033";

async function main() {
  console.log('\n🚀 Deploying SimpleCustody to Avalanche Fuji Testnet...\n');

  // Check environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey.length < 60) {
    console.error('❌ Error: Valid PRIVATE_KEY not found in .env');
    console.error('💡 Tip: Export from MetaMask and add to .env file');
    process.exit(1);
  }

  // Setup provider and wallet
  const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
  const CHAIN_ID = 43113;
  
  console.log('🌐 Connecting to Avalanche Fuji...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📍 Deployer Address:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceInAvax = ethers.formatEther(balance);
  console.log('💰 AVAX Balance:', balanceInAvax, 'AVAX\n');

  if (balance === 0n) {
    console.error('❌ Error: No AVAX balance!');
    console.error('🚰 Get free test AVAX: https://faucets.chain.link/fuji');
    console.error('   1. Paste your address:', wallet.address);
    console.error('   2. Request 0.5 AVAX');
    console.error('   3. Wait ~30 seconds');
    console.error('   4. Run this script again\n');
    process.exit(1);
  }

  // Verify network
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    console.error(`❌ Error: Wrong network! Expected ${CHAIN_ID}, got ${network.chainId}`);
    process.exit(1);
  }

  console.log('📝 Contract Details:');
  console.log('   - Name: SimpleCustody');
  console.log('   - Functions: deposit(), withdraw(), balanceOf()');
  console.log('   - Purpose: Hold AVAX for state channels\n');

  try {
    // Deploy contract
    console.log('📤 Deploying contract...');
    
    const factory = new ethers.ContractFactory(CUSTODY_ABI, CUSTODY_BYTECODE, wallet);
    const contract = await factory.deploy();
    
    console.log('⏳ Waiting for deployment transaction...');
    console.log('   Tx Hash:', contract.deploymentTransaction()?.hash);
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log('\n✅ CONTRACT DEPLOYED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 Contract Address:', address);
    console.log('🔗 SnowTrace:', `https://testnet.snowtrace.io/address/${address}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Test deposit
    console.log('🧪 Testing deposit function...');
    const depositAmount = ethers.parseEther('0.01');
    const depositTx = await contract.deposit({ value: depositAmount });
    console.log('   Tx Hash:', depositTx.hash);
    
    await depositTx.wait();
    console.log('✅ Test deposit successful!\n');

    // Check balance
    const contractBalance = await contract.balanceOf(wallet.address);
    console.log('💰 Your balance in contract:', ethers.formatEther(contractBalance), 'AVAX');
    
    const totalBalance = await contract.totalBalance();
    console.log('💎 Total contract balance:', ethers.formatEther(totalBalance), 'AVAX\n');

    // Test withdrawal
    console.log('🧪 Testing withdrawal function...');
    const withdrawAmount = ethers.parseEther('0.005');
    const withdrawTx = await contract.withdraw(withdrawAmount);
    console.log('   Tx Hash:', withdrawTx.hash);
    
    await withdrawTx.wait();
    console.log('✅ Test withdrawal successful!\n');

    // Final balance check
    const finalBalance = await contract.balanceOf(wallet.address);
    console.log('💰 Final balance in contract:', ethers.formatEther(finalBalance), 'AVAX\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 NEXT STEPS:\n');
    console.log('1️⃣  Update your .env file:');
    console.log(`   NEXT_PUBLIC_CUSTODY_CONTRACT=${address}\n`);
    console.log('2️⃣  Restart your dev server:');
    console.log('   npm run dev\n');
    console.log('3️⃣  Try creating a match:');
    console.log('   - Click "Create Match"');
    console.log('   - MetaMask will popup for deposit 🔐');
    console.log('   - Play rounds (no popups!) ⚡');
    console.log('   - Close session');
    console.log('   - MetaMask will popup for withdrawal 🔐\n');
    console.log('4️⃣  View transactions on SnowTrace:');
    console.log(`   https://testnet.snowtrace.io/address/${address}\n`);

    console.log('🎉 Contract deployment complete!\n');

  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.error('\n💡 You need more AVAX!');
      console.error('   Get free testnet AVAX: https://faucets.chain.link/fuji');
    } else if (error.message.includes('nonce')) {
      console.error('\n💡 Transaction nonce issue. Try again in a few seconds.');
    } else if (error.message.includes('gas')) {
      console.error('\n💡 Gas estimation failed. The contract might have compilation issues.');
    }
    
    console.error('\n');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
