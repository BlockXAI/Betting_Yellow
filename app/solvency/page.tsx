/**
 * Phase 8: Public Solvency Dashboard
 * 
 * Public-facing interface for verifying solvency proofs.
 * Anyone can view published proofs and verify their inclusion.
 */

'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CheckCircle2, XCircle, Upload, Search, ExternalLink, Shield, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// Configuration
const AVALANCHE_FUJI_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const VERIFIER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT || '';

const VERIFIER_ABI = [
  'function getProofCount() external view returns (uint256)',
  'function getEpochIdByIndex(uint256 index) external view returns (bytes32)',
  'function getProof(bytes32 epochId) external view returns (bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, address publisher, bool verified)',
  'function getDetailedProof(bytes32 epochId) external view returns (tuple(bytes32 merkleRoot, uint256 timestamp, bool isSolvent, bytes32 commitment, bytes32 witnessHash, bytes32 reservesCommitment, bytes32 liabilitiesCommitment, bytes32 solvencyAssertion, address publisher, uint256 blockNumber, bool verified))',
  'event ProofPublished(bytes32 indexed epochId, bytes32 indexed merkleRoot, bool isSolvent, address publisher, uint256 timestamp)'
];

interface ProofEntry {
  epochId: string;
  merkleRoot: string;
  timestamp: number;
  isSolvent: boolean;
  commitment: string;
  publisher: string;
  verified: boolean;
  blockNumber?: number;
}

interface InclusionProof {
  address: string;
  balance: string;
  proof: string[];
  root: string;
  verified?: boolean;
}

