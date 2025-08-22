import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface WebSocketConfig {
  url: string;
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectInterval: number;
  timeout: number;
}

interface ConnectionStats {
  isConnected: boolean;
  reconnectAttempts: number;
  lastConnected: Date | null;
  connectionId: string | null;
}

interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private stats: ConnectionStats;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
      autoReconnect: true,
      reconnectAttempts: 5,
      reconnectInterval: 5000,
      timeout: 20000,
      ...config
    };

    this.stats = {
      isConnected: false,
      reconnectAttempts: 0,
      lastConnected: null,
      connectionId: null
    };
  }

  /**
   * Initialize WebSocket connection
   */
  async initialize(token?: string): Promise<boolean> {
    if (this.isInitialized && this.socket?.connected) {
      console.log('WebSocket already initialized and connected');
      return true;
    }

    try {
      console.log('🔌 Initializing WebSocket connection...');
      
      this.socket = io(this.config.url, {
        auth: token ? { token } : undefined,
        timeout: this.config.timeout,
        transports: ['websocket', 'polling'],
        forceNew: true,
        autoConnect: true,
        reconnection: this.config.autoReconnect,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectInterval
      });

      this.setupEventHandlers();
      this.isInitialized = true;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('❌ WebSocket connection timeout');
          resolve(false);
        }, this.config.timeout);

        this.socket!.once('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.socket!.once('connect_error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      return false;
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.stats.isConnected = true;
      this.stats.lastConnected = new Date();
      this.stats.connectionId = this.socket!.id;
      this.stats.reconnectAttempts = 0;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      this.emit('connection_established', this.stats);
      toast.success('Real-time connection established');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.stats.isConnected = false;
      this.stats.connectionId = null;
      
      this.emit('connection_lost', { reason });
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't auto-reconnect
        toast.error('Connection lost - Server disconnect');
      } else {
        toast.warning('Connection lost - Attempting to reconnect...');
        this.handleReconnection();
      }
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('🔄 WebSocket reconnected after', attempt, 'attempts');
      toast.success('Connection restored');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection failed:', error);
      this.stats.reconnectAttempts++;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      toast.error('Failed to establish real-time connection');
    });

    // Application-specific events
    this.socket.on('notification', (payload: NotificationPayload) => {
      this.handleNotification(payload);
    });

    this.socket.on('invoice_status_update', (data) => {
      this.emit('invoice_status_update', data);
    });

    this.socket.on('trade_executed', (data) => {
      this.emit('trade_executed', data);
    });

    this.socket.on('payment_received', (data) => {
      this.emit('payment_received', data);
    });

    this.socket.on('order_book_update', (data) => {
      this.emit('order_book_update', data);
    });

    this.socket.on('credit_score_update', (data) => {
      this.emit('credit_score_update', data);
    });

    this.socket.on('document_verified', (data) => {
      this.emit('document_verified', data);
    });

    this.socket.on('market_data_update', (data) => {
      this.emit('market_data_update', data);
    });
  }

  /**
   * Handle incoming notifications
   */
  private handleNotification(payload: NotificationPayload): void {
    const { type, title, message } = payload;
    
    switch (type) {
      case 'success':
        toast.success(title, { description: message });
        break;
      case 'warning':
        toast.warning(title, { description: message });
        break;
      case 'error':
        toast.error(title, { description: message });
        break;
      default:
        toast(title, { description: message });
    }

    this.emit('notification', payload);
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (!this.config.autoReconnect) return;
    
    if (this.stats.reconnectAttempts < this.config.reconnectAttempts) {
      this.reconnectTimer = setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        this.stats.reconnectAttempts++;
        this.socket?.connect();
      }, this.config.reconnectInterval);
    } else {
      console.log('❌ Max reconnection attempts reached');
      toast.error('Unable to restore connection. Please refresh the page.');
    }
  }

  /**
   * Subscribe to trading pair updates
   */
  subscribeTo(tradingPair: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { tradingPair });
      console.log(`📊 Subscribed to ${tradingPair} updates`);
    }
  }

  /**
   * Unsubscribe from trading pair updates
   */
  unsubscribeFrom(tradingPair: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { tradingPair });
      console.log(`📊 Unsubscribed from ${tradingPair} updates`);
    }
  }

  /**
   * Join user-specific room for notifications
   */
  joinUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_user_room', { userId });
      console.log(`👤 Joined user room: ${userId}`);
    }
  }

  /**
   * Leave user-specific room
   */
  leaveUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_user_room', { userId });
      console.log(`👤 Left user room: ${userId}`);
    }
  }

  /**
   * Send a custom message to the server
   */
  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot send message - WebSocket not connected');
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to local listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isInitialized = false;
    this.eventListeners.clear();
    
    console.log('🔌 WebSocket service disconnected and cleaned up');
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Force reconnection
   */
  forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      setTimeout(() => {
        this.socket?.connect();
      }, 1000);
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Auto-initialize on import (with error handling)
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  webSocketService.initialize().catch(error => {
    console.warn('Failed to auto-initialize WebSocket:', error);
  });
}

export default webSocketService;
