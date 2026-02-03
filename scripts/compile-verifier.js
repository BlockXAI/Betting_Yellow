/**
 * Compile SolvencyVerifier.sol using solc
 */

const solc = require('solc');
const fs = require('fs');
const path = require('path');

console.log('📝 Compiling SolvencyVerifier.sol...\n');

// Read contract source
const contractPath = path.join(__dirname, '../contracts/SolvencyVerifier.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Prepare input for compiler
const input = {
  language: 'Solidity',
  sources: {
    'SolvencyVerifier.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    },
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};

// Compile
console.log('⚙️  Compiling contract...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
  const errors = output.errors.filter(e => e.severity === 'error');
  if (errors.length > 0) {
    console.error('❌ Compilation errors:');
    errors.forEach(error => console.error(error.formattedMessage));
    process.exit(1);
  }
  
  // Show warnings
  const warnings = output.errors.filter(e => e.severity === 'warning');
  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    warnings.forEach(warning => console.warn(warning.formattedMessage));
  }
}

// Extract compiled contract
const contract = output.contracts['SolvencyVerifier.sol']['SolvencyVerifier'];

if (!contract) {
  console.error('❌ Contract not found in compilation output');
  process.exit(1);
}

// Save ABI and bytecode
const artifactsDir = path.join(__dirname, '../artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

const artifact = {
  contractName: 'SolvencyVerifier',
  abi: contract.abi,
  bytecode: '0x' + contract.evm.bytecode.object
};

fs.writeFileSync(
  path.join(artifactsDir, 'SolvencyVerifier.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('\n✅ Compilation successful!');
console.log(`📦 Bytecode size: ${contract.evm.bytecode.object.length / 2} bytes`);
console.log(`💾 Artifacts saved to: artifacts/SolvencyVerifier.json`);
