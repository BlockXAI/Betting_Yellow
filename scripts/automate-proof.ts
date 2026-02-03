/**
 * Phase 7: Automated Proof Pipeline
 * 
 * Runs the complete proof generation and publishing pipeline automatically.
 * 
 * Usage:
 *   npx tsx scripts/automate-proof.ts [epoch-id]
 *   npx tsx scripts/automate-proof.ts epoch_1738525000000
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Find latest epoch
 */
async function findLatestEpoch(): Promise<string | null> {
  const epochsDir = path.join(process.cwd(), 'solvency', 'epochs');
  
  try {
    const entries = await fs.readdir(epochsDir, { withFileTypes: true });
    const epochDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('epoch_'))
      .map(e => e.name)
      .sort()
      .reverse();
    
    return epochDirs.length > 0 ? epochDirs[0] : null;
  } catch {
    return null;
  }
}

/**
 * Run command with output
 */
async function runStep(name: string, command: string): Promise<boolean> {
  console.log(`\n${name}...`);
  console.log('─'.repeat(60));
  
  try {
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`✅ ${name} complete`);
    return true;
  } catch (error: any) {
    console.error(`❌ ${name} failed:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  let epochId: string | null = null;
  
  console.log('\n🤖 Automated Proof Pipeline - Phase 7\n');
  console.log('═'.repeat(60));
  
  // Determine epoch
  if (args.length > 0) {
    epochId = args[0];
  } else {
    console.log('⏳ No epoch specified, finding latest...');
    epochId = await findLatestEpoch();
  }
  
  if (!epochId) {
    console.error('\n❌ Error: No epoch found\n');
    console.log('Usage: npx tsx scripts/automate-proof.ts <epoch-id>\n');
    process.exit(1);
  }
  
  console.log(`📁 Epoch: ${epochId}\n`);
  console.log('Running complete solvency proof pipeline...\n');
  
  const steps = [
    {
      name: '1️⃣  Build Merkle Tree',
      command: `npx tsx scripts/build-merkle-tree.ts ${epochId}`
    },
    {
      name: '2️⃣  Scan Reserves',
      command: `npx tsx scripts/scan-reserves.ts ${epochId}`
    },
    {
      name: '3️⃣  Generate ZK Proof',
      command: `npx tsx scripts/generate-proof.ts ${epochId}`
    },
    {
      name: '4️⃣  Verify Proof (Off-Chain)',
      command: `npx tsx scripts/verify-proof.ts ${epochId}`
    },
    {
      name: '5️⃣  Publish Proof (On-Chain)',
      command: `npx tsx scripts/publish-proof.ts ${epochId}`
    },
    {
      name: '6️⃣  Verify Proof (On-Chain)',
      command: `npx tsx scripts/verify-on-chain.ts ${epochId}`
    }
  ];
  
  let allSuccess = true;
  const results = [];
  
  for (const step of steps) {
    const success = await runStep(step.name, step.command);
    results.push({ name: step.name, success });
    
    if (!success) {
      allSuccess = false;
      // Continue with remaining steps even if one fails
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Pipeline Summary\n');
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log('\n' + '═'.repeat(60));
  
  if (allSuccess) {
    console.log('🎉 All steps completed successfully!\n');
    console.log('✅ Merkle tree built');
    console.log('✅ Reserves scanned');
    console.log('✅ Proof generated');
    console.log('✅ Proof verified off-chain');
    console.log('✅ Proof published on-chain');
    console.log('✅ Proof verified on-chain\n');
    console.log('🔗 View proofs on SnowTrace:');
    console.log('   https://testnet.snowtrace.io\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some steps failed. Check errors above.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Pipeline error:', error);
  process.exit(1);
});
