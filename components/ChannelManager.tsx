/**
 * Channel Manager Component
 * Handles deposit/withdraw flows for state channels
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, AlertCircle } from 'lucide-react';
import { depositToChannel, withdrawFromChannel, getChannelBalance, getWalletBalance, waitForTransaction } from '@/lib/contracts';

interface ChannelManagerProps {
  address: string;
  onDeposit?: (amount: string) => void;
  onWithdraw?: (amount: string) => void;
}

export default function ChannelManager({ address, onDeposit, onWithdraw }: ChannelManagerProps) {
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [channelBalance, setChannelBalance] = useState<string>('0');
  const [depositAmount, setDepositAmount] = useState<string>('0.1');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  useEffect(() => {
    loadBalances();
    const interval = setInterval(loadBalances, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [address]);

  const loadBalances = async () => {
    try {
      const [wallet, channel] = await Promise.all([
        getWalletBalance(address),
        getChannelBalance(address),
      ]);
      setWalletBalance(wallet);
      setChannelBalance(channel);
    } catch (err: any) {
      console.error('Failed to load balances:', err);
    }
  };

  const handleDeposit = async () => {
    setError('');
    setTxHash('');
    setIsDepositing(true);

    try {
      const amount = parseFloat(depositAmount);
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (parseFloat(walletBalance) === 0) {
        throw new Error('Get test AVAX from: https://faucets.chain.link/fuji');
      }
      if (amount > parseFloat(walletBalance)) {
        throw new Error('Insufficient wallet balance');
      }

      const tx = await depositToChannel(depositAmount);
      setTxHash(tx.hash);

      const receipt = await waitForTransaction(tx);
      if (receipt) {
        await loadBalances();
        onDeposit?.(depositAmount);
        setDepositAmount('0.1');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deposit');
      console.error('Deposit error:', err);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    setError('');
    setTxHash('');
    setIsWithdrawing(true);

    try {
      const amount = parseFloat(withdrawAmount);
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (amount > parseFloat(channelBalance)) {
        throw new Error('Insufficient channel balance');
      }

      const tx = await withdrawFromChannel(withdrawAmount);
      setTxHash(tx.hash);

      const receipt = await waitForTransaction(tx);
      if (receipt) {
        await loadBalances();
        onWithdraw?.(withdrawAmount);
        setWithdrawAmount('0');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw');
      console.error('Withdraw error:', err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMaxDeposit = () => {
    const max = Math.max(0, parseFloat(walletBalance) - 0.01); // Leave 0.01 for gas
    setDepositAmount(max.toFixed(4));
  };

  const handleMaxWithdraw = () => {
    setWithdrawAmount(channelBalance);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Channel Manager</h2>
        <Wallet className="w-6 h-6 text-blue-600" />
      </div>

      {/* Balances Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Wallet Balance</div>
          <div className="text-2xl font-bold text-gray-800">{parseFloat(walletBalance).toFixed(4)} ETH</div>
          <div className="text-xs text-gray-500 mt-1">On-chain (Anvil)</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Channel Balance</div>
          <div className="text-2xl font-bold text-blue-800">{parseFloat(channelBalance).toFixed(4)} ETH</div>
          <div className="text-xs text-blue-500 mt-1">State Channel</div>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownToLine className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Deposit to Channel</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={isDepositing}
              className="flex-1 px-3 py-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none disabled:bg-gray-100"
              placeholder="0.1"
            />
            <button
              onClick={handleMaxDeposit}
              disabled={isDepositing}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
            >
              MAX
            </button>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isDepositing || parseFloat(depositAmount) <= 0}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isDepositing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Depositing...
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4" />
                Deposit {depositAmount} ETH
              </>
            )}
          </button>
          
          <div className="text-xs text-green-700 bg-green-100 rounded p-2">
            💡 1 gas fee - Opens state channel for instant off-chain transactions
          </div>
        </div>
      </div>

      {/* Withdraw Section */}
      <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Withdraw from Channel</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={isWithdrawing}
              className="flex-1 px-3 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none disabled:bg-gray-100"
              placeholder="0.0"
            />
            <button
              onClick={handleMaxWithdraw}
              disabled={isWithdrawing}
              className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50"
            >
              MAX
            </button>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || parseFloat(withdrawAmount) <= 0 || parseFloat(channelBalance) === 0}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isWithdrawing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Withdrawing...
              </>
            ) : (
              <>
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw {withdrawAmount} ETH
              </>
            )}
          </button>
          
          <div className="text-xs text-orange-700 bg-orange-100 rounded p-2">
            💡 1 gas fee - Settles final balance on-chain
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium mb-1">Transaction Hash:</div>
          <div className="text-xs text-blue-800 font-mono break-all">{txHash}</div>
        </div>
      )}

      {/* Faucet Warning */}
      {parseFloat(walletBalance) === 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-900 mb-1">⛽ Need Test AVAX</div>
              <div className="text-sm text-yellow-800 mb-2">
                Your wallet has no AVAX for gas fees. Get free testnet funds:
              </div>
              <a
                href="https://faucets.chain.link/fuji"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm"
              >
                🚰 Get Free Test AVAX
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        <div className="font-semibold mb-2">💰 How it works:</div>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Deposit:</strong> Transfer ETH from wallet to state channel (1 gas fee)</li>
          <li>• <strong>Play:</strong> Unlimited off-chain matches with instant updates (0 gas)</li>
          <li>• <strong>Withdraw:</strong> Settle final balance back to wallet (1 gas fee)</li>
          <li>• <strong>Gas Savings:</strong> ~83% vs traditional on-chain betting!</li>
        </ul>
      </div>
    </div>
  );
}
