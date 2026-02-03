'use client';

import { useState } from 'react';
import { Zap, Play } from 'lucide-react';

interface QuickDemoProps {
  onStartDemo: () => void;
}

export default function QuickDemo({ onStartDemo }: QuickDemoProps) {
  return (
    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-6 text-white shadow-xl border-4 border-yellow-600">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-8 h-8" />
        <h2 className="text-2xl font-bold">⚡ Yellow Network Quick Demo</h2>
      </div>
      
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">🎯 What This Demo Shows:</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ <strong>Session Opening</strong> (1 on-chain tx)</li>
          <li>✅ <strong>10+ Instant Off-Chain Actions</strong> (no gas!)</li>
          <li>✅ <strong>Settlement</strong> (1 on-chain tx)</li>
          <li>✅ <strong>Proof Panel</strong> with metrics</li>
        </ul>
      </div>

      <div className="bg-yellow-900/30 rounded p-3 mb-4 text-sm">
        <p className="font-medium mb-1">💡 Demo Mode (No Wallet/Gas Needed)</p>
        <p className="text-yellow-100">
          This simulates the full Yellow Network flow without requiring testnet funds.
          Perfect for judges to see the instant off-chain execution!
        </p>
      </div>

      <button
        onClick={onStartDemo}
        className="w-full bg-white text-orange-600 font-bold py-4 px-6 rounded-lg hover:bg-yellow-50 transition-all flex items-center justify-center gap-2 text-lg shadow-lg"
      >
        <Play className="w-6 h-6" />
        Start Demo Session
      </button>
    </div>
  );
}
