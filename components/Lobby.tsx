'use client';

import { useState } from 'react';
import { Coins, DollarSign, Users } from 'lucide-react';
import { UnifiedBalance } from '@/lib/types';
import { formatBalance } from '@/lib/wallet';

interface LobbyProps {
  address: string;
  balance: UnifiedBalance | null;
  availableChains: string[];
  selectedChain: string;
  onChainSelect: (chain: string) => void;
  onRequestFaucet: () => void;
  onCreateMatch: (opponent: string, wager: string) => void;
  onJoinMatch: (sessionId: string) => void;
  isLoading: boolean;
}

export default function Lobby({
  address,
  balance,
  availableChains,
  selectedChain,
  onChainSelect,
  onRequestFaucet,
  onCreateMatch,
  onJoinMatch,
  isLoading
}: LobbyProps) {
  const [opponent, setOpponent] = useState('');
  const [wager, setWager] = useState('10');
  const [sessionId, setSessionId] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleCreateMatch = () => {
    if (opponent && wager) {
      onCreateMatch(opponent, wager);
    }
  };

  const handleJoinMatch = () => {
    if (sessionId) {
      onJoinMatch(sessionId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Yellow PvP Wager</h2>
        <p className="text-yellow-100">Phase 1 Demo - Real-time Off-chain Betting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins size={24} className="text-blue-600" />
            <h3 className="text-lg font-semibold">Unified Balance</h3>
          </div>
          
          {balance ? (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Available Balance</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatBalance(balance.available)} {balance.token}
                </div>
              </div>
              
              <button
                onClick={onRequestFaucet}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Requesting...' : 'Request Test Funds'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Loading balance...
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={24} className="text-purple-600" />
            <h3 className="text-lg font-semibold">Chain Selection</h3>
          </div>
          
          {availableChains.length > 0 ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Chain
              </label>
              <select
                value={selectedChain}
                onChange={(e) => onChainSelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {availableChains.map(chain => (
                  <option key={chain} value={chain}>{chain}</option>
                ))}
              </select>
              
              <div className="text-sm text-gray-600 bg-purple-50 rounded p-3">
                <strong>Dynamic Discovery:</strong> Chains loaded from get_config (no hardcoding)
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Loading chains...
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={24} className="text-orange-600" />
          <h3 className="text-lg font-semibold">Create or Join Match</h3>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'create'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Create Match
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'join'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Join Match
          </button>
        </div>

        {mode === 'create' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opponent Address
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wager Amount
              </label>
              <input
                type="number"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                placeholder="10"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleCreateMatch}
              disabled={!opponent || !wager || isLoading}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleJoinMatch}
              disabled={!sessionId || isLoading}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Match'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
