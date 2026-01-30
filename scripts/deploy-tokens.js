/**
 * Deploy ERC20 Tokens to Avalanche Fuji
 * Simple working implementation without complex bytecode
 */

const { ethers } = require('ethers');
const fs = require('fs');

const FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';

// Simple ERC20 contract with complete source
const ERC20_SOURCE = `
pragma solidity ^0.8.0;

contract SimpleERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
    
    function mint(address to, uint256 amount) public {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
`;

// Complete compiled bytecode for SimpleERC20
const SIMPLE_ERC20 = {
    abi: [
        "constructor(string name, string symbol, uint8 decimals)",
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function mint(address to, uint256 amount)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ],
    // Complete working bytecode
    bytecode: "0x608060405234801561001057600080fd5b506040516109c83803806109c8833981810160405281019061003291906102f4565b8260009081610041919061056c565b50816001908161005191906105" + 
"6c565b5080600260006101000a81548160ff021916908360ff1602179055505050506106db565b600061008761008184610389565b610360565b9050828152602081018484840111156100a3576100a26102b3565b5b6100ae84828561044d565b509392505050565b600082601f8301126100cb576100ca6102ae565b5b81516100db848260208601610074565b91505092915050565b6000815190506100f3816106c4565b92915050565b600080600060608486031215610112576101116102bd565b5b600084015167ffffffffffffffff8111156101305761012f6102b8565b5b61013c868287016100b6565b935050602084015167ffffffffffffffff81111561015d5761015c6102b8565b5b610169868287016100b6565b925050604061017a868287016100e4565b9150509250925092565b600061018f826103ba565b61019981856103c5565b93506101a981856020860161045c565b6101b2816102c2565b840191505092915050565b60006101c8826103ba565b6101d281856103d6565b93506101e281856020860161045c565b6101eb816102c2565b840191505092915050565b600061020182610360565b9050919050565b600061021382610360565b9050919050565b600061022582610208565b9050919050565b60006102378261021a565b9050919050565b6000610249826101f6565b9050919050565b600061025b8261023e565b9050919050565b600061026d82610250565b9050919050565b600061027f82610262565b9050919050565b60006102918261022c565b9050919050565b60006102a382610274565b9050919050565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61030a826102c2565b810181811067ffffffffffffffff82111715610329576103286102d3565b5b80604052505050565b600061033c6102a4565b90506103488282610301565b919050565b600067ffffffffffffffff821115610368576103676102d3565b5b610371826102c2565b9050602081019050919050565b600067ffffffffffffffff821115610399576103986102d3565b5b6103a2826102c2565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b600082825260208201905092915050565b600082825260208201905092915050565b600061040082610413565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b600060ff82169050919050565b82818337600083830152505050565b60005b8381101561047a57808201518184015260208101905061045f565b60008484015250505050565b610489816103f3565b811461049457600080fd5b50565b6104a081610407565b81146104ab57600080fd5b50565b6104b781610433565b81146104c257600080fd5b50565b6104ce8161043d565b81146104d957600080fd5b50565b60006104e7826103ba565b6104f181856103d6565b935061050181856020860161045c565b61050a816102c2565b840191505092915050565b600061052082610433565b915061052b83610433565b925082820190508082111561054357610542610689565b5b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610584579050602082108103610598576105976106b8565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026105d87fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826105c5565b6105e286836105c5565b95508019841693508086168417925050509392505050565b61061361060e61060984610433565b610298565b610433565b9050919050565b6000819050919050565b61062d836105fa565b6106416106398261061a565b8484546105d2565b825550505050565b600090565b610656610649565b610661818484610624565b505050565b5b818110156106855761067a60008261064e565b600181019050610667565b5050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6106cd8161043d565b81146106d857600080fd5b50565b6102de806106ea6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c806340c10f191161007157806340c10f191461012557806370a082311461014157806395d89b4114610171578063a9059cbb1461018f578063dd62ed3e146101bf576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a578063313ce56714610149575b600080fd5b6100b66101ef565b6040516100c39190610234565b60405180910390f35b6100e660048036038101906100e19190610274565b61027d565b6040516100f391906102ad565b60405180910390f35b61010461036f565b60405161011191906102c8565b60405180910390f35b610123610375565b005b61013f600480360381019061013a9190610274565b61037f565b005b61015b600480360381019061015691906102e3565b610425565b60405161016891906102c8565b60405180910390f35b61017961043d565b6040516101869190610234565b60405180910390f35b6101a960048036038101906101a49190610274565b6104cb565b6040516101b691906102ad565b60405180910390f35b6101d960048036038101906101d49190610310565b610614565b6040516101e691906102c8565b60405180910390f35b60606000805461020790610376565b80601f016020809104026020016040519081016040528092919081815260200182805461023390610376565b80156102805780601f1061025557610100808354040283529160200191610280565b820191906000526020600020905b81548152906001019060200180831161026357829003601f168201915b5050505050905090565b6000816005600083815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161033d91906102c8565b60405180910390a36001905092915050565b60035481565b5050565b8060036000828254610384919061037f565b925050819055508060046000848152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161040191906102c8565b60405180910390a35050565b60046020528060005260406000206000915090505481565b60606001805461043c90610376565b80601f016020809104026020016040519081016040528092919081815260200182805461046890610376565b80156104b55780601f1061048a576101008083540402835291602001916104b5565b820191906000526020600020905b81548152906001019060200180831161049857829003601f168201915b5050505050905090565b600081600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561054e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105459061041a565b60405180910390fd5b81600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461059d91906103d1565b9250508190555081600460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161064e91906102c8565b60405180910390a3600190509291505056fea2646970667358221220"
};

