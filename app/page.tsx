'use client';

import { useState, useEffect } from 'react';
import { NitroliteService, ChannelState } from '@/lib/nitroliteService';
import { connectWallet } from '@/lib/wallet';
import { LogEntry } from '@/lib/types';
import { getChannelBalance } from '@/lib/contracts';
import WalletConnect from '@/components/WalletConnect';
import EventLog from '@/components/EventLog';
import ChannelManager from '@/components/ChannelManager';
import Match from '@/components/Match';
import { AlertCircle, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { ethers } from 'ethers';

type Screen = 'lobby' | 'match' | 'closed';

export default function Home() {
  const [service] = useState(() => new NitroliteService());
  const [screen, setScreen] = useState<Screen>('lobby');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [channelBalance, setChannelBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [showChannelManager, setShowChannelManager] = useState(false);
  
  const [currentSession, setCurrentSession] = useState<{
    sessionId: string;
    playerA: string;
    playerB: string;
    allocations: { [address: string]: string };
    round: number;
  } | null>(null);

  const [finalPayout, setFinalPayout] = useState<{
    playerA: string;
    playerB: string;
    amountA: string;
    amountB: string;
  } | null>(null);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      type,
      message,
      data
    }]);
  };

  useEffect(() => {
    service.onLog = (type, message, data) => {
      addLog(type as LogEntry['type'], message, data);
    };

    service.onConnected = () => {
      setIsConnected(true);
      addLog('info', '✅ Connected to Yellow ClearNode (Local)');
    };

    service.onDisconnected = () => {
      setIsConnected(false);
      addLog('info', '❌ Disconnected from ClearNode');
    };

    service.onError = (error) => {
      addLog('error', 'Connection error', error.message);
    };

    service.onChannelUpdate = (state: ChannelState) => {
      addLog('info', '📊 Channel state updated', {
        status: state.status,
        allocations: state.allocations,
        nonce: state.nonce,
      });
    };

    return () => {
      service.disconnect();
    };
  }, []);

  const initializeService = async (provider: ethers.BrowserProvider) => {
    try {
      const custodyAddress = process.env.NEXT_PUBLIC_CUSTODY_CONTRACT || '';
      const adjudicatorAddress = process.env.NEXT_PUBLIC_ADJUDICATOR_CONTRACT || '';
      const clearnodeUrl = process.env.NEXT_PUBLIC_CLEARNODE_URL || 'ws://localhost:8001/ws';

      await service.initialize({
        custodyAddress,
        adjudicatorAddress,
        clearnodeUrl,
        provider,
      });

      addLog('info', '🔧 Yellow SDK initialized', {
        custody: custodyAddress,
        adjudicator: adjudicatorAddress,
        clearnode: clearnodeUrl,
      });

      await service.connect();
    } catch (err: any) {
      addLog('error', 'Failed to initialize Yellow SDK', err?.message || err);
      throw err;
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
      addLog('info', `✅ Wallet connected: ${address}`);
      addLog('info', '🔗 Network: Anvil Local (Chain ID: 31337)');
      
      // Initialize Yellow SDK with provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      await initializeService(provider);
      
      // Load channel balance
      await loadChannelBalance(address);
    } catch (err: any) {
      addLog('error', 'Failed to connect wallet', err?.message || err);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadChannelBalance = async (address: string) => {
    try {
      const balance = await getChannelBalance(address);
      setChannelBalance(balance);
      addLog('info', `💰 Channel balance: ${balance} ETH`);
    } catch (err: any) {
      addLog('error', 'Failed to load channel balance', err?.message || err);
      setChannelBalance('0');
    }
  };

  const handleDepositComplete = async (amount: string) => {
    addLog('info', `✅ Deposit successful: ${amount} ETH`);
    if (walletAddress) {
      await loadChannelBalance(walletAddress);
    }
  };

  const handleWithdrawComplete = async (amount: string) => {
    addLog('info', `✅ Withdrawal successful: ${amount} ETH`);
    if (walletAddress) {
      await loadChannelBalance(walletAddress);
    }
  };

  const handleCreateMatch = async (opponent: string, wager: string) => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      // Open Yellow state channel
      const participants = [walletAddress, opponent];
      const initialDeposits = {
        [walletAddress]: wager,
        [opponent]: wager,
      };
      
      addLog('info', '🔓 Opening Yellow state channel...', { participants, deposits: initialDeposits });
      
      const channelState = await service.openChannel(participants, initialDeposits);
      
      addLog('info', '✅ Channel opened successfully', {
        channelId: channelState.channelId,
        participants: channelState.participants,
      });
      
      setCurrentSession({
        sessionId: channelState.channelId,
        playerA: walletAddress,
        playerB: opponent,
        allocations: initialDeposits,
        round: 0,
      });
      
      setScreen('match');
    } catch (err: any) {
      addLog('error', '❌ Failed to create match', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMatch = async (channelId: string) => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      addLog('info', '🔗 Joining existing channel...', { channelId });
      
      // In a real implementation, ClearNode would manage channel discovery
      // For now, show a message that joining requires both players to coordinate
      addLog('info', 'ℹ️ Channel joining requires coordination with the creator');
      addLog('info', 'ℹ️ For this demo, use "Create Match" to start a new channel');
      
      throw new Error('Channel joining not yet implemented in Yellow SDK demo');
    } catch (err: any) {
      addLog('error', '❌ Failed to join match', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRound = async (winner: string) => {
    if (!currentSession || !walletAddress) return;
    
    setIsLoading(true);
    try {
      const { playerA, playerB, allocations } = currentSession;
      const loser = winner === playerA ? playerB : playerA;
      const roundAmount = '0.01'; // 0.01 ETH per round
      
      // Calculate new allocations
      const newAllocations = {
        [winner]: (parseFloat(allocations[winner] || '0') + parseFloat(roundAmount)).toFixed(4),
        [loser]: Math.max(0, parseFloat(allocations[loser] || '0') - parseFloat(roundAmount)).toFixed(4),
      };
      
      addLog('info', `📤 Submitting round ${currentSession.round + 1} (off-chain)`, {
        winner,
        newAllocations,
      });
      
      // Submit state update via Yellow SDK (off-chain)
      await service.updateState(newAllocations);
      
      addLog('info', `✅ Round ${currentSession.round + 1} confirmed. Winner: ${winner}`);
      
      // Update UI with new state
      setCurrentSession({
        ...currentSession,
        allocations: newAllocations,
        round: currentSession.round + 1,
      });
    } catch (err: any) {
      addLog('error', '❌ Failed to submit round', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!currentSession) return;
    
    setIsLoading(true);
    try {
      addLog('info', '🔒 Closing Yellow state channel...', {
        channelId: currentSession.sessionId,
        finalAllocations: currentSession.allocations,
      });
      
      // Close channel (triggers on-chain settlement)
      await service.closeChannel();
      
      addLog('info', '✅ Channel closed successfully');
      addLog('info', '⛓️ Settlement transaction recorded on Anvil');
      
      setFinalPayout({
        playerA: currentSession.playerA,
        playerB: currentSession.playerB,
        amountA: currentSession.allocations[currentSession.playerA] || '0',
        amountB: currentSession.allocations[currentSession.playerB] || '0',
      });
      
      setScreen('closed');
      
      // Refresh balance after settlement
      if (walletAddress) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadChannelBalance(walletAddress);
      }
    } catch (err: any) {
      addLog('error', '❌ Failed to close session', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLobby = () => {
    setScreen('lobby');
    setCurrentSession(null);
    setFinalPayout(null);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Yellow PvP Wager Demo</h1>
              <p className="text-gray-600 mt-1">Yellow SDK + State Channels (ERC-7824)</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={20} />
                    <span className="font-medium">ClearNode Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle size={20} />
                    <span className="font-medium">Disconnected</span>
                  </div>
                )}
              </div>
              
              <WalletConnect
                address={walletAddress}
                onConnect={handleConnectWallet}
                isConnecting={isConnecting}
              />
            </div>
          </div>
        </div>

        {!walletAddress ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-yellow-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Connect MetaMask to Anvil (localhost) to start</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {screen === 'lobby' && (
                <div className="space-y-6">
                  {/* Channel Balance Card */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-100 mb-1">Channel Balance</div>
                        <div className="text-3xl font-bold">{channelBalance} ETH</div>
                        <div className="text-xs text-blue-200 mt-1">Available for wagering</div>
                      </div>
                      <button
                        onClick={() => setShowChannelManager(!showChannelManager)}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                      >
                        <Wallet size={18} />
                        {showChannelManager ? 'Hide' : 'Manage'}
                      </button>
                    </div>
                  </div>

                  {/* Channel Manager */}
                  {showChannelManager && (
                    <ChannelManager
                      address={walletAddress}
                      onDeposit={handleDepositComplete}
                      onWithdraw={handleWithdrawComplete}
                    />
                  )}

                  {/* Create Match Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Create PvP Match</h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const opponent = formData.get('opponent') as string;
                        const wager = formData.get('wager') as string;
                        if (opponent && wager) {
                          handleCreateMatch(opponent, wager);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opponent Address
                        </label>
                        <input
                          type="text"
                          name="opponent"
                          placeholder="0x..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wager Amount (ETH per player)
                        </label>
                        <input
                          type="number"
                          name="wager"
                          step="0.01"
                          min="0.01"
                          defaultValue="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || parseFloat(channelBalance) < 0.01}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Creating...' : 'Create Match'}
                      </button>
                      {parseFloat(channelBalance) < 0.01 && (
                        <p className="text-sm text-red-600">⚠️ Deposit ETH to your channel first</p>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {screen === 'match' && currentSession && (
                <Match
                  sessionId={currentSession.sessionId}
                  playerA={currentSession.playerA}
                  playerB={currentSession.playerB}
                  allocations={currentSession.allocations}
                  round={currentSession.round}
                  currentAddress={walletAddress}
                  onSubmitRound={handleSubmitRound}
                  onCloseSession={handleCloseSession}
                  isLoading={isLoading}
                />
              )}

              {screen === 'closed' && finalPayout && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">Session Closed</h2>
                    <p className="text-green-100">Final payouts have been processed</p>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Final Payout Summary</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-gray-600 mb-1">Player A</div>
                        <div className="text-xs text-gray-500 font-mono mb-2">
                          {finalPayout.playerA.slice(0, 10)}...{finalPayout.playerA.slice(-8)}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {finalPayout.amountA} ETH
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">Player B</div>
                        <div className="text-xs text-gray-500 font-mono mb-2">
                          {finalPayout.playerB.slice(0, 10)}...{finalPayout.playerB.slice(-8)}
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {finalPayout.amountB} ETH
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleBackToLobby}
                      className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Back to Lobby
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <EventLog logs={logs} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
