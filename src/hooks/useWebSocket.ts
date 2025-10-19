// WebSocket hook for real-time updates
import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_WS_URL || "ws://localhost:3001",
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus("connecting");
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();

        if (
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setConnectionStatus("error");
        setError("WebSocket connection error");
        onError?.(event);
      };
    } catch (err) {
      setError("Failed to create WebSocket connection");
      setConnectionStatus("error");
    }
  };

  const disconnect = () => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  const subscribe = (channel: string, callback?: (data: any) => void) => {
    const message = {
      type: "subscribe",
      channel,
      timestamp: Date.now(),
    };

    if (callback) {
      const originalOnMessage = onMessage;
      onMessage = (msg) => {
        if (msg.type === channel) {
          callback(msg.data);
        }
        originalOnMessage?.(msg);
      };
    }

    return sendMessage(message);
  };

  const unsubscribe = (channel: string) => {
    const message = {
      type: "unsubscribe",
      channel,
      timestamp: Date.now(),
    };

    return sendMessage(message);
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
  };
};

// Specific hooks for different types of real-time updates
export const useInvoiceUpdates = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { subscribe, unsubscribe } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case "invoice_status_update":
          setInvoices((prev) =>
            prev.map((invoice) =>
              invoice.id === message.data.invoiceId
                ? { ...invoice, status: message.data.status }
                : invoice
            )
          );
          break;
        case "invoice_verification_complete":
          setNotifications((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "success",
              title: "Invoice Verified",
              message: `Invoice ${message.data.invoiceId} has been verified`,
              timestamp: Date.now(),
            },
          ]);
          break;
        case "payment_received":
          setNotifications((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "success",
              title: "Payment Received",
              message: `Payment of $${message.data.amount} received for invoice ${message.data.invoiceId}`,
              timestamp: Date.now(),
            },
          ]);
          break;
      }
    },
  });

  useEffect(() => {
    subscribe("invoice_updates");
    return () => unsubscribe("invoice_updates");
  }, []);

  return { invoices, notifications };
};

export const useTradingUpdates = () => {
  const [orderBook, setOrderBook] = useState<any>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [marketStats, setMarketStats] = useState<any>({});

  const { subscribe, unsubscribe } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case "order_book_update":
          setOrderBook(message.data);
          break;
        case "trade_executed":
          setRecentTrades((prev) => [message.data, ...prev.slice(0, 49)]);
          break;
        case "market_stats_update":
          setMarketStats(message.data);
          break;
      }
    },
  });

  useEffect(() => {
    subscribe("trading_updates");
    return () => unsubscribe("trading_updates");
  }, []);

  return { orderBook, recentTrades, marketStats };
};

export const usePaymentUpdates = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  const { subscribe, unsubscribe } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case "payment_status_update":
          setPayments((prev) =>
            prev.map((payment) =>
              payment.id === message.data.paymentId
                ? { ...payment, status: message.data.status }
                : payment
            )
          );
          break;
        case "settlement_completed":
          setSettlements((prev) => [message.data, ...prev]);
          break;
      }
    },
  });

  useEffect(() => {
    subscribe("payment_updates");
    return () => unsubscribe("payment_updates");
  }, []);

  return { payments, settlements };
};

export const useCreditScoreUpdates = () => {
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);

  const { subscribe, unsubscribe } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case "credit_score_update":
          setCreditScore(message.data.score);
          setScoreHistory((prev) => [
            ...prev,
            {
              score: message.data.score,
              change: message.data.change,
              reason: message.data.reason,
              timestamp: Date.now(),
            },
          ]);
          break;
      }
    },
  });

  useEffect(() => {
    subscribe("credit_score_updates");
    return () => unsubscribe("credit_score_updates");
  }, []);

  return { creditScore, scoreHistory };
};

export default useWebSocket;
