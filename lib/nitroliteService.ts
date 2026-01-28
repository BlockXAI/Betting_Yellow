/**
 * Nitrolite Service - Yellow SDK Integration
 * Replaces clearnode.ts with proper state channel management
 */

import { ethers } from 'ethers';

// Types for state channel management
export interface ChannelState {
  channelId: string;
  participants: string[];
  allocations: Record<string, string>;
  nonce: number;
  status: 'opening' | 'active' | 'closing' | 'closed';
}

export interface StateUpdate {
  allocations: Record<string, string>;
  nonce: number;
  signatures?: string[];
}

export interface ChannelConfig {
  custodyAddress: string;
  adjudicatorAddress: string;
  clearnodeUrl: string;
  provider: ethers.BrowserProvider;
}

/**
 * Nitrolite State Channel Client
 * Manages off-chain state updates and on-chain settlement
 */
export class NitroliteService {
  private ws: WebSocket | null = null;
  private config: ChannelConfig | null = null;
  private currentChannel: ChannelState | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();
  private messageId = 0;

  // Event callbacks
  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onChannelUpdate?: (state: ChannelState) => void;
  public onError?: (error: Error) => void;
  public onLog?: (type: string, message: string, data?: any) => void;

  constructor() {
    this.log('info', 'Nitrolite service initialized');
  }

  /**
   * Initialize the service with configuration
   */
  async initialize(config: ChannelConfig): Promise<void> {
    this.config = config;
    this.log('info', 'Service configured', {
      custody: config.custodyAddress,
      clearnode: config.clearnodeUrl,
    });
  }

  /**
   * Connect to ClearNode coordinator
   */
  async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      try {
        this.log('info', `Connecting to ClearNode: ${this.config!.clearnodeUrl}`);
        this.ws = new WebSocket(this.config!.clearnodeUrl);

        this.ws.onopen = () => {
          this.log('info', '✅ Connected to ClearNode');
          this.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.log('error', '❌ WebSocket error', error);
          reject(new Error('Failed to connect to ClearNode'));
        };

        this.ws.onclose = () => {
          this.log('info', 'Disconnected from ClearNode');
          this.onDisconnected?.();
          this.ws = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Open a new state channel
   */
  async openChannel(participants: string[], initialDeposits: Record<string, string>): Promise<ChannelState> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to ClearNode');
    }

    const channelId = this.generateChannelId(participants);
    
    this.currentChannel = {
      channelId,
      participants,
      allocations: initialDeposits,
      nonce: 0,
      status: 'opening',
    };

    this.log('info', '🔓 Opening channel', {
      channelId,
      participants,
      deposits: initialDeposits,
    });

    // Register channel with ClearNode
    const response = await this.sendRequest('open_channel', {
      channel_id: channelId,
      participants,
      initial_state: {
        allocations: initialDeposits,
        nonce: 0,
      },
    });

    this.currentChannel.status = 'active';
    this.onChannelUpdate?.(this.currentChannel);

    return this.currentChannel;
  }

  /**
   * Submit a state update (off-chain)
   */
  async updateState(newAllocations: Record<string, string>): Promise<void> {
    if (!this.currentChannel || this.currentChannel.status !== 'active') {
      throw new Error('No active channel');
    }

    // Validate allocation sum matches
    const currentTotal = this.sumAllocations(this.currentChannel.allocations);
    const newTotal = this.sumAllocations(newAllocations);
    
    if (Math.abs(parseFloat(currentTotal) - parseFloat(newTotal)) > 0.0001) {
      throw new Error('Allocation sum mismatch. Funds cannot be created or destroyed.');
    }

    const newNonce = this.currentChannel.nonce + 1;
    
    this.log('info', '📝 Updating state (off-chain)', {
      nonce: newNonce,
      allocations: newAllocations,
    });

    // Create state update
    const stateUpdate: StateUpdate = {
      allocations: newAllocations,
      nonce: newNonce,
    };

    // Sign the state update
    const signature = await this.signStateUpdate(stateUpdate);
    stateUpdate.signatures = [signature];

    // Send to ClearNode for coordination
    await this.sendRequest('update_state', {
      channel_id: this.currentChannel.channelId,
      state: stateUpdate,
    });

    // Update local state
    this.currentChannel.allocations = newAllocations;
    this.currentChannel.nonce = newNonce;
    this.onChannelUpdate?.(this.currentChannel);
  }

