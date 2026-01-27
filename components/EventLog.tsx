'use client';

import { LogEntry } from '@/lib/types';
import { Terminal, ArrowUp, ArrowDown, AlertCircle, Info } from 'lucide-react';

interface EventLogProps {
  logs: LogEntry[];
}

export default function EventLog({ logs }: EventLogProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'sent': return <ArrowUp size={14} className="text-blue-500" />;
      case 'received': return <ArrowDown size={14} className="text-green-500" />;
      case 'error': return <AlertCircle size={14} className="text-red-500" />;
      default: return <Info size={14} className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sent': return 'bg-blue-50 border-blue-200';
      case 'received': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={20} />
        <h3 className="font-semibold text-lg">Event Log</h3>
        <span className="text-sm text-gray-500">({logs.length} events)</span>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No events yet</div>
        ) : (
          logs.slice().reverse().map((log, idx) => (
            <div
              key={idx}
              className={`border rounded p-3 text-sm ${getTypeColor(log.type)}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{getIcon(log.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-gray-900">{log.message}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.data && (
                    <pre className="text-xs text-gray-700 overflow-x-auto mt-2 p-2 bg-white rounded border">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
