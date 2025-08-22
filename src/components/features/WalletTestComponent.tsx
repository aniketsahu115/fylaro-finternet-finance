import { useConnect, useAccount, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const WalletTestComponent = () => {
  const { connectors, connect, error } = useConnect();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();

  console.log('Available connectors:', connectors);
  console.log('Current chainId:', chainId);
  console.log('Connection error:', error);

  const handleConnect = async (connector: any) => {
    try {
      console.log('Attempting to connect with:', connector.name);
      await connect({ connector });
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Wallet Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
          <p>Chain ID: {chainId || 'Unknown'}</p>
          <p>Address: {address || 'None'}</p>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
            Error: {error.message}
          </div>
        )}
        
        <div className="space-y-2">
          <p className="font-medium">Available Wallets:</p>
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              variant="outline"
              className="w-full justify-start"
            >
              {connector.name} ({connector.type})
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