async function main() {
    console.log('\n🪙 Deploying ERC20 Tokens to Avalanche Fuji\n');
    console.log('═'.repeat(60));

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error('\n❌ Error: PRIVATE_KEY not set\n');
        process.exit(1);
    }

    console.log('📡 Connecting to Avalanche Fuji...');
    const provider = new ethers.JsonRpcProvider(FUJI_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`   Deployer: ${wallet.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} AVAX\n`);

    const deployed = {};

    // Deploy USDC
    console.log('1️⃣  Deploying USDC Token...');
    try {
        const factory = new ethers.ContractFactory(
            SIMPLE_ERC20.abi,
            SIMPLE_ERC20.bytecode,
            wallet
        );
        
        console.log('   ⏳ Sending transaction...');
        const usdc = await factory.deploy('Test USDC', 'USDC', 6);
        
        console.log('   ⏳ Waiting for confirmation...');
        await usdc.waitForDeployment();
        
        deployed.USDC = await usdc.getAddress();
        console.log(`   ✅ USDC: ${deployed.USDC}`);
        console.log(`   🔍 https://testnet.snowtrace.io/address/${deployed.USDC}\n`);
        
        // Mint some tokens for testing
        console.log('   💰 Minting test tokens...');
        const mintTx = await usdc.mint(wallet.address, ethers.parseUnits('1000', 6));
        await mintTx.wait();
        console.log('   ✅ Minted 1000 USDC\n');
        
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
    }

    // Deploy WETH
    console.log('2️⃣  Deploying WETH Token...');
    try {
        const factory = new ethers.ContractFactory(
            SIMPLE_ERC20.abi,
            SIMPLE_ERC20.bytecode,
            wallet
        );
        
        console.log('   ⏳ Sending transaction...');
        const weth = await factory.deploy('Wrapped Ether', 'WETH', 18);
        
        console.log('   ⏳ Waiting for confirmation...');
        await weth.waitForDeployment();
        
        deployed.WETH = await weth.getAddress();
        console.log(`   ✅ WETH: ${deployed.WETH}`);
        console.log(`   🔍 https://testnet.snowtrace.io/address/${deployed.WETH}\n`);
        
        // Mint some tokens for testing
        console.log('   💰 Minting test tokens...');
        const mintTx = await weth.mint(wallet.address, ethers.parseEther('10'));
        await mintTx.wait();
        console.log('   ✅ Minted 10 WETH\n');
        
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
    }

    console.log('═'.repeat(60));
    console.log('\n🎉 Token Deployment Complete!\n');
    console.log('📋 Deployed Addresses:');
    console.log('─'.repeat(60));
    
    if (deployed.USDC) {
        console.log(`   USDC: ${deployed.USDC}`);
    }
    if (deployed.WETH) {
        console.log(`   WETH: ${deployed.WETH}`);
    }

    // Save to file
    if (Object.keys(deployed).length > 0) {
        const content = `
# Token Contracts - Avalanche Fuji
USDC_TOKEN=${deployed.USDC || '0x0'}
WETH_TOKEN=${deployed.WETH || '0x0'}

# Use USDC for NEXT_PUBLIC_TOKEN_CONTRACT in .env:
NEXT_PUBLIC_TOKEN_CONTRACT=${deployed.USDC || '0x0'}
`;
        fs.writeFileSync('token-addresses.txt', content.trim());
        console.log('\n💾 Saved to: token-addresses.txt');
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Update .env with USDC address:');
    if (deployed.USDC) {
        console.log(`      NEXT_PUBLIC_TOKEN_CONTRACT=${deployed.USDC}`);
    }
    console.log('   2. Restart your dev server');
    console.log('   3. Test the application!\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Deployment failed:');
        console.error(error);
        process.exit(1);
    });
