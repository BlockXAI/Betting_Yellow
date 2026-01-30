import { BrowserProvider, JsonRpcSigner } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const ANVIL_CHAIN_ID = '0x7A69'; // 31337 in hex
const ANVIL_CHAIN_CONFIG = {
  chainId: ANVIL_CHAIN_ID,
  chainName: 'Anvil Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [],
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
  const targetChainId = process.env.NEXT_PUBLIC_CHAIN_ID || '31337';
  
  // Switch to Anvil if not already on it
  if (network.chainId.toString() !== targetChainId) {
    await switchToAnvil();
  }
  
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, signer };
}

export async function switchToAnvil(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    // Try to switch to Anvil
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ANVIL_CHAIN_ID }],
    });
  } catch (error: any) {
    // Chain not added, try to add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ANVIL_CHAIN_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Anvil network to MetaMask');
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
