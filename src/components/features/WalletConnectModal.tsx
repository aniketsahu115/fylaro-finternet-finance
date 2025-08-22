import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConnect, useAccount } from 'wagmi';
import { toast } from 'sonner';
import { Wallet, ExternalLink, Shield, Zap } from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnectModal = ({ isOpen, onClose }: WalletConnectModalProps) => {
  const { connectors, connect, error } = useConnect();
  const { isConnecting } = useAccount();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  const handleConnect = async (connector: any) => {
    try {
      setSelectedConnector(connector.id);
      await connect({ connector });
      toast.success('Wallet connected successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setSelectedConnector(null);
    }
  };

  const getWalletIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'metamask':
        return '🦊';
      case 'walletconnect':
        return '🔗';
      case 'coinbase wallet':
        return '🔵';
      case 'trust wallet':
        return '🛡️';
      default:
        return '👛';
    }
  };

  const getWalletDescription = (name: string) => {
    switch (name.toLowerCase()) {
      case 'metamask':
        return 'Most popular wallet for Binance Smart Chain';
      case 'walletconnect':
        return 'Connect with mobile wallets via QR code';
      case 'coinbase wallet':
        return 'Secure wallet by Coinbase';
      case 'trust wallet':
        return 'Official Binance wallet with BSC support';
      default:
        return 'Connect with your preferred wallet';
    }
  };

  const isRecommended = (name: string) => {
    return ['metamask', 'trust wallet'].includes(name.toLowerCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Connect Your Wallet</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Connect to Binance Smart Chain for the best experience</span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {error.message}
            </div>
          )}

          <div className="space-y-2">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-muted/50"
                onClick={() => handleConnect(connector)}
                disabled={isConnecting || selectedConnector === connector.id}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="text-2xl">
                    {getWalletIcon(connector.name)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{connector.name}</span>
                      {isRecommended(connector.name) && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          <Zap className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getWalletDescription(connector.name)}
                    </p>
                  </div>
                  {selectedConnector === connector.id ? (
                    <div className="text-xs text-muted-foreground">Connecting...</div>
                  ) : (
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            New to wallets?{' '}
            <a 
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download MetaMask
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
