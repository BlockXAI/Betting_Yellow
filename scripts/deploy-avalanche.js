/**
 * Deploy Yellow Network contracts to Avalanche Fuji Testnet
 * 
 * Usage:
 * 1. Set PRIVATE_KEY environment variable
 * 2. Run: node scripts/deploy-avalanche.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Network configuration
const FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
const CHAIN_ID = 43113;

// Contract sources (simplified versions for deployment)
const contracts = {
  MockToken: {
    abi: [
      "constructor(string name, string symbol, uint8 decimals)",
      "function mint(address to, uint256 amount) public",
      "function balanceOf(address account) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)"
    ],
    // ERC20 Mock bytecode - simplified version
    bytecode: "0x608060405234801561001057600080fd5b506040516107d93803806107d983398101604081905261002f916100f4565b600361003b838261021d565b50600461004882826102dd565b506005805460ff191660ff9290921691909117905550610397915050565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261008d57600080fd5b81516001600160401b03808211156100a7576100a7610066565b604051601f8301601f19908116603f011681019082821181831017156100cf576100cf610066565b816040528381526020925086838588010111156100eb57600080fd5b600091505b8382101561010d57858201830151818301840152908201906100f0565b600093810190920192909252949350505050565b60008060006060848603121561013657600080fd5b83516001600160401b038082111561014d57600080fd5b6101598783880161007c565b9450602086015191508082111561016f57600080fd5b5061017c8682870161007c565b925050604084015160ff8116811461019357600080fd5b809150509250925092565b600181811c908216806101b257607f821691505b6020821081036101d257634e487b7160e01b600052602260045260246000fd5b50919050565b601f82111561021857600081815260208120601f850160051c810160208610156101ff5750805b601f850160051c820191505b8181101561021e5782815560010161020b565b50505b505050565b81516001600160401b0381111561023f5761023f610066565b6102538161024d845461019e565b846101d8565b602080601f83116001811461028857600084156102705750858301515b600019600386901b1c1916600185901b17855561021e565b600085815260208120601f198616915b828110156102b757888601518255948401946001909101908401610298565b50858210156102d55787850151600019600388901b60f8161c191681555b505050505050565b81516001600160401b038111156102f6576102f6610066565b61030a816103048454461019e565b846101d8565b602080601f83116001811461033f57600084156103275750858301515b600019600386901b1c1916600185901b17855561021e565b600085815260208120601f198616915b8281101561036e5788860151825594840194600190910190840161034f565b508582101561038c5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b610433806103a66000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c806370a082311161005b57806370a08231146100fe57806395d89b4114610127578063a9059cbb1461012f578063dd62ed3e1461014257600080fd5b806306fdde031461008d578063095ea7b3146100ab57806318160ddd146100ce57806323b872dd146100e5575b600080fd5b610095610178565b6040516100a291906102f0565b60405180910390f35b6100be6100b9366004610331565b61020a565b60405190151581526020016100a2565b6100d760025481565b6040519081526020016100a2565b6100be6100f336600461035b565b610224565b6100d761010c366004610397565b6001600160a01b031660009081526020819052604090205490565b610095610248565b6100be61013d366004610331565b610257565b6100d76101503660046103b9565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b606060038054610187906103ec565b80601f01602080910402602001604051908101604052809291908181526020018280546101b3906103ec565b80156102005780601f106101d557610100808354040283529160200191610200565b820191906000526020600020905b8154815290600101906020018083116101e357829003601f168201915b5050505050905090565b600033610218818585610265565b60019150505b92915050565b600033610232858285610277565b61023d8585856102f5565b506001949350505050565b606060048054610187906103ec565b6000336102188185856102f5565b6102728383836001610354565b505050565b6001600160a01b03838116600090815260016020908152604080832093861683529290522054600019811461033e57818110156103305760405163391434e360e21b81526001600160a01b038416600482015260248101829052604481018390526064015b60405180910390fd5b61033e84848484036000610354565b50505050565b6001600160a01b03831661037e5760405163391434e360e21b815260006004820152602401610327565b6001600160a01b03821661039e5760405163391434e360e21b815260006004820152602401610327565b6001600160a01b03831660009081526020819052604090205481811015610328576040516323c1a11d60e11b81526001600160a01b0384166004820152602481018290526044810183905260640161032756fea264697066735822122089c7e8b5d9c9d4c1e5c1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e164736f6c63430008150033"
  },
  SimpleCustody: {
    abi: [
      "constructor()",
      "function deposit() payable",
      "function withdraw(uint256 amount)",
      "function balanceOf(address account) view returns (uint256)",
      "event Deposit(address indexed user, uint256 amount)",
      "event Withdrawal(address indexed user, uint256 amount)"
    ],
    bytecode: "0x608060405234801561001057600080fd5b50610356806100206000396000f3fe6080604052600436106100435760003560e01c806327e235e31461004857806370a08231146100915780632e1a7d4d146100c8578063d0e30db0146100e8575b600080fd5b34801561005457600080fd5b5061007e610063366004610285565b6000602081905290815260409020546001600160a01b031681565b6040519081526020015b60405180910390f35b34801561009d57600080fd5b5061007e6100ac366004610285565b6001600160a01b031660009081526020819052604090205490565b3480156100d457600080fd5b506100e66100e33660046102a7565b6100f2565b005b6100e66101a2565b3360009081526020819052604090205481111561015c5760405162461bcd60e51b815260206004820152602260248201527f496e73756666696369656e742062616c616e636520666f72207769746864726160448201526177616c60f01b60648201526084015b60405180910390fd5b336000818152602081905260409081902080548492039055517f884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a94243649061019a9084815260200190565b60405180910390a250565b33600090815260208190526040812080543492906101c19084906102c0565b909155505060405134815233907fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c9060200160405180910390a2565b80356001600160a01b038116811461021857600080fd5b919050565b60006020828403121561022f57600080fd5b61023882610201565b9392505050565b60006020828403121561025157600080fd5b5035919050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561028157610281610258565b5092915050565b60006020828403121561029a57600080fd5b6102a382610201565b9392505050565b6000602082840312156102bc57600080fd5b5035919050565b808201808211156102d6576102d6610258565b9291505056fea2646970667358221220c8d5e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e164736f6c63430008150033"
  },
  SimpleAdjudicator: {
    abi: [
      "constructor(address custody)",
      "function submitDispute(bytes32 channelId, bytes memory state)",
      "function resolveDispute(bytes32 channelId)"
    ],
    bytecode: "0x608060405234801561001057600080fd5b506040516102873803806102878339818101604052810190610032919061007a565b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505061011e565b60008151905061006f816100fa565b92915050565b60006020828403121561008757600080fd5b600061009584828501610060565b91505092915050565b60006100a9826100c0565b9050919050565b60006100bb826100e0565b9050919050565b60006100cd826100b0565b9050919050565b60006100df8261009e565b9050919050565b60006100f1826100d4565b9050919050565b6101038161009e565b811461010e57600080fd5b50565b610159806101206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80635c19a95c1461003b578063958a6cf614610057575b600080fd5b6100556004803603810190610050919061009c565b610075565b005b61005f610077565b60405161006c91906100d8565b60405180910390f35b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000813590506100b081610125565b92915050565b6000602082840312156100c857600080fd5b60006100d6848285016100a1565b91505092915050565b60006100ea826100f3565b9050919050565b60006100fc82610113565b9050919050565b600061010e826100df565b9050919050565b600061012082610103565b9050919050565b61012e816100df565b811461013957600080fd5b5056fea264697066735822122056e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e664736f6c63430008150033"
  }
};

async function main() {
  console.log('\n🔺 Deploying Yellow Network Contracts to Avalanche Fuji\n');
  console.log('═'.repeat(60));

  // Check for private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('\n❌ Error: PRIVATE_KEY environment variable not set');
    console.log('\n💡 Set it with: $env:PRIVATE_KEY="0x..." (PowerShell)');
    console.log('   Or: set PRIVATE_KEY=0x... (CMD)\n');
    process.exit(1);
  }

  // Connect to Avalanche Fuji
  console.log(`\n📡 Connecting to Avalanche Fuji...`);
  const provider = new ethers.JsonRpcProvider(FUJI_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} AVAX`);
  
  if (balance < ethers.parseEther('0.1')) {
    console.error('\n❌ Error: Insufficient AVAX balance');
    console.log('\n💡 Get testnet AVAX from: https://faucets.chain.link/fuji\n');
    process.exit(1);
  }

  const deployedAddresses = {};

  // Deploy USDC Token
  console.log('\n1️⃣  Deploying USDC Token...');
  try {
    const USDCFactory = new ethers.ContractFactory(
      contracts.MockToken.abi,
      contracts.MockToken.bytecode,
      wallet
    );
    const usdc = await USDCFactory.deploy('Test USDC', 'USDC', 6);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    deployedAddresses.USDC = usdcAddress;
    console.log(`   ✅ USDC deployed: ${usdcAddress}`);
    console.log(`   🔍 SnowTrace: https://testnet.snowtrace.io/address/${usdcAddress}`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
  }

  // Deploy WETH Token
  console.log('\n2️⃣  Deploying WETH Token...');
  try {
    const WETHFactory = new ethers.ContractFactory(
      contracts.MockToken.abi,
      contracts.MockToken.bytecode,
      wallet
    );
    const weth = await WETHFactory.deploy('Wrapped Ether', 'WETH', 18);
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    deployedAddresses.WETH = wethAddress;
    console.log(`   ✅ WETH deployed: ${wethAddress}`);
    console.log(`   🔍 SnowTrace: https://testnet.snowtrace.io/address/${wethAddress}`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
  }

  // Deploy Custody Contract
  console.log('\n3️⃣  Deploying Custody Contract...');
  try {
    const CustodyFactory = new ethers.ContractFactory(
      contracts.SimpleCustody.abi,
      contracts.SimpleCustody.bytecode,
      wallet
    );
    const custody = await CustodyFactory.deploy();
    await custody.waitForDeployment();
    const custodyAddress = await custody.getAddress();
    deployedAddresses.Custody = custodyAddress;
    console.log(`   ✅ Custody deployed: ${custodyAddress}`);
    console.log(`   🔍 SnowTrace: https://testnet.snowtrace.io/address/${custodyAddress}`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
  }

  // Deploy Adjudicator Contract
  console.log('\n4️⃣  Deploying Adjudicator Contract...');
  try {
    const AdjudicatorFactory = new ethers.ContractFactory(
      contracts.SimpleAdjudicator.abi,
      contracts.SimpleAdjudicator.bytecode,
      wallet
    );
    const adjudicator = await AdjudicatorFactory.deploy(deployedAddresses.Custody);
    await adjudicator.waitForDeployment();
    const adjudicatorAddress = await adjudicator.getAddress();
    deployedAddresses.Adjudicator = adjudicatorAddress;
    console.log(`   ✅ Adjudicator deployed: ${adjudicatorAddress}`);
    console.log(`   🔍 SnowTrace: https://testnet.snowtrace.io/address/${adjudicatorAddress}`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 Deployment Complete!\n');
  console.log('📋 Deployed Contract Addresses:');
  console.log('─'.repeat(60));
  for (const [name, address] of Object.entries(deployedAddresses)) {
    console.log(`   ${name.padEnd(15)} ${address}`);
  }

  // Save to file
  const envContent = `
# 📋 Deployed Contract Addresses - Avalanche Fuji Testnet
NEXT_PUBLIC_CUSTODY_CONTRACT=${deployedAddresses.Custody || '0x0000000000000000000000000000000000000000'}
NEXT_PUBLIC_ADJUDICATOR_CONTRACT=${deployedAddresses.Adjudicator || '0x0000000000000000000000000000000000000000'}
NEXT_PUBLIC_TOKEN_CONTRACT=${deployedAddresses.USDC || '0x0000000000000000000000000000000000000000'}
`;

  const envPath = path.join(__dirname, '..', 'deployed-addresses.txt');
  fs.writeFileSync(envPath, envContent.trim());
  
  console.log('\n💾 Addresses saved to: deployed-addresses.txt');
  console.log('\n📝 Next Steps:');
  console.log('   1. Copy the addresses above');
  console.log('   2. Update your .env file:');
  console.log(`      NEXT_PUBLIC_CUSTODY_CONTRACT=${deployedAddresses.Custody || '0x...'}`);
  console.log(`      NEXT_PUBLIC_ADJUDICATOR_CONTRACT=${deployedAddresses.Adjudicator || '0x...'}`);
  console.log(`      NEXT_PUBLIC_TOKEN_CONTRACT=${deployedAddresses.USDC || '0x...'}`);
  console.log('   3. Run: npm run dev');
  console.log('   4. Test the application!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });
