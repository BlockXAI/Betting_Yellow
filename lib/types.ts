export interface ChainConfig {
  chainId: string;
  name: string;
  contracts: {
    deposit?: string;
    withdrawal?: string;
    settlement?: string;
  };
}

export interface ClearNodeConfig {
  chains: ChainConfig[];
  capabilities: string[];
  version: string;
}

export interface UnifiedBalance {
  token: string;
  amount: string;
  available: string;
  locked: string;
}

export interface AppSession {
  sessionId: string;
  participants: string[];
  rules: SessionRules;
  state: SessionState;
  allocations: { [address: string]: string };
}

export interface SessionRules {
  participantCount: number;
  approvalThreshold: number;
  token: string;
  wagerAmount: string;
}

export interface SessionState {
  round: number;
  status: 'active' | 'closed' | 'disputed';
  lastUpdate: number;
}

export interface WSMessage {
  id: string;
  method: string;
  params?: any;
}

export interface WSResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface WSEvent {
  event: string;
  data: any;
  timestamp: number;
}

export interface LogEntry {
  timestamp: number;
  type: 'sent' | 'received' | 'event' | 'error' | 'info';
  message: string;
  data?: any;
}
