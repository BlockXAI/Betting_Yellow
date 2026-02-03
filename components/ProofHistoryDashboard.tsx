/**
 * Phase 7: Proof History Dashboard
 * 
 * Displays published solvency proofs with real-time status updates.
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { getProofAutomationService, ProofHistory, ProofPublicationStatus } from '@/lib/proofAutomation';

export default function ProofHistoryDashboard() {
  const [history, setHistory] = useState<ProofHistory[]>([]);
  const [latestStatus, setLatestStatus] = useState<ProofPublicationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Initialize service
    const service = getProofAutomationService();
    
    const init = async () => {
      await service.initialize();
      setIsInitialized(true);
      
      // Load initial history
      setHistory(service.getHistory());
      
      // Subscribe to publication events
      service.onPublicationStatus((status) => {
        setLatestStatus(status);
        setHistory(service.getHistory());
        
        // Clear status after 5 seconds
        setTimeout(() => setLatestStatus(null), 5000);
      });
    };
    
    init();
  }, []);
  
  const refreshHistory = () => {
    setLoading(true);
    const service = getProofAutomationService();
    setHistory(service.getHistory());
    setTimeout(() => setLoading(false), 500);
  };
  
  const clearHistory = () => {
    if (confirm('Clear all proof history?')) {
      const service = getProofAutomationService();
      service.clearHistory();
      setHistory([]);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getSnowTraceUrl = (txHash: string) => {
    return `https://testnet.snowtrace.io/tx/${txHash}`;
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Solvency Proof History</h3>
          <p className="text-sm text-gray-500 mt-1">
            Published proofs on Avalanche Fuji
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshHistory}
            disabled={loading}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Latest Status Alert */}
      {latestStatus && (
        <div className={`mb-4 p-4 rounded-lg border ${
          latestStatus.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {latestStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className={`font-medium ${
                latestStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {latestStatus.success ? 'Proof Published Successfully!' : 'Publication Failed'}
              </p>
              {latestStatus.txHash && (
                <a
                  href={getSnowTraceUrl(latestStatus.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  View on SnowTrace <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {latestStatus.error && (
                <p className="text-sm text-red-600 mt-1">{latestStatus.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Published</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {history.filter(h => h.status === 'published').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Solvent</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {history.filter(h => h.isSolvent && h.status === 'published').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Insolvent</p>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {history.filter(h => !h.isSolvent && h.status === 'published').length}
          </p>
        </div>
      </div>
      
      {/* History Table */}
      {!isInitialized ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Initializing proof service...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No proofs published yet</p>
          <p className="text-sm mt-1">Proofs will appear here after sessions close</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Epoch ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Published
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Solvency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {entry.epochId.slice(0, 20)}...
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(entry.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      entry.isSolvent 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.isSolvent ? '✓ Solvent' : '✗ Insolvent'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entry.status)}
                      <span className="text-sm capitalize">{entry.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {entry.txHash ? (
                      <a
                        href={getSnowTraceUrl(entry.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Footer Info */}
      {isInitialized && history.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {history.length} proof{history.length !== 1 ? 's' : ''}
          {' • '}
          <a
            href="https://testnet.snowtrace.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View all on SnowTrace
          </a>
        </div>
      )}
    </div>
  );
}
