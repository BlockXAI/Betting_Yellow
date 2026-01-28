/**
 * Smart Contract Integration Layer
 * Handles interactions with Nitrolite custody, adjudicator, and token contracts
 */

import { ethers } from 'ethers';

// Contract ABIs - minimal interfaces for required functions
const CUSTODY_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function depositERC20(address token, uint256 amount)',
  'function withdrawERC20(address token, uint256 amount)',
];

const TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

const ADJUDICATOR_ABI = [
  'function submitChallenge(bytes32 channelId, bytes memory state, bytes[] memory signatures)',
  'function finalizeChannel(bytes32 channelId)',
  'function getChannelState(bytes32 channelId) view returns (uint8 status, uint256 timestamp)',
];

// Contract addresses from environment
export const getContractAddresses = () => ({
  custody: process.env.NEXT_PUBLIC_CUSTODY_CONTRACT || '',
  adjudicator: process.env.NEXT_PUBLIC_ADJUDICATOR_CONTRACT || '',
  token: process.env.NEXT_PUBLIC_TOKEN_CONTRACT || '',
});

// Get provider and signer
export const getProvider = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
};

export const getSigner = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not available');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
};

// Contract instances
export const getCustodyContract = async () => {
  const signer = await getSigner();
  const { custody } = getContractAddresses();
  return new ethers.Contract(custody, CUSTODY_ABI, signer);
};

export const getTokenContract = async () => {
  const signer = await getSigner();
  const { token } = getContractAddresses();
  return new ethers.Contract(token, TOKEN_ABI, signer);
};

export const getAdjudicatorContract = async () => {
  const signer = await getSigner();
  const { adjudicator } = getContractAddresses();
  return new ethers.Contract(adjudicator, ADJUDICATOR_ABI, signer);
};

/**
 * Deposit ETH to state channel
 */
export async function depositToChannel(amountInEth: string): Promise<ethers.ContractTransactionResponse> {
  const contract = await getCustodyContract();
  const amountWei = ethers.parseEther(amountInEth);
  
  console.log('💰 Depositing to channel:', amountInEth, 'ETH');
  const tx = await contract.deposit({ value: amountWei });
  console.log('📤 Transaction sent:', tx.hash);
  
  return tx;
}

/**
 * Withdraw ETH from state channel
 */
export async function withdrawFromChannel(amountInEth: string): Promise<ethers.ContractTransactionResponse> {
  const contract = await getCustodyContract();
  const amountWei = ethers.parseEther(amountInEth);
  
  console.log('💸 Withdrawing from channel:', amountInEth, 'ETH');
  const tx = await contract.withdraw(amountWei);
  console.log('📤 Transaction sent:', tx.hash);
  
  return tx;
}

/**
 * Get user's balance in custody contract
 */
export async function getChannelBalance(address: string): Promise<string> {
  const signer = await getSigner();
  const { custody } = getContractAddresses();
  const contract = new ethers.Contract(custody, CUSTODY_ABI, signer);
  
  const balanceWei = await contract.balanceOf(address);
  return ethers.formatEther(balanceWei);
}

/**
 * Get user's wallet ETH balance
 */
export async function getWalletBalance(address: string): Promise<string> {
  const provider = getProvider();
  const balanceWei = await provider.getBalance(address);
  return ethers.formatEther(balanceWei);
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(tx: ethers.ContractTransactionResponse, confirmations = 1): Promise<ethers.ContractTransactionReceipt | null> {
  console.log('⏳ Waiting for confirmation...');
  const receipt = await tx.wait(confirmations);
  console.log('✅ Transaction confirmed:', receipt?.hash);
  return receipt;
}

/**
 * Check if wallet is connected to correct network
 */
export async function checkNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const expectedChainId = process.env.NEXT_PUBLIC_CHAIN_ID || '31337';
  
  return network.chainId.toString() === expectedChainId;
}

/**
 * Switch to correct network (Anvil local)
 */
export async function switchNetwork(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not available');
  }
  
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '31337';
  const chainIdHex = '0x' + parseInt(chainId).toString(16);
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: any) {
    // Chain doesn't exist, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'Anvil Local',
          rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'],
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
        }],
      });
    } else {
      throw error;
    }
  }
}
