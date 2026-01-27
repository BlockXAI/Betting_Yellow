/**
 * Mock Yellow ClearNode Server
 * For local protocol testing when sandbox is unavailable
 * 
 * Run: node mock-server.js
 * Connect: ws://localhost:8080
 */

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('🟢 Mock ClearNode server running on ws://localhost:8080');
console.log('📋 Simulating Yellow protocol responses\n');

// In-memory state
const balances = new Map();
const sessions = new Map();

wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log(`\n📥 RECEIVED [${msg.method}]`, JSON.stringify(msg, null, 2));

      const response = handleMessage(msg);
      
      console.log(`📤 SENDING [${msg.method}] response`, JSON.stringify(response, null, 2));
      ws.send(JSON.stringify(response));

    } catch (err) {
      console.error('❌ Error handling message:', err);
      ws.send(JSON.stringify({
        id: 'error',
        error: { code: 500, message: err.message }
      }));
    }
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});

function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'get_config':
      return {
        id,
        result: {
          version: '1.0.0',
          capabilities: ['app_sessions', 'unified_balance', 'faucet'],
          chains: [
            {
              chainId: '43113',
              name: 'Avalanche Fuji',
              contracts: {
                deposit: '0x1234567890abcdef1234567890abcdef12345678',
                withdrawal: '0xabcdef1234567890abcdef1234567890abcdef12',
                settlement: '0x567890abcdef1234567890abcdef1234567890ab'
              }
            }
          ]
        }
      };

    case 'get_balance':
      const balance = balances.get(params.address) || [];
      return { id, result: balance };

    case 'faucet_request':
      const newBalance = {
        token: params.token || 'ytest.usd',
        amount: params.amount || '100',
        available: params.amount || '100',
        locked: '0'
      };
      balances.set(params.address, [newBalance]);
      return {
        id,
        result: {
          success: true,
          amount: params.amount || '100',
          token: params.token || 'ytest.usd'
        }
      };

    case 'create_app_session':
      const sessionId = `session-mock-${Date.now()}`;
      const allocations = {};
      params.participants.forEach(addr => {
        allocations[addr] = params.wager_amount;
      });
      
      sessions.set(sessionId, {
        sessionId,
        participants: params.participants,
        allocations,
        round: 0,
        status: 'active',
        token: params.token
      });

      // Lock balances
      params.participants.forEach(addr => {
        const bal = balances.get(addr);
        if (bal && bal.length > 0) {
          const wager = parseFloat(params.wager_amount);
          bal[0].available = (parseFloat(bal[0].available) - wager).toString();
          bal[0].locked = (parseFloat(bal[0].locked) + wager).toString();
        }
      });

      return {
        id,
        result: {
          sessionId,
          status: 'created',
          participants: params.participants,
          allocations
        }
      };

    case 'join_app_session':
      return {
        id,
        result: {
          success: true,
          sessionId: params.session_id,
          status: 'active'
        }
      };

    case 'get_app_session':
      const session = sessions.get(params.session_id);
      if (!session) {
        return {
          id,
          error: { code: 404, message: 'Session not found' }
        };
      }
      return { id, result: session };

    case 'submit_app_state':
      const sess = sessions.get(params.session_id);
      if (!sess) {
        return {
          id,
          error: { code: 404, message: 'Session not found' }
        };
      }
      
      // Validate allocation sum
      const total = Object.values(params.allocations).reduce(
        (sum, v) => sum + parseFloat(v),
        0
      );
      const originalTotal = Object.values(sess.allocations).reduce(
        (sum, v) => sum + parseFloat(v),
        0
      );
      
      if (Math.abs(total - originalTotal) > 0.01) {
        return {
          id,
          error: { code: 400, message: 'Invalid allocation sum' }
        };
      }

      sess.allocations = params.allocations;
      sess.round = params.round;

      return {
        id,
        result: {
          success: true,
          round: params.round,
          state_hash: '0xmock' + Date.now(),
          timestamp: Math.floor(Date.now() / 1000)
        }
      };

    case 'close_app_session':
      const closeSess = sessions.get(params.session_id);
      if (!closeSess) {
        return {
          id,
          error: { code: 404, message: 'Session not found' }
        };
      }

      // Unlock balances
      closeSess.participants.forEach(addr => {
        const bal = balances.get(addr);
        if (bal && bal.length > 0) {
          const payout = parseFloat(closeSess.allocations[addr] || '0');
          bal[0].available = (parseFloat(bal[0].available) + payout).toString();
          bal[0].locked = '0';
        }
      });

      sessions.delete(params.session_id);

      return {
        id,
        result: {
          success: true,
          sessionId: params.session_id,
          status: 'closed',
          final_allocations: closeSess.allocations
        }
      };

    default:
      return {
        id,
        error: { code: 400, message: `Unknown method: ${method}` }
      };
  }
}
