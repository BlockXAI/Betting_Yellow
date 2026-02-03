/**
 * Phase 7: Automated Proof Publication Service
 * 
 * Handles automated publishing of solvency proofs after session close.
 * Monitors proof status and provides alerts for failures.
 */

import { ethers } from 'ethers';

// Configuration
const AVALANCHE_FUJI_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const VERIFIER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT || '';

const VERIFIER_ABI = [
  'function publishProof(bytes32 epochId, bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, bytes32 witnessHash, bytes32 reservesCommitment, bytes32 liabilitiesCommitment, bytes32 solvencyAssertion) external',
  'function getProof(bytes32 epochId) external view returns (bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, address publisher, bool verified)',
  'function proofExists(bytes32 epochId) external view returns (bool)',
  'event ProofPublished(bytes32 indexed epochId, bytes32 indexed merkleRoot, bool isSolvent, address publisher, uint256 timestamp)'
];

export interface ProofPublicationStatus {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
  timestamp: number;
  epochId: string;
}

export interface ProofHistory {
  epochId: string;
  publishedAt: string;
  txHash: string;
  isSolvent: boolean;
  publisher: string;
  status: 'published' | 'pending' | 'failed';
}

/**
 * Automated proof publisher
 */
export class ProofAutomationService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private history: ProofHistory[] = [];
  private listeners: ((status: ProofPublicationStatus) => void)[] = [];
  
  constructor() {
    this.loadHistory();
  }
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (!VERIFIER_CONTRACT_ADDRESS) {
      console.warn('ProofAutomation: Verifier contract not configured');
      return;
    }
    
    try {
      this.provider = new ethers.JsonRpcProvider(AVALANCHE_FUJI_RPC);
      this.contract = new ethers.Contract(
        VERIFIER_CONTRACT_ADDRESS,
        VERIFIER_ABI,
        this.provider
      );
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('✅ ProofAutomationService initialized');
    } catch (error) {
      console.error('Failed to initialize ProofAutomationService:', error);
    }
  }
  
  /**
   * Automatically publish proof for an epoch
   */
  async publishProofAutomatically(
    epochId: string,
    proofData: any,
    privateKey?: string
  ): Promise<ProofPublicationStatus> {
    const startTime = Date.now();
    
    try {
      // Check if verifier is configured
      if (!VERIFIER_CONTRACT_ADDRESS) {
        return {
          success: false,
          error: 'Verifier contract not configured',
          timestamp: startTime,
          epochId
        };
      }
      
      // Check if private key is provided
      if (!privateKey) {
        // Try to get from env
        privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        
        if (!privateKey) {
          return {
            success: false,
            error: 'No private key available for automated publishing',
            timestamp: startTime,
            epochId
          };
        }
      }
      
      // Create signer
      const provider = new ethers.JsonRpcProvider(AVALANCHE_FUJI_RPC);
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, VERIFIER_ABI, wallet);
      
      // Convert epoch ID to bytes32
      const epochBytes32 = ethers.id(epochId);
      
      // Check if already published
      const exists = await contract.proofExists(epochBytes32);
      if (exists) {
        console.log(`⏭️  Proof already published for ${epochId}`);
        return {
          success: true,
          error: 'Already published',
          timestamp: startTime,
          epochId
        };
      }
      
      console.log(`📤 Auto-publishing proof for ${epochId}...`);
      
      // Publish proof
      const tx = await contract.publishProof(
        epochBytes32,
        proofData.publicSignals.merkle_root,
        proofData.publicSignals.timestamp,
        proofData.publicSignals.is_solvent,
        proofData.proof.commitment,
        proofData.proof.witness_hash,
        proofData.proof.reserves_commitment,
        proofData.proof.liabilities_commitment,
        proofData.proof.solvency_assertion
      );
      
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`✅ Proof published at block ${receipt.blockNumber}`);
      
      // Add to history
      this.addToHistory({
        epochId,
        publishedAt: new Date().toISOString(),
        txHash: receipt.hash,
        isSolvent: proofData.publicSignals.is_solvent,
        publisher: wallet.address,
        status: 'published'
      });
      
      const status: ProofPublicationStatus = {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
        epochId
      };
      
      // Notify listeners
      this.notifyListeners(status);
      
      return status;
      
    } catch (error: any) {
      console.error('Auto-publish failed:', error);
      
      const status: ProofPublicationStatus = {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: Date.now(),
        epochId
      };
      
      // Notify listeners of failure
      this.notifyListeners(status);
      
      return status;
    }
  }
  
  /**
   * Set up event listeners for on-chain proof events
   */
  private setupEventListeners(): void {
    if (!this.contract) return;
    
    try {
      // Listen for ProofPublished events
      this.contract.on('ProofPublished', (epochId, merkleRoot, isSolvent, publisher, timestamp, event) => {
        console.log('🔔 ProofPublished event:', {
          epochId,
          merkleRoot,
          isSolvent,
          publisher,
          timestamp: new Date(Number(timestamp) * 1000).toISOString(),
          blockNumber: event.log.blockNumber,
          txHash: event.log.transactionHash
        });
        
        // Update history
        this.addToHistory({
          epochId: epochId.toString(),
          publishedAt: new Date(Number(timestamp) * 1000).toISOString(),
          txHash: event.log.transactionHash,
          isSolvent,
          publisher,
          status: 'published'
        });
      });
      
      console.log('✅ Event listeners configured');
    } catch (error) {
      console.error('Failed to set up event listeners:', error);
    }
  }
  
  /**
   * Add publication status listener
   */
  onPublicationStatus(callback: (status: ProofPublicationStatus) => void): void {
    this.listeners.push(callback);
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners(status: ProofPublicationStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }
  
  /**
   * Get proof history
   */
  getHistory(): ProofHistory[] {
    return [...this.history].reverse(); // Most recent first
  }
  
  /**
   * Add to history
   */
  private addToHistory(entry: ProofHistory): void {
    // Remove duplicates
    this.history = this.history.filter(h => h.epochId !== entry.epochId);
    
    // Add new entry
    this.history.push(entry);
    
    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
    
    // Save to localStorage
    this.saveHistory();
  }
  
  /**
   * Load history from localStorage
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('proof_publication_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load proof history:', error);
    }
  }
  
  /**
   * Save history to localStorage
   */
  private saveHistory(): void {
    try {
      localStorage.setItem('proof_publication_history', JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save proof history:', error);
    }
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    localStorage.removeItem('proof_publication_history');
  }
  
  /**
   * Get latest proof status
   */
  async getLatestProofStatus(): Promise<{ epochId: string; isSolvent: boolean; timestamp: Date } | null> {
    if (!this.contract) return null;
    
    try {
      const latest = await this.contract.getLatestProof();
      return {
        epochId: latest[0].toString(),
        isSolvent: latest[3],
        timestamp: new Date(Number(latest[2]) * 1000)
      };
    } catch (error) {
      console.error('Failed to get latest proof:', error);
      return null;
    }
  }
  
  /**
   * Check if proof exists on-chain
   */
  async proofExists(epochId: string): Promise<boolean> {
    if (!this.contract) return false;
    
    try {
      const epochBytes32 = ethers.id(epochId);
      return await this.contract.proofExists(epochBytes32);
    } catch (error) {
      console.error('Failed to check proof existence:', error);
      return false;
    }
  }
}

// Singleton instance
let instance: ProofAutomationService | null = null;

export function getProofAutomationService(): ProofAutomationService {
  if (!instance) {
    instance = new ProofAutomationService();
  }
  return instance;
}
