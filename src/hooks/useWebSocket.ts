import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/webSocketService';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  userId?: string;
  tradingPairs?: string[];
}

interface WebSocketHookReturn {
  isConnected: boolean;
  connectionStats: any;
  lastMessage: any;
  error: string | null;
  sendMessage: (event: string, data: any) => void;
  subscribe: (tradingPair: string) => void;
  unsubscribe: (tradingPair: string) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  forceReconnect: () => void;
}

/**
 * React hook for WebSocket functionality
 */
export const useWebSocket = (options: UseWebSocketOptions = {}): WebSocketHookReturn => {
  const { autoConnect = true, userId, tradingPairs = [] } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStats, setConnectionStats] = useState(webSocketService.getStats());
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isInitialized = useRef(false);

  // Connection status handler
  const handleConnection = useCallback(() => {
    setIsConnected(true);
    setConnectionStats(webSocketService.getStats());
    setError(null);
    
    // Join user room if userId provided
    if (userId) {
      webSocketService.joinUserRoom(userId);
    }
    
    // Subscribe to trading pairs
    tradingPairs.forEach(pair => {
      webSocketService.subscribeTo(pair);
    });
  }, [userId, tradingPairs]);

  // Disconnection handler
  const handleDisconnection = useCallback(() => {
    setIsConnected(false);
    setConnectionStats(webSocketService.getStats());
  }, []);

  // Message handler
  const handleMessage = useCallback((data: any) => {
    setLastMessage({
      ...data,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Error handler
  const handleError = useCallback((errorData: any) => {
    setError(errorData.message || 'WebSocket error occurred');
    console.error('WebSocket error:', errorData);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isInitialized.current && autoConnect) {
      isInitialized.current = true;
      
      // Set up event listeners
      webSocketService.on('connection_established', handleConnection);
      webSocketService.on('connection_lost', handleDisconnection);
      webSocketService.on('notification', handleMessage);
      webSocketService.on('error', handleError);
      
      // Initialize connection
      webSocketService.initialize().then((connected) => {
        if (connected) {
          handleConnection();
        } else {
          setError('Failed to establish WebSocket connection');
        }
      });
    }

    // Cleanup function
    return () => {
      webSocketService.off('connection_established', handleConnection);
      webSocketService.off('connection_lost', handleDisconnection);
      webSocketService.off('notification', handleMessage);
      webSocketService.off('error', handleError);
    };
  }, [autoConnect, handleConnection, handleDisconnection, handleMessage, handleError]);

  // Update connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(webSocketService.isConnected());
      setConnectionStats(webSocketService.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Functions to return
  const sendMessage = useCallback((event: string, data: any) => {
    try {
      webSocketService.send(event, data);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  }, []);

  const subscribe = useCallback((tradingPair: string) => {
    webSocketService.subscribeTo(tradingPair);
  }, []);

  const unsubscribe = useCallback((tradingPair: string) => {
    webSocketService.unsubscribeFrom(tradingPair);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const connected = await webSocketService.initialize();
      if (connected) {
        handleConnection();
      }
      return connected;
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect to WebSocket');
      return false;
    }
  }, [handleConnection]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    handleDisconnection();
  }, [handleDisconnection]);

  const forceReconnect = useCallback(() => {
    webSocketService.forceReconnect();
  }, []);

  return {
    isConnected,
    connectionStats,
    lastMessage,
    error,
    sendMessage,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    forceReconnect
  };
};

/**
 * Hook for order book real-time updates
 */
export const useOrderBook = (tradingPair: string) => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    if (isConnected && tradingPair) {
      subscribe(tradingPair);
      
      const handleOrderBookUpdate = (data: any) => {
        if (data.tradingPair === tradingPair) {
          setOrderBook(data.orderBook);
          setIsLoading(false);
        }
      };

      webSocketService.on('order_book_update', handleOrderBookUpdate);

      return () => {
        unsubscribe(tradingPair);
        webSocketService.off('order_book_update', handleOrderBookUpdate);
      };
    }
  }, [isConnected, tradingPair, subscribe, unsubscribe]);

  return { orderBook, isLoading };
};

/**
 * Hook for real-time trade updates
 */
export const useTrades = (tradingPair?: string) => {
  const [trades, setTrades] = useState<any[]>([]);
  const [newTrade, setNewTrade] = useState<any>(null);
  
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      const handleTradeExecuted = (data: any) => {
        if (!tradingPair || data.tradingPair === tradingPair) {
          setNewTrade(data);
          setTrades(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 trades
        }
      };

      webSocketService.on('trade_executed', handleTradeExecuted);

      return () => {
        webSocketService.off('trade_executed', handleTradeExecuted);
      };
    }
  }, [isConnected, tradingPair]);

  return { trades, newTrade };
};

/**
 * Hook for portfolio real-time updates
 */
export const usePortfolioUpdates = (userId: string) => {
  const [portfolioUpdate, setPortfolioUpdate] = useState<any>(null);
  
  const { isConnected } = useWebSocket({ userId });

  useEffect(() => {
    if (isConnected) {
      const handlePortfolioUpdate = (data: any) => {
        setPortfolioUpdate({
          ...data,
          timestamp: new Date().toISOString()
        });
      };

      webSocketService.on('invoice_status_update', handlePortfolioUpdate);
      webSocketService.on('payment_received', handlePortfolioUpdate);
      webSocketService.on('credit_score_update', handlePortfolioUpdate);

      return () => {
        webSocketService.off('invoice_status_update', handlePortfolioUpdate);
        webSocketService.off('payment_received', handlePortfolioUpdate);
        webSocketService.off('credit_score_update', handlePortfolioUpdate);
      };
    }
  }, [isConnected]);

  return { portfolioUpdate };
};

/**
 * Hook for market data real-time updates
 */
export const useMarketData = () => {
  const [marketData, setMarketData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      const handleMarketDataUpdate = (data: any) => {
        setMarketData(prev => ({
          ...prev,
          [data.tradingPair]: data
        }));
        setIsLoading(false);
      };

      webSocketService.on('market_data_update', handleMarketDataUpdate);

      return () => {
        webSocketService.off('market_data_update', handleMarketDataUpdate);
      };
    }
  }, [isConnected]);

  return { marketData, isLoading };
};

export default useWebSocket;
