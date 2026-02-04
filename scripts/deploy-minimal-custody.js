/**
 * Deploy MinimalCustody Contract to Avalanche Fuji
 * Uses REAL compiled bytecode from solc
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read compiled contract
const abiPath = path.join(__dirname, '../build/contracts_MinimalCustody_sol_MinimalCustody.abi');
const binPath = path.join(__dirname, '../build/contracts_MinimalCustody_sol_MinimalCustody.bin');

const CUSTODY_ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const CUSTODY_BYTECODE = '0x' + fs.readFileSync(binPath, 'utf8').trim();

async function main() {
  console.log('\n🚀 Deploying MinimalCustody to Avalanche Fuji...\n');

  // Check private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey.length < 60) {
    console.error('❌ Error: PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  // Setup
  const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📍 Deployer:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'AVAX\n');

  if (balance === 0n) {
    console.error('❌ No AVAX! Get from: https://faucets.chain.link/fuji\n');
    process.exit(1);
  }

  try {
    console.log('📤 Deploying MinimalCustody contract...');
    
    const factory = new ethers.ContractFactory(CUSTODY_ABI, CUSTODY_BYTECODE, wallet);
    const contract = await factory.deploy();
    
    console.log('⏳ Tx Hash:', contract.deploymentTransaction().hash);
    console.log('⏳ Waiting for confirmation...\n');
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log('✅ DEPLOYED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('📋 Contract Address:', address);
    console.log('🔗 View on SnowTrace:');
    console.log('   https://testnet.snowtrace.io/address/' + address);
    console.log('═══════════════════════════════════════════════\n');

    // Test deposit
    console.log('🧪 Testing deposit (0.01 AVAX)...');
    const depositTx = await contract.deposit({ value: ethers.parseEther('0.01') });
    await depositTx.wait();
    console.log('✅ Deposit successful!');
    console.log('   Tx:', depositTx.hash, '\n');

    // Check balance
    const userBalance = await contract.balanceOf(wallet.address);
    console.log('💰 Your balance:', ethers.formatEther(userBalance), 'AVAX\n');

    // Test withdrawal
    console.log('🧪 Testing withdraw (0.005 AVAX)...');
    const withdrawTx = await contract.withdraw(ethers.parseEther('0.005'));
    await withdrawTx.wait();
    console.log('✅ Withdrawal successful!');
    console.log('   Tx:', withdrawTx.hash, '\n');

    // Final balance
    const finalBalance = await contract.balanceOf(wallet.address);
    console.log('💰 Final balance:', ethers.formatEther(finalBalance), 'AVAX\n');

    console.log('═══════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════\n');

    console.log('📝 NEXT STEPS:\n');
    console.log('1. Update .env:');
    console.log(`   NEXT_PUBLIC_CUSTODY_CONTRACT=${address}\n`);
    console.log('2. Restart dev server:');
    console.log('   npm run dev\n');
    console.log('3. Test in browser:');
    console.log('   - Create Match → MetaMask popup (deposit)');
    console.log('   - Play rounds → NO popups!');
    console.log('   - Close Session → MetaMask popup (withdraw)\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message, '\n');
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('🎉 Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
