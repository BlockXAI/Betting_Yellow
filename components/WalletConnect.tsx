'use client';

import { Wallet } from 'lucide-react';
import { formatAddress } from '@/lib/wallet';

interface WalletConnectProps {
  address: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function WalletConnect({ address, onConnect, isConnecting }: WalletConnectProps) {
  return (
    <div className="flex items-center gap-4">
      {address ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
          <Wallet size={18} />
          <span>{formatAddress(address)}</span>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Wallet size={18} />
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      )}
    </div>
  );
}
