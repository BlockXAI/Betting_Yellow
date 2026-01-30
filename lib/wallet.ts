import { BrowserProvider, JsonRpcSigner } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const AVALANCHE_FUJI_CHAIN_ID = '0xA869'; // 43113 in hex
const AVALANCHE_FUJI_CONFIG = {
  chainId: AVALANCHE_FUJI_CHAIN_ID,
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

export async function connectWallet(): Promise<{ address: string; signer: JsonRpcSigner }> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new BrowserProvider(window.ethereum);
  
  // Request account access
  await provider.send('eth_requestAccounts', []);
  
  // Check current network
  const network = await provider.getNetwork();
  const targetChainId = process.env.NEXT_PUBLIC_CHAIN_ID || '43113';
  
  // Switch to Avalanche Fuji if not already on it
  if (network.chainId.toString() !== targetChainId) {
    await switchToAvalancheFuji();
  }
  
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, signer };
}

export async function switchToAvalancheFuji(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    // Try to switch to Avalanche Fuji
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AVALANCHE_FUJI_CHAIN_ID }],
    });
  } catch (error: any) {
    // Chain not added, try to add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [AVALANCHE_FUJI_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Avalanche Fuji network to MetaMask');
      }
    } else {
      throw error;
    }
  }
}

export async function signMessage(signer: JsonRpcSigner, message: string): Promise<string> {
  return await signer.signMessage(message);
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals: number = 2): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}
