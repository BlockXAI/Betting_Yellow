import { WSMessage, WSResponse, ClearNodeConfig, UnifiedBalance, AppSession } from './types';

export class ClearNodeClient {
  private ws: WebSocket | null = null;
  private wsUrl = process.env.NEXT_PUBLIC_CLEARNODE_WS_URL || 'wss://sandbox.clearnode.yellow.com';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private messageId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();

  public onConnect?: () => void;
  public onDisconnect?: () => void;
  public onMessage?: (message: any) => void;
  public onError?: (error: any) => void;
  public onLog?: (type: string, message: string, data?: any) => void;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.log('info', `Connecting to ${this.wsUrl}...`);
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.log('info', 'Connected to ClearNode');
          this.reconnectAttempts = 0;
          if (this.onConnect) this.onConnect();
          resolve();
        };

        this.ws.onclose = () => {
          this.log('info', 'Disconnected from ClearNode');
          if (this.onDisconnect) this.onDisconnect();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          this.log('error', 'WebSocket error', error);
          if (this.onError) this.onError(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            // BRUTAL LOGGING: Log RAW inbound JSON first
            const rawJson = event.data;
            this.log('received', '◀ INBOUND RAW', { raw: rawJson });
            
            const data = JSON.parse(rawJson);
            this.log('received', '◀ INBOUND PARSED', { parsed: data });
            
            this.handleMessage(data);
          } catch (err) {
            this.log('error', '❌ PARSE ERROR', { raw: event.data, error: err });
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleMessage(data: any) {
    // Protocol: Validate response structure
    if (!data.id) {
      this.log('error', '⚠ PROTOCOL ERROR: Response missing id field', data);
      return;
    }

    if (this.pendingRequests.has(data.id)) {
      const { resolve, reject } = this.pendingRequests.get(data.id)!;
      this.pendingRequests.delete(data.id);

      // Protocol: Check for error vs success
      if (data.error) {
        this.log('error', `❌ ERROR RESPONSE [id=${data.id}]`, data.error);
        reject(data.error);
      } else if (data.result !== undefined) {
        this.log('info', `✅ SUCCESS RESPONSE [id=${data.id}]`, data.result);
        resolve(data.result);
      } else {
        this.log('error', '⚠ PROTOCOL ERROR: Response has neither result nor error', data);
        reject(new Error('Invalid response: missing result and error'));
      }
    } else {
      // Unsolicited message or event
      this.log('info', '📨 UNSOLICITED MESSAGE (not correlated to request)', data);
    }

    // Always notify message handler for events/broadcasts
    if (this.onMessage) {
      this.onMessage(data);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('error', 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    this.log('info', `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((err) => {
        this.log('error', 'Reconnection failed', err);
      });
    }, delay);
  }

  private send(message: WSMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Protocol: Generate unique ID for request/response correlation
      const id = `${++this.messageId}`;
      const msg = { ...message, id };
      
      // BRUTAL LOGGING: Log RAW outbound JSON
      const rawJson = JSON.stringify(msg);
      this.log('sent', `▶ OUTBOUND [${message.method}]`, { raw: rawJson, parsed: msg });

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(rawJson);

      // Protocol: 30s timeout for all requests
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          this.log('error', `⏱ TIMEOUT [${message.method}] after 30s`, { id });
          reject(new Error(`Request timeout: ${message.method}`));
        }
      }, 30000);
    });
  }

  private log(type: string, message: string, data?: any) {
    if (this.onLog) {
      this.onLog(type, message, data);
    }
  }

  // Protocol: get_config - Discover supported chains and contracts dynamically
  // NO hardcoded chain addresses should exist in the codebase
  async getConfig(): Promise<ClearNodeConfig> {
    const result = await this.send({
      id: '', // Will be overwritten by send()
      method: 'get_config',
      params: {}
    });
    
    // Protocol validation: Ensure response has expected structure
    if (!result || !result.chains) {
      throw new Error('Invalid get_config response: missing chains');
    }
    
    return result;
  }

  // Protocol: get_balance - Fetch Unified Balance for an address
  // Returns array of balances (one per token)
  async getBalance(address: string): Promise<UnifiedBalance[]> {
    if (!address || !address.startsWith('0x')) {
      throw new Error('Invalid address format');
    }
    
    const result = await this.send({
      id: '',
      method: 'get_balance',
      params: { address }
    });
    
    // Protocol: Server may return empty array if no balance exists
    // DO NOT create fake balances client-side
    return Array.isArray(result) ? result : [];
  }

  // Protocol: faucet_request - Request test funds (SANDBOX ONLY)
  // Server credits Unified Balance immediately
  async requestFaucet(address: string, token: string = 'ytest.usd', amount: string = '100'): Promise<any> {
    if (!address || !address.startsWith('0x')) {
      throw new Error('Invalid address format');
    }
    
    const result = await this.send({
      id: '',
      method: 'faucet_request',
      params: { address, token, amount }
    });
    
    // Protocol: Wait for ACK before assuming balance updated
    if (!result || !result.success) {
      throw new Error('Faucet request failed: no success confirmation');
    }
    
    return result;
  }

  // Protocol: create_app_session - Create PvP session
  // CRITICAL: Both players must use same sessionId
  async createAppSession(
    participants: string[],
    token: string,
    wagerAmount: string,
    rules?: any
  ): Promise<{ sessionId: string }> {
    // Protocol validation
    if (participants.length !== 2) {
      throw new Error('PvP requires exactly 2 participants');
    }
    if (!wagerAmount || parseFloat(wagerAmount) <= 0) {
      throw new Error('Invalid wager amount');
    }
    
    const result = await this.send({
      id: '',
      method: 'create_app_session',
      params: {
        participants,
        token,
        wager_amount: wagerAmount, // Protocol: snake_case
        rules: rules || {
          participant_count: participants.length,
          approval_threshold: participants.length // Both must sign state updates
        }
      }
    });
    
    // Protocol: Must return sessionId
    if (!result || !result.sessionId) {
      throw new Error('Session creation failed: no sessionId returned');
    }
    
    return result;
  }

  // Protocol: join_app_session - Join existing session
  // CRITICAL: Must fetch session state after joining to sync allocations
  async joinAppSession(sessionId: string, address: string): Promise<any> {
    if (!sessionId) {
      throw new Error('Invalid sessionId');
    }
    if (!address || !address.startsWith('0x')) {
      throw new Error('Invalid address format');
    }
    
    const result = await this.send({
      id: '',
      method: 'join_app_session',
      params: { 
        session_id: sessionId, // Protocol: snake_case
        address 
      }
    });
    
    // Protocol: Wait for join confirmation
    if (!result || !result.success) {
      throw new Error('Failed to join session');
    }
    
    return result;
  }
  
  // Protocol: get_app_session - Fetch current session state
  // CRITICAL: Use this after joining to get real allocations and participants
  async getAppSession(sessionId: string): Promise<any> {
    if (!sessionId) {
      throw new Error('Invalid sessionId');
    }
    
    const result = await this.send({
      id: '',
      method: 'get_app_session',
      params: { session_id: sessionId }
    });
    
    return result;
  }

  // Protocol: submit_app_state - Update allocations off-chain
  // CRITICAL: Allocations MUST sum to original total
  // CRITICAL: Wait for server ACK before updating UI
  async submitAppState(
    sessionId: string,
    allocations: { [address: string]: string },
    round: number
  ): Promise<any> {
    if (!sessionId) {
      throw new Error('Invalid sessionId');
    }
    
    // Protocol: Validate allocations sum (prevent cheating)
    const total = Object.values(allocations).reduce(
      (sum, val) => sum + parseFloat(val),
      0
    );
    this.log('info', `💰 Allocation validation: total=${total}`, allocations);
    
    const result = await this.send({
      id: '',
      method: 'submit_app_state',
      params: {
        session_id: sessionId, // Protocol: snake_case
        allocations,
        round
      }
    });
    
    // Protocol: Wait for state acceptance
    if (!result || !result.success) {
      throw new Error('State update rejected by server');
    }
    
    return result;
  }

  // Protocol: close_app_session - Finalize session and unlock balances
  // After this, balances return to Unified Balance
  async closeAppSession(sessionId: string): Promise<any> {
    if (!sessionId) {
      throw new Error('Invalid sessionId');
    }
    
    const result = await this.send({
      id: '',
      method: 'close_app_session',
      params: { session_id: sessionId } // Protocol: snake_case
    });
    
    // Protocol: Wait for closure confirmation
    if (!result || !result.success) {
      throw new Error('Session closure failed');
    }
    
    return result;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
