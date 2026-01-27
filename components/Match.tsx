'use client';

import { useState } from 'react';
import { Trophy, XCircle, Play } from 'lucide-react';
import { formatBalance } from '@/lib/wallet';

interface MatchProps {
  sessionId: string;
  playerA: string;
  playerB: string;
  allocations: { [address: string]: string };
  round: number;
  currentAddress: string;
  onSubmitRound: (winner: string) => void;
  onCloseSession: () => void;
  isLoading: boolean;
}

export default function Match({
  sessionId,
  playerA,
  playerB,
  allocations,
  round,
  currentAddress,
  onSubmitRound,
  onCloseSession,
  isLoading
}: MatchProps) {
  const [selectedWinner, setSelectedWinner] = useState<string>('');

  const handleSubmitRound = () => {
    if (selectedWinner) {
      onSubmitRound(selectedWinner);
      setSelectedWinner('');
    }
  };

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const playerABalance = allocations[playerA] || '0';
  const playerBBalance = allocations[playerB] || '0';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Match In Progress</h2>
        <p className="text-purple-100">Session: {sessionId}</p>
        <p className="text-purple-100">Round: {round}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={24} className="text-yellow-600" />
          <h3 className="text-lg font-semibold">Live Allocations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`rounded-lg p-6 border-2 ${
            currentAddress.toLowerCase() === playerA.toLowerCase()
              ? 'bg-blue-50 border-blue-500'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="text-sm font-medium text-gray-600 mb-2">Player A</div>
            <div className="text-xs text-gray-500 mb-3 font-mono">{formatAddr(playerA)}</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatBalance(playerABalance)} ytest.usd
            </div>
            {currentAddress.toLowerCase() === playerA.toLowerCase() && (
              <div className="mt-2 text-xs font-medium text-blue-600">YOU</div>
            )}
          </div>

          <div className={`rounded-lg p-6 border-2 ${
            currentAddress.toLowerCase() === playerB.toLowerCase()
              ? 'bg-purple-50 border-purple-500'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="text-sm font-medium text-gray-600 mb-2">Player B</div>
            <div className="text-xs text-gray-500 mb-3 font-mono">{formatAddr(playerB)}</div>
            <div className="text-3xl font-bold text-purple-600">
              {formatBalance(playerBBalance)} ytest.usd
            </div>
            {currentAddress.toLowerCase() === playerB.toLowerCase() && (
              <div className="mt-2 text-xs font-medium text-purple-600">YOU</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Play size={24} className="text-green-600" />
          <h3 className="text-lg font-semibold">Round Controls</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Round Winner (Demo Simulation)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedWinner(playerA)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  selectedWinner === playerA
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 hover:border-blue-300'
                }`}
              >
                Player A Wins
              </button>
              <button
                onClick={() => setSelectedWinner(playerB)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  selectedWinner === playerB
                    ? 'bg-purple-100 border-purple-500 text-purple-700'
                    : 'bg-white border-gray-300 hover:border-purple-300'
                }`}
              >
                Player B Wins
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmitRound}
            disabled={!selectedWinner || isLoading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit Round Result'}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onCloseSession}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={20} />
              <span>{isLoading ? 'Closing...' : 'Close Session & Finalize'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>How it works:</strong> Select a winner, submit the round result. Balances update instantly off-chain via ClearNode. When done, close the session to finalize.
        </p>
      </div>
    </div>
  );
}
