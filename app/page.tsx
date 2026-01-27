'use client';

import { useState, useEffect } from 'react';
import { ClearNodeClient } from '@/lib/clearnode';
import { connectWallet } from '@/lib/wallet';
import { LogEntry, UnifiedBalance, ChainConfig } from '@/lib/types';
import WalletConnect from '@/components/WalletConnect';
import EventLog from '@/components/EventLog';
import Lobby from '@/components/Lobby';
import Match from '@/components/Match';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

type Screen = 'lobby' | 'match' | 'closed';

export default function Home() {
  const [client] = useState(() => new ClearNodeClient('wss://sandbox.clearnode.yellow.com'));
  const [screen, setScreen] = useState<Screen>('lobby');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [balance, setBalance] = useState<UnifiedBalance | null>(null);
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
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
    client.onLog = (type, message, data) => {
      addLog(type as LogEntry['type'], message, data);
    };

    client.onConnect = () => {
      setIsConnected(true);
      initializeConfig();
    };

    client.onDisconnect = () => {
      setIsConnected(false);
    };

    client.onError = (error) => {
      addLog('error', 'Connection error', error);
    };

    connectToClearNode();

    return () => {
      client.disconnect();
    };
  }, []);

  const connectToClearNode = async () => {
    try {
      await client.connect();
      addLog('info', 'Connected to ClearNode successfully');
    } catch (err) {
      addLog('error', 'Failed to connect to ClearNode', err);
    }
  };

  const initializeConfig = async () => {
    try {
      const config = await client.getConfig();
      addLog('info', 'Fetched configuration', config);
      
      if (config.chains && config.chains.length > 0) {
        const chains = config.chains.map((c: ChainConfig) => c.name);
        setAvailableChains(chains);
        
        const avalanche = chains.find((c: string) => c.toLowerCase().includes('avalanche'));
        setSelectedChain(avalanche || chains[0]);
        addLog('info', `Detected chains: ${chains.join(', ')}. Selected: ${avalanche || chains[0]}`);
      }
    } catch (err) {
      addLog('error', 'Failed to fetch config', err);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
      addLog('info', `Wallet connected: ${address}`);
      
      await fetchBalance(address);
    } catch (err: any) {
      addLog('error', 'Failed to connect wallet', err?.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Protocol: Fetch REAL balance from server, never fake it client-side
  const fetchBalance = async (address: string) => {
    try {
      const balances = await client.getBalance(address);
      if (balances && balances.length > 0) {
        setBalance(balances[0]);
        addLog('info', '✅ Balance fetched from server', balances[0]);
      } else {
        // Protocol: Server returned empty array = no balance exists yet
        setBalance(null);
        addLog('info', 'ℹ️ No balance found (server returned empty array)');
      }
    } catch (err) {
      addLog('error', '❌ Failed to fetch balance', err);
      // Protocol: On error, clear balance - DO NOT show fake zero balance
      setBalance(null);
    }
  };

  // Protocol: Request faucet, wait for ACK, then refresh balance
  const handleRequestFaucet = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const result = await client.requestFaucet(walletAddress);
      addLog('info', '✅ Faucet credited successfully', result);
      
      // Protocol: Wait for server to process before fetching balance
      // Server should have updated Unified Balance immediately
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchBalance(walletAddress);
    } catch (err) {
      addLog('error', '❌ Faucet request failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Protocol: Create session, wait for sessionId ACK, initialize state
  const handleCreateMatch = async (opponent: string, wager: string) => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const result = await client.createAppSession(
        [walletAddress, opponent],
        'ytest.usd',
        wager
      );
      
      addLog('info', '✅ Session created. SessionId: ' + result.sessionId, result);
      
      // Protocol: Initialize with equal allocations (wager per player)
      setCurrentSession({
        sessionId: result.sessionId,
        playerA: walletAddress,
        playerB: opponent,
        allocations: {
          [walletAddress]: wager,
          [opponent]: wager
        },
        round: 0
      });
      
      setScreen('match');
      
      // Protocol: Balance should now be locked in session
      await fetchBalance(walletAddress);
    } catch (err) {
      addLog('error', '❌ Failed to create match', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Protocol: Join session, wait for ACK, THEN fetch real session state
  // CRITICAL: Must get actual participants and allocations from server
  const handleJoinMatch = async (sessionId: string) => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      // Step 1: Join the session
      const joinResult = await client.joinAppSession(sessionId, walletAddress);
      addLog('info', '✅ Joined session successfully', joinResult);
      
      // Step 2: Fetch REAL session state from server
      const sessionState = await client.getAppSession(sessionId);
      addLog('info', '📥 Fetched session state', sessionState);
      
      // Protocol: Use server's data, not client assumptions
      const participants = sessionState.participants || [];
      const allocations = sessionState.allocations || {};
      const round = sessionState.round || 0;
      
      setCurrentSession({
        sessionId,
        playerA: participants[0] || '',
        playerB: participants[1] || '',
        allocations,
        round
      });
      
      setScreen('match');
      
      // Protocol: Balance should now be locked in session
      await fetchBalance(walletAddress);
    } catch (err) {
      addLog('error', '❌ Failed to join match', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Protocol: Calculate allocations, submit to server, WAIT for ACK, THEN update UI
  // CRITICAL: Only update UI after server confirms state update
  const handleSubmitRound = async (winner: string) => {
    if (!currentSession || !walletAddress) return;
    
    setIsLoading(true);
    try {
      const { playerA, playerB, allocations } = currentSession;
      const loser = winner === playerA ? playerB : playerA;
      const roundAmount = '5';
      
      // Protocol: Calculate new allocations (must sum to same total)
      const newAllocations = {
        [winner]: (parseFloat(allocations[winner] || '0') + parseFloat(roundAmount)).toString(),
        [loser]: Math.max(0, parseFloat(allocations[loser] || '0') - parseFloat(roundAmount)).toString()
      };
      
      // Validation: Ensure total unchanged
      const oldTotal = Object.values(allocations).reduce((sum, v) => sum + parseFloat(v), 0);
      const newTotal = Object.values(newAllocations).reduce((sum, v) => sum + parseFloat(v), 0);
      if (Math.abs(oldTotal - newTotal) > 0.01) {
        throw new Error(`Allocation mismatch: ${oldTotal} -> ${newTotal}`);
      }
      
      addLog('info', `📤 Submitting round ${currentSession.round + 1}`, newAllocations);
      
      // Protocol: Submit to server and WAIT for confirmation
      const result = await client.submitAppState(
        currentSession.sessionId,
        newAllocations,
        currentSession.round + 1
      );
      
      addLog('info', `✅ Round ${currentSession.round + 1} confirmed by server. Winner: ${winner}`, result);
      
      // Protocol: ONLY NOW update UI with server-confirmed state
      setCurrentSession({
        ...currentSession,
        allocations: newAllocations,
        round: currentSession.round + 1
      });
    } catch (err) {
      addLog('error', '❌ Failed to submit round', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Protocol: Close session, wait for ACK, balances return to Unified Balance
  const handleCloseSession = async () => {
    if (!currentSession) return;
    
    setIsLoading(true);
    try {
      const result = await client.closeAppSession(currentSession.sessionId);
      addLog('info', '✅ Session closed successfully', result);
      
      // Protocol: Use server's final allocations if available
      const finalAllocations = result.final_allocations || currentSession.allocations;
      
      setFinalPayout({
        playerA: currentSession.playerA,
        playerB: currentSession.playerB,
        amountA: finalAllocations[currentSession.playerA] || '0',
        amountB: finalAllocations[currentSession.playerB] || '0'
      });
      
      setScreen('closed');
      
      // Protocol: Balances should now be unlocked in Unified Balance
      if (walletAddress) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchBalance(walletAddress);
      }
    } catch (err) {
      addLog('error', '❌ Failed to close session', err);
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
              <p className="text-gray-600 mt-1">Phase 1 - ClearNode WebSocket + Unified Balance</p>
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
            <p className="text-gray-600">Please connect your MetaMask wallet to start using the demo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {screen === 'lobby' && (
                <Lobby
                  address={walletAddress}
                  balance={balance}
                  availableChains={availableChains}
                  selectedChain={selectedChain}
                  onChainSelect={setSelectedChain}
                  onRequestFaucet={handleRequestFaucet}
                  onCreateMatch={handleCreateMatch}
                  onJoinMatch={handleJoinMatch}
                  isLoading={isLoading}
                />
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
                          {finalPayout.amountA} ytest.usd
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">Player B</div>
                        <div className="text-xs text-gray-500 font-mono mb-2">
                          {finalPayout.playerB.slice(0, 10)}...{finalPayout.playerB.slice(-8)}
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {finalPayout.amountB} ytest.usd
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
