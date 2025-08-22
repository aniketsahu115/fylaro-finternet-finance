import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi';
import { Copy, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const WalletDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!import.meta.env.DEV || import.meta.env.PROD) {
    return null; // Only show in development, hide in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        🔧 Wallet Debug
      </Button>
      
      {isVisible && (
        <Card className="w-80 max-h-96 overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Wifi className="h-4 w-4 mr-2" />
              Wallet Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {/* Connection Status */}
            <div>
              <div className="font-medium mb-1">Connection Status</div>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Badge className="bg-green-500/10 text-green-500">
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : isConnecting ? (
                  <Badge className="bg-yellow-500/10 text-yellow-500">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Connecting...
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-500">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </div>

            {/* Wallet Address */}
            {address && (
              <div>
                <div className="font-medium mb-1">Wallet Address</div>
                <div className="flex items-center space-x-2">
                  <code className="bg-muted p-1 rounded text-xs break-all">
                    {address}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(address)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Chain ID */}
            <div>
              <div className="font-medium mb-1">Network</div>
              <div className="flex items-center space-x-2">
                <Badge variant={chainId === 56 ? "default" : "destructive"}>
                  Chain ID: {chainId || 'Unknown'}
                </Badge>
                {chainId !== 56 && chainId && (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {chainId === 56 && "Binance Smart Chain"}
                {chainId === 97 && "BSC Testnet"}
                {chainId === 1 && "Ethereum Mainnet"}
                {chainId === 137 && "Polygon"}
                {chainId === 42161 && "Arbitrum"}
                {chainId && ![56, 97, 1, 137, 42161].includes(chainId) && "Unknown Network"}
              </div>
            </div>

            {/* Available Connectors */}
            <div>
              <div className="font-medium mb-1">Available Wallets</div>
              <div className="space-y-1">
                {connectors.map((connector) => (
                  <div key={connector.id} className="flex items-center justify-between">
                    <span className="text-xs">{connector.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {connector.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Info */}
            <div>
              <div className="font-medium mb-1">Browser Info</div>
              <div className="text-xs space-y-1">
                <div>User Agent: {navigator.userAgent.slice(0, 30)}...</div>
                <div>Has ethereum: {typeof window.ethereum !== 'undefined' ? '✅' : '❌'}</div>
                <div>Is MetaMask: {window.ethereum?.isMetaMask ? '✅' : '❌'}</div>
                <div>Chain ID in wallet: {window.ethereum?.chainId || 'Unknown'}</div>
                <div>Network Version: {window.ethereum?.networkVersion || 'Unknown'}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t">
              {isConnected ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => disconnect()}
                  className="w-full"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    const metamask = connectors.find(c => c.name === 'MetaMask');
                    if (metamask) {
                      connect({ connector: metamask });
                    }
                  }}
                  className="w-full"
                >
                  Connect MetaMask
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
