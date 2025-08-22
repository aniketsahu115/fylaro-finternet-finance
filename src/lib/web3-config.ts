import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet, mainnet } from 'wagmi/chains';
import { http } from 'viem';

// Get project ID from environment variables or use a default one for development
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2f5a2f12b7b96c78f1a47e8ae2c5ce9a';

// Explicitly define chains to avoid any local network conflicts
const productionChains = [
  {
    ...bsc,
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://bsc-dataseed.binance.org'] },
      public: { http: ['https://bsc-dataseed.binance.org'] },
    },
  },
  {
    ...bscTestnet,
    id: 97,
    name: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
      public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
  },
  mainnet,
] as const;

export const config = getDefaultConfig({
  appName: import.meta.env.VITE_APP_NAME || 'Fylaro Finternet Finance',
  projectId,
  chains: productionChains,
  ssr: false,
  batch: {
    multicall: true,
  },
  transports: {
    [56]: http('https://bsc-dataseed.binance.org'),
    [97]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [1]: http(),
  },
});

// Chain configurations for easy access
export const supportedChains = {
  bsc: {
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://bsc-dataseed.binance.org'] },
    },
    blockExplorers: {
      default: { name: 'BSCScan', url: 'https://bscscan.com' },
    },
  },
  bscTestnet: {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
    blockExplorers: {
      default: { name: 'BSCScan Testnet', url: 'https://testnet.bscscan.com' },
    },
  },
} as const;

// Default chain for the application (Binance Smart Chain)
export const defaultChain = bsc;
