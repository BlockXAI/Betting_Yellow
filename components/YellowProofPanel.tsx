'use client';

import { useState, useEffect } from 'react';
import { Activity, Zap, Link as LinkIcon, Clock } from 'lucide-react';

interface YellowMetrics {
  sessionActive: boolean;
  channelId: string | null;
  offchainActionsCount: number;
  lastActionLatency: number | null;
  settlementTxHash: string | null;
  wsConnected: boolean;
  totalActionsPerSettlement: number;
}

interface YellowProofPanelProps {
  metrics: YellowMetrics;
  channelBalance?: { user: string; opponent: string };
}

export default function YellowProofPanel({ metrics, channelBalance }: YellowProofPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
          <h3 className="font-bold text-lg text-gray-800">Yellow Network Proof Panel</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-yellow-700 hover:text-yellow-900"
        >
          {expanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {expanded && (
        <>
          {/* Connection Status */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              icon={<Activity className="w-4 h-4" />}
              label="ClearNode"
              value={metrics.wsConnected ? '✅ Connected' : '❌ Disconnected'}
              color={metrics.wsConnected ? 'green' : 'red'}
            />
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Session"
              value={metrics.sessionActive ? '🟢 Active' : '⚪ Inactive'}
              color={metrics.sessionActive ? 'green' : 'gray'}
            />
          </div>

          {/* Channel Info */}
          {metrics.channelId && (
            <div className="bg-white rounded p-3 mb-3 border border-yellow-200">
              <div className="text-xs text-gray-500 mb-1">Channel ID</div>
              <div className="text-xs font-mono text-gray-700 break-all">
                {metrics.channelId.substring(0, 20)}...
              </div>
            </div>
          )}

          {/* Off-chain Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Off-chain Actions"
              value={metrics.offchainActionsCount.toString()}
              color="yellow"
              highlight={metrics.offchainActionsCount > 0}
            />
            <MetricCard
              icon={<Clock className="w-4 h-4" />}
              label="Last Action"
              value={metrics.lastActionLatency ? `${metrics.lastActionLatency}ms` : '-'}
              color="blue"
            />
            <MetricCard
              icon={<Activity className="w-4 h-4" />}
              label="Actions/Tx"
              value={metrics.totalActionsPerSettlement > 0 ? metrics.totalActionsPerSettlement.toString() : '-'}
              color="purple"
              highlight={metrics.totalActionsPerSettlement > 10}
            />
          </div>

          {/* Channel Balances */}
          {channelBalance && metrics.sessionActive && (
            <div className="bg-white rounded p-3 mb-3 border border-yellow-200">
              <div className="text-xs font-semibold text-gray-700 mb-2">Off-Chain Balances (Instant Updates)</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">You:</span> <span className="font-bold">{channelBalance.user} ETH</span>
                </div>
                <div>
                  <span className="text-gray-500">Opponent:</span> <span className="font-bold">{channelBalance.opponent} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Settlement Info */}
          {metrics.settlementTxHash && (
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-green-600" />
                <div className="text-xs font-semibold text-green-800">Settlement Transaction</div>
              </div>
              <a
                href={`https://testnet.snowtrace.io/tx/${metrics.settlementTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline break-all"
              >
                {metrics.settlementTxHash.substring(0, 30)}...
              </a>
            </div>
          )}

          {/* The Golden Proof */}
          {metrics.offchainActionsCount > 0 && (
            <div className="mt-4 bg-yellow-100 border-2 border-yellow-500 rounded p-3">
              <div className="text-sm font-bold text-yellow-900 mb-1">
                🏆 Yellow Network Proof
              </div>
              <div className="text-xs text-yellow-800">
                {metrics.offchainActionsCount} instant actions with <strong>ZERO wallet popups</strong>
                {metrics.settlementTxHash && ` → 1 settlement tx`}
              </div>
              {metrics.totalActionsPerSettlement > 0 && (
                <div className="text-xs text-yellow-700 mt-2">
                  Efficiency: <strong>{metrics.totalActionsPerSettlement}x</strong> gas savings
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'green' | 'red' | 'gray' | 'yellow' | 'blue' | 'purple';
  highlight?: boolean;
}

function MetricCard({ icon, label, value, color, highlight }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`${colorClasses[color]} border rounded p-2 ${highlight ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <div className="text-xs font-medium">{label}</div>
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
