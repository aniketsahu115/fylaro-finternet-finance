import { createConfig } from 'wagmi';
import { bsc, bscTestnet, mainnet } from 'wagmi/chains';
import { http } from 'viem';
import { metaMask, walletConnect, coinbaseWallet, safe } from 'wagmi/connectors';

// Get project ID from environment variables or use a default one for development
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2f5a2f12b7b96c78f1a47e8ae2c5ce9a';

export const config = createConfig({
  chains: [bsc, bscTestnet, mainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Fylaro Finternet Finance',
        url: window.location.origin,
      },
    }),
    walletConnect({
      projectId,
      metadata: {
        name: 'Fylaro Finternet Finance',
        description: 'Revolutionary invoice financing marketplace',
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`],
      },
    }),
    coinbaseWallet({
      appName: 'Fylaro Finternet Finance',
      appLogoUrl: `${window.location.origin}/favicon.ico`,
    }),
    safe(),
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [mainnet.id]: http(),
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

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
