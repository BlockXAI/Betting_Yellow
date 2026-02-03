/**
 * Mock ClearNode Server for Testing
 * Simulates basic Yellow Network coordinator functionality
 */

const WebSocket = require('ws');

const PORT = 8001;
const wss = new WebSocket.Server({ port: PORT });

console.log('🟡 Mock ClearNode Server Starting...\n');
console.log('═'.repeat(60));
console.log(`📍 Listening on: ws://localhost:${PORT}/ws`);
console.log(`🌐 Server ready for Yellow SDK connections`);
console.log('═'.repeat(60));
console.log('\n⏳ Waiting for connections...\n');

const channels = new Map();
let messageId = 0;

wss.on('connection', (ws, req) => {
  const clientId = `client_${Date.now()}`;
  console.log(`✅ New connection: ${clientId}`);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`\n📥 INBOUND [${clientId}]:`, JSON.stringify(message, null, 2));
      
      handleMessage(ws, message);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`❌ Connection closed: ${clientId}`);
  });
  
  ws.on('error', (error) => {
    console.error(`⚠️ WebSocket error [${clientId}]:`, error.message);
  });
});

function handleMessage(ws, message) {
  const { id, method, params } = message;
  
  let response;
  
  switch (method) {
    case 'open_channel':
      response = handleOpenChannel(params);
      break;
      
    case 'update_state':
      response = handleUpdateState(params);
      break;
      
    case 'close_channel':
      response = handleCloseChannel(params);
      break;
      
    default:
      response = {
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      };
  }
  
  if (response) {
    response.id = id;
    console.log(`📤 OUTBOUND:`, JSON.stringify(response, null, 2));
    ws.send(JSON.stringify(response));
  }
}

function handleOpenChannel(params) {
  const { channel_id, participants, initial_state } = params;
  
  channels.set(channel_id, {
    participants,
    state: initial_state,
    status: 'active',
    created_at: Date.now()
  });
  
  console.log(`\n🔓 Channel opened: ${channel_id}`);
  console.log(`   Participants: ${participants.join(', ')}`);
  console.log(`   Initial state:`, initial_state);
  
  return {
    result: {
      success: true,
      channel_id,
      status: 'active',
      message: 'Channel opened successfully'
    }
  };
}

function handleUpdateState(params) {
  const { channel_id, state } = params;
  
  if (!channels.has(channel_id)) {
    return {
      error: {
        code: -32000,
        message: 'Channel not found'
      }
    };
  }
  
  const channel = channels.get(channel_id);
  channel.state = state;
  channel.updated_at = Date.now();
  
  console.log(`\n📝 State updated: ${channel_id}`);
  console.log(`   Nonce: ${state.nonce}`);
  console.log(`   Allocations:`, state.allocations);
  
  return {
    result: {
      success: true,
      channel_id,
      nonce: state.nonce,
      message: 'State updated successfully'
    }
  };
}

function handleCloseChannel(params) {
  const { channel_id, final_state } = params;
  
  if (!channels.has(channel_id)) {
    return {
      error: {
        code: -32000,
        message: 'Channel not found'
      }
    };
  }
  
  const channel = channels.get(channel_id);
  channel.state = final_state;
  channel.status = 'closed';
  channel.closed_at = Date.now();
  
  console.log(`\n🔒 Channel closed: ${channel_id}`);
  console.log(`   Final state:`, final_state);
  
  return {
    result: {
      success: true,
      channel_id,
      final_state,
      message: 'Channel closed successfully'
    }
  };
}

console.log('\n💡 Usage:');
console.log('   - Start your Next.js app: npm run dev');
console.log('   - App will connect to ws://localhost:8001');
console.log('   - Watch this console for Yellow SDK activity\n');
