/**
 * Phase 7: Proof Automation API
 * 
 * API endpoints for automated proof publishing and history
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * POST: Trigger automated proof generation and publishing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { epochId, autoPublish = false } = body;
    
    if (!epochId) {
      return NextResponse.json(
        { success: false, error: 'Epoch ID required' },
        { status: 400 }
      );
    }
    
    const results: any = {
      epochId,
      steps: []
    };
    
    // Step 1: Build Merkle tree
    try {
      const merkleResult = await execAsync(`npx tsx scripts/build-merkle-tree.ts ${epochId}`);
      results.steps.push({
        name: 'Merkle Tree',
        success: true,
        output: merkleResult.stdout
      });
    } catch (error: any) {
      results.steps.push({
        name: 'Merkle Tree',
        success: false,
        error: error.message
      });
      return NextResponse.json({ success: false, ...results }, { status: 500 });
    }
    
    // Step 2: Scan reserves
    try {
      const reservesResult = await execAsync(`npx tsx scripts/scan-reserves.ts ${epochId}`);
      results.steps.push({
        name: 'Reserves Scan',
        success: true,
        output: reservesResult.stdout
      });
    } catch (error: any) {
      results.steps.push({
        name: 'Reserves Scan',
        success: false,
        error: error.message
      });
      return NextResponse.json({ success: false, ...results }, { status: 500 });
    }
    
    // Step 3: Generate proof
    try {
      const proofResult = await execAsync(`npx tsx scripts/generate-proof.ts ${epochId}`);
      results.steps.push({
        name: 'Proof Generation',
        success: true,
        output: proofResult.stdout
      });
    } catch (error: any) {
      results.steps.push({
        name: 'Proof Generation',
        success: false,
        error: error.message
      });
      return NextResponse.json({ success: false, ...results }, { status: 500 });
    }
    
    // Step 4: Verify proof (off-chain)
    try {
      const verifyResult = await execAsync(`npx tsx scripts/verify-proof.ts ${epochId}`);
      results.steps.push({
        name: 'Proof Verification',
        success: true,
        output: verifyResult.stdout
      });
    } catch (error: any) {
      results.steps.push({
        name: 'Proof Verification',
        success: false,
        error: error.message
      });
      // Continue even if verification fails
    }
    
    // Step 5: Publish on-chain (if autoPublish enabled)
    if (autoPublish && process.env.DEPLOYER_PRIVATE_KEY) {
      try {
        const publishResult = await execAsync(`npx tsx scripts/publish-proof.ts ${epochId}`);
        results.steps.push({
          name: 'On-Chain Publication',
          success: true,
          output: publishResult.stdout
        });
      } catch (error: any) {
        results.steps.push({
          name: 'On-Chain Publication',
          success: false,
          error: error.message
        });
        // Don't fail the whole pipeline
      }
    } else if (autoPublish) {
      results.steps.push({
        name: 'On-Chain Publication',
        success: false,
        error: 'DEPLOYER_PRIVATE_KEY not configured'
      });
    }
    
    return NextResponse.json({
      success: true,
      ...results,
      message: 'Proof pipeline completed successfully'
    });
    
  } catch (error: any) {
    console.error('Proof automation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET: Get proof automation status and history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    // Get latest proof status
    if (action === 'latest') {
      const epochsDir = path.join(process.cwd(), 'solvency', 'epochs');
      
      try {
        const entries = await fs.readdir(epochsDir, { withFileTypes: true });
        const epochDirs = entries
          .filter(e => e.isDirectory() && e.name.startsWith('epoch_'))
          .map(e => e.name)
          .sort()
          .reverse();
        
        if (epochDirs.length === 0) {
          return NextResponse.json({
            success: true,
            latest: null,
            message: 'No epochs found'
          });
        }
        
        const latestEpoch = epochDirs[0];
        const epochPath = path.join(epochsDir, latestEpoch);
        
        // Check which files exist
        const hasProof = await fileExists(path.join(epochPath, 'proof.json'));
        const hasReserves = await fileExists(path.join(epochPath, 'reserves.json'));
        const hasMerkle = await fileExists(path.join(epochPath, 'merkle_metadata.json'));
        
        return NextResponse.json({
          success: true,
          latest: {
            epochId: latestEpoch,
            hasProof,
            hasReserves,
            hasMerkle,
            path: epochPath
          }
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }
    
    // List all epochs
    if (action === 'list') {
      const epochsDir = path.join(process.cwd(), 'solvency', 'epochs');
      
      try {
        const entries = await fs.readdir(epochsDir, { withFileTypes: true });
        const epochs = entries
          .filter(e => e.isDirectory() && e.name.startsWith('epoch_'))
          .map(e => e.name)
          .sort()
          .reverse();
        
        return NextResponse.json({
          success: true,
          epochs,
          count: epochs.length
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }
    
    // Default: return status
    return NextResponse.json({
      success: true,
      message: 'Proof automation API ready',
      endpoints: {
        POST: 'Trigger proof generation and publishing',
        'GET?action=latest': 'Get latest epoch status',
        'GET?action=list': 'List all epochs'
      }
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
