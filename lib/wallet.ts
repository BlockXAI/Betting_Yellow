import { BrowserProvider, JsonRpcSigner } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet(): Promise<{ address: string; signer: JsonRpcSigner }> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, signer };
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