  /**
   * Close the channel (off-chain finalization)
   */
  async closeChannel(): Promise<void> {
    if (!this.currentChannel) {
      throw new Error('No active channel');
    }

    this.log('info', '🔒 Closing channel', {
      channelId: this.currentChannel.channelId,
      finalState: this.currentChannel.allocations,
    });

    this.currentChannel.status = 'closing';

    await this.sendRequest('close_channel', {
      channel_id: this.currentChannel.channelId,
      final_state: {
        allocations: this.currentChannel.allocations,
        nonce: this.currentChannel.nonce,
      },
    });

    this.currentChannel.status = 'closed';
    this.onChannelUpdate?.(this.currentChannel);
  }

  /**
   * Get current channel state
   */
  getChannelState(): ChannelState | null {
    return this.currentChannel;
  }

  /**
   * Disconnect from ClearNode
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Private helper methods

  private generateChannelId(participants: string[]): string {
    const sorted = [...participants].sort();
    const combined = sorted.join('') + Date.now();
    return ethers.keccak256(ethers.toUtf8Bytes(combined));
  }

  private sumAllocations(allocations: Record<string, string>): string {
    const total = Object.values(allocations).reduce(
      (sum, val) => sum + parseFloat(val),
      0
    );
    return total.toFixed(4);
  }

  private async signStateUpdate(update: StateUpdate): Promise<string> {
    if (!this.config) {
      throw new Error('Service not configured');
    }

    const signer = await this.config.provider.getSigner();
    
    // EIP-712 domain
    const domain = {
      name: 'StateChannel',
      version: '1',
      chainId: (await this.config.provider.getNetwork()).chainId,
      verifyingContract: this.config.adjudicatorAddress,
    };

    // Message types
    const types = {
      StateUpdate: [
        { name: 'allocations', type: 'string' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    // Message value
    const value = {
      allocations: JSON.stringify(update.allocations),
      nonce: update.nonce,
    };

    const signature = await signer.signTypedData(domain, types, value);
    this.log('info', '✍️ State signed with EIP-712', { nonce: update.nonce });
    
    return signature;
  }

  private async sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = (++this.messageId).toString();
      const message = {
        id,
        method,
        params,
      };

      this.log('info', `📤 OUTBOUND [${method}]`, message);

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  private handleMessage(data: string): void {
    try {
      this.log('info', '📥 INBOUND RAW', { raw: data });
      const message = JSON.parse(data);
      this.log('info', '📥 INBOUND PARSED', { parsed: message });

      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!;
        this.pendingRequests.delete(message.id);

        if (message.error) {
          this.log('error', `❌ ERROR RESPONSE [id=${message.id}]`, message.error);
          reject(new Error(message.error.message || 'Unknown error'));
        } else {
          this.log('info', `✅ SUCCESS RESPONSE [id=${message.id}]`, message.result);
          resolve(message.result);
        }
      } else {
        // Unsolicited message (push notification)
        this.handlePushNotification(message);
      }
    } catch (error) {
      this.log('error', '❌ Failed to parse message', { error, data });
    }
  }

  private handlePushNotification(message: any): void {
    // Handle push notifications from ClearNode
    if (message.method === 'state_updated' && this.currentChannel) {
      this.log('info', '🔔 State update notification', message.params);
      // Update local state if another participant made a change
      this.currentChannel.allocations = message.params.state.allocations;
      this.currentChannel.nonce = message.params.state.nonce;
      this.onChannelUpdate?.(this.currentChannel);
    }
  }

  private log(type: string, message: string, data?: any): void {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${type.toUpperCase()} | ${message}`, data || '');
    this.onLog?.(type, message, data);
  }
}

// Singleton instance
let nitroliteInstance: NitroliteService | null = null;

export function getNitroliteService(): NitroliteService {
  if (!nitroliteInstance) {
    nitroliteInstance = new NitroliteService();
  }
  return nitroliteInstance;
}
