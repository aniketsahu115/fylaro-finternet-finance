import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { toast } from 'sonner';

export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  isConnecting: boolean;
  error?: string;
}

export const useWallet = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

  useEffect(() => {
    setWalletState({
      isConnected,
      address,
      chainId,
      isConnecting,
      error: connectError?.message,
    });
  }, [isConnected, address, chainId, isConnecting, connectError]);

  const connectWallet = async () => {
    try {
      // Get MetaMask connector (most common for BSC)
      const metamaskConnector = connectors.find(
        (connector) => connector.name === 'MetaMask'
      );
      
      if (metamaskConnector) {
        console.log('Connecting with MetaMask...');
        await connect({ connector: metamaskConnector });
        
        // Wait a bit for connection to establish
        setTimeout(async () => {
          // Check if we need to switch to BSC
          if (chainId && chainId !== bsc.id) {
            try {
              console.log('Switching to BSC from chain:', chainId);
              await switchChain({ chainId: bsc.id });
              toast.success('Switched to Binance Smart Chain');
            } catch (switchError) {
              console.error('Switch chain error:', switchError);
              toast.error('Please switch to Binance Smart Chain manually in your wallet');
            }
          }
        }, 1000);
        
        toast.success('Wallet connected successfully!');
      } else {
        // Fallback to first available connector
        const firstConnector = connectors[0];
        if (firstConnector) {
          console.log('Connecting with:', firstConnector.name);
          await connect({ connector: firstConnector });
        } else {
          toast.error('No wallet connectors available');
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const switchToBSC = async () => {
    try {
      await switchChain({ chainId: bsc.id });
      toast.success('Switched to Binance Smart Chain');
    } catch (error) {
      console.error('Failed to switch chain:', error);
      toast.error('Failed to switch to Binance Smart Chain');
    }
  };

  const formatAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isOnBSC = chainId === bsc.id;

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchToBSC,
    formatAddress,
    isOnBSC,
    connectors,
  };
};