export default function SolvencyDashboard() {
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<ProofEntry | null>(null);
  const [inclusionFile, setInclusionFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  useEffect(() => {
    loadProofs();
  }, []);
  
  /**
   * Load all published proofs from on-chain
   */
  async function loadProofs() {
    if (!VERIFIER_CONTRACT_ADDRESS) {
      setLoading(false);
      return;
    }
    
    try {
      const provider = new ethers.JsonRpcProvider(AVALANCHE_FUJI_RPC);
      const contract = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, VERIFIER_ABI, provider);
      
      const count = await contract.getProofCount();
      const proofList: ProofEntry[] = [];
      
      for (let i = 0; i < Number(count); i++) {
        try {
          const epochId = await contract.getEpochIdByIndex(i);
          const proof = await contract.getProof(epochId);
          
          proofList.push({
            epochId: epochId.toString(),
            merkleRoot: proof[0],
            timestamp: Number(proof[1]),
            isSolvent: proof[2],
            commitment: proof[3],
            publisher: proof[4],
            verified: proof[5]
          });
        } catch (error) {
          console.error(`Error loading proof ${i}:`, error);
        }
      }
      
      // Sort by timestamp (newest first)
      proofList.sort((a, b) => b.timestamp - a.timestamp);
      
      setProofs(proofList);
    } catch (error) {
      console.error('Failed to load proofs:', error);
    } finally {
      setLoading(false);
    }
  }
  
  /**
   * Handle inclusion proof file upload
   */
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setInclusionFile(file);
      setVerificationResult(null);
    }
  }
  
  /**
   * Verify inclusion proof
   */
  async function verifyInclusion() {
    if (!inclusionFile || !selectedProof) return;
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const fileContent = await inclusionFile.text();
      const inclusionProof: InclusionProof = JSON.parse(fileContent);
      
      // Verify the proof
      const leaf = keccak256(
        Buffer.concat([
          Buffer.from(inclusionProof.address.slice(2), 'hex'),
          Buffer.from(inclusionProof.balance.slice(2).padStart(64, '0'), 'hex')
        ])
      );
      
      // Reconstruct Merkle tree path
      let computedHash = leaf;
      for (const proofElement of inclusionProof.proof) {
        const proofBuf = Buffer.from(proofElement.slice(2), 'hex');
        
        if (Buffer.compare(computedHash, proofBuf) < 0) {
          computedHash = keccak256(Buffer.concat([computedHash, proofBuf]));
        } else {
          computedHash = keccak256(Buffer.concat([proofBuf, computedHash]));
        }
      }
      
      const computedRoot = '0x' + computedHash.toString('hex');
      const verified = computedRoot.toLowerCase() === selectedProof.merkleRoot.toLowerCase();
      
      if (verified) {
        setVerificationResult({
          success: true,
          message: `✅ Your balance of ${ethers.formatEther(inclusionProof.balance)} AVAX is included in this epoch!`,
          details: {
            address: inclusionProof.address,
            balance: ethers.formatEther(inclusionProof.balance),
            epochId: selectedProof.epochId,
            merkleRoot: selectedProof.merkleRoot
          }
        });
      } else {
        setVerificationResult({
          success: false,
          message: '❌ Proof verification failed. This balance is not included in the selected epoch.',
          details: {
            computedRoot,
            expectedRoot: selectedProof.merkleRoot
          }
        });
      }
    } catch (error: any) {
      setVerificationResult({
        success: false,
        message: `❌ Error: ${error.message}`,
      });
    } finally {
      setIsVerifying(false);
    }
  }
  
  /**
   * Get statistics
   */
  const stats = {
    total: proofs.length,
    solvent: proofs.filter(p => p.isSolvent).length,
    insolvent: proofs.filter(p => !p.isSolvent).length,
    verified: proofs.filter(p => p.verified).length
  };
  
  /**
   * Filter proofs by search query
   */
  const filteredProofs = proofs.filter(proof => 
    proof.epochId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proof.merkleRoot.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proof.publisher.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Solvency Proof Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Verify cryptographic proofs of reserves and liabilities
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Avalanche Fuji Testnet • Public Verification
          </p>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Proofs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Solvent</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.solvent}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Insolvent</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.insolvent}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.verified}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by epoch ID, merkle root, or publisher address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Proofs List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Published Proofs</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredProofs.length} proof{filteredProofs.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading proofs...</p>
            </div>
          ) : filteredProofs.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No proofs found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery ? 'Try a different search query' : 'Proofs will appear here once published'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Epoch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Merkle Root
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solvency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProofs.map((proof, index) => (
                    <tr 
                      key={index}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedProof?.epochId === proof.epochId ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedProof(proof)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {proof.epochId.slice(0, 16)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {proof.merkleRoot.slice(0, 10)}...{proof.merkleRoot.slice(-8)}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(proof.timestamp * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          proof.isSolvent 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {proof.isSolvent ? (
                            <><CheckCircle2 className="w-3 h-3" /> Solvent</>
                          ) : (
                            <><XCircle className="w-3 h-3" /> Insolvent</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          proof.verified 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {proof.verified ? '✓ Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`https://testnet.snowtrace.io/address/${VERIFIER_CONTRACT_ADDRESS}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Inclusion Verification */}
        {selectedProof && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Verify Your Inclusion
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Selected Epoch:</strong> <code>{selectedProof.epochId.slice(0, 32)}...</code>
              </p>
              <p className="text-sm text-blue-900 mt-1">
                <strong>Merkle Root:</strong> <code>{selectedProof.merkleRoot}</code>
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload your inclusion proof JSON
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Upload the <code>inclusion_&lt;address&gt;.json</code> file for this epoch
                </p>
              </div>
              
              <button
                onClick={verifyInclusion}
                disabled={!inclusionFile || isVerifying}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium
                  hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                  transition-colors flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Verify Inclusion
                  </>
                )}
              </button>
              
              {verificationResult && (
                <div className={`p-4 rounded-lg border ${
                  verificationResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`font-medium ${
                    verificationResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {verificationResult.message}
                  </p>
                  
                  {verificationResult.details && verificationResult.success && (
                    <div className="mt-3 space-y-1 text-sm text-green-800">
                      <p><strong>Address:</strong> <code>{verificationResult.details.address}</code></p>
                      <p><strong>Balance:</strong> {verificationResult.details.balance} AVAX</p>
                      <p><strong>Epoch:</strong> <code>{verificationResult.details.epochId.slice(0, 32)}...</code></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by Yellow Network • Avalanche Fuji Testnet
          </p>
          <p className="mt-2">
            <a 
              href="https://testnet.snowtrace.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View all transactions on SnowTrace ↗
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
