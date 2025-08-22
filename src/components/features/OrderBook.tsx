import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpDown,
  Clock,
  DollarSign,
  Users,
  Zap
} from "lucide-react";

interface OrderBookProps {
  invoiceId: string;
}

interface Order {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  total: number;
  timestamp: string;
  trader: string;
}

interface Trade {
  id: string;
  price: number;
  quantity: number;
  total: number;
  timestamp: string;
  type: 'buy' | 'sell';
}

const OrderBook = ({ invoiceId }: OrderBookProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');

  // Mock data generation
  useEffect(() => {
    generateMockData();
    const interval = setInterval(generateMockData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const generateMockData = () => {
    // Generate buy orders (bids)
    const buyOrders: Order[] = Array.from({ length: 8 }, (_, i) => ({
      id: `buy-${i}`,
      type: 'buy',
      price: 0.85 - (i * 0.01),
      quantity: Math.floor(Math.random() * 5000) + 1000,
      total: 0,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      trader: `Trader${Math.floor(Math.random() * 100)}`
    }));

    // Generate sell orders (asks)
    const sellOrders: Order[] = Array.from({ length: 8 }, (_, i) => ({
      id: `sell-${i}`,
      type: 'sell',
      price: 0.86 + (i * 0.01),
      quantity: Math.floor(Math.random() * 5000) + 1000,
      total: 0,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      trader: `Trader${Math.floor(Math.random() * 100)}`
    }));

    // Calculate totals
    buyOrders.forEach(order => {
      order.total = order.price * order.quantity;
    });
    sellOrders.forEach(order => {
      order.total = order.price * order.quantity;
    });

    setOrders([...buyOrders, ...sellOrders]);

    // Generate recent trades
    const recentTrades: Trade[] = Array.from({ length: 10 }, (_, i) => ({
      id: `trade-${i}`,
      price: 0.85 + (Math.random() * 0.02),
      quantity: Math.floor(Math.random() * 2000) + 500,
      total: 0,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      type: Math.random() > 0.5 ? 'buy' : 'sell'
    }));

    recentTrades.forEach(trade => {
      trade.total = trade.price * trade.quantity;
    });

    setTrades(recentTrades);
  };

  const buyOrders = orders.filter(o => o.type === 'buy').sort((a, b) => b.price - a.price);
  const sellOrders = orders.filter(o => o.type === 'sell').sort((a, b) => a.price - b.price);

  const marketStats = {
    lastPrice: trades.length > 0 ? trades[0].price : 0.86,
    priceChange: 0.02,
    priceChangePercent: 2.4,
    volume24h: trades.reduce((sum, trade) => sum + trade.total, 0),
    highPrice: Math.max(...trades.map(t => t.price)),
    lowPrice: Math.min(...trades.map(t => t.price)),
    spread: sellOrders.length && buyOrders.length ? 
      ((sellOrders[0].price - buyOrders[0].price) / buyOrders[0].price) * 100 : 0
  };

  const formatPrice = (price: number) => price.toFixed(4);
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Market Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last Price</span>
            </div>
            <p className="text-lg font-bold">${formatPrice(marketStats.lastPrice)}</p>
            <div className={`flex items-center text-xs ${marketStats.priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {marketStats.priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              +{marketStats.priceChangePercent}%
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">24h Volume</span>
            </div>
            <p className="text-lg font-bold">{formatAmount(marketStats.volume24h)}</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">24h High</span>
            </div>
            <p className="text-lg font-bold">${formatPrice(marketStats.highPrice)}</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingDown className="h-3 w-3 text-destructive" />
              <span className="text-xs text-muted-foreground">24h Low</span>
            </div>
            <p className="text-lg font-bold">${formatPrice(marketStats.lowPrice)}</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-1">
              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Spread</span>
            </div>
            <p className="text-lg font-bold">{marketStats.spread.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active Orders</span>
            </div>
            <p className="text-lg font-bold">{orders.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Order Book */}
        <Card className="lg:col-span-2 gradient-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Order Book
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={generateMockData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground border-b border-border pb-2">
                <div>Price (USD)</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Total</div>
              </div>

              {/* Sell Orders (Asks) */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-destructive mb-2">Sell Orders</div>
                {sellOrders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id}
                    className="grid grid-cols-3 text-sm hover:bg-destructive/5 p-1 rounded cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="text-destructive font-mono">{formatPrice(order.price)}</div>
                    <div className="text-right text-muted-foreground">{order.quantity.toLocaleString()}</div>
                    <div className="text-right">{formatAmount(order.total)}</div>
                  </div>
                ))}
              </div>

              {/* Current Price */}
              <div className="py-2 text-center border-y border-border">
                <div className="text-lg font-bold">${formatPrice(marketStats.lastPrice)}</div>
                <div className={`text-xs ${marketStats.priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  Last traded price
                </div>
              </div>

              {/* Buy Orders (Bids) */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-success mb-2">Buy Orders</div>
                {buyOrders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id}
                    className="grid grid-cols-3 text-sm hover:bg-success/5 p-1 rounded cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="text-success font-mono">{formatPrice(order.price)}</div>
                    <div className="text-right text-muted-foreground">{order.quantity.toLocaleString()}</div>
                    <div className="text-right">{formatAmount(order.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Panel */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Place Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={side} onValueChange={(v) => setSide(v as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>

              <TabsContent value={side} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Order Type</label>
                  <Select value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderType === 'limit' && (
                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <Input 
                      type="number" 
                      placeholder="0.0000" 
                      defaultValue={side === 'buy' ? formatPrice(buyOrders[0]?.price || 0.85) : formatPrice(sellOrders[0]?.price || 0.86)}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input type="number" placeholder="0" />
                </div>

                <div>
                  <label className="text-sm font-medium">Total</label>
                  <Input type="number" placeholder="0.00" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: $45,620
                  </p>
                </div>

                <Button className={`w-full glow ${side === 'sell' ? 'bg-destructive hover:bg-destructive/90' : ''}`}>
                  <Zap className="h-4 w-4 mr-2" />
                  Place {side} Order
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground border-b border-border pb-2">
                <div>Time</div>
                <div className="text-right">Price</div>
                <div className="text-right">Quantity</div>
              </div>

              {trades.slice(0, 10).map((trade) => (
                <div key={trade.id} className="grid grid-cols-3 text-sm py-1">
                  <div className="text-muted-foreground text-xs">{formatTime(trade.timestamp)}</div>
                  <div className={`text-right font-mono ${trade.type === 'buy' ? 'text-success' : 'text-destructive'}`}>
                    {formatPrice(trade.price)}
                  </div>
                  <div className="text-right text-muted-foreground text-xs">
                    {trade.quantity.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Order Details */}
      {selectedOrder && (
        <Card className="gradient-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Details</CardTitle>
              <Badge className={selectedOrder.type === 'buy' ? 'bg-success' : 'bg-destructive'}>
                {selectedOrder.type.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-bold">${formatPrice(selectedOrder.price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-bold">{selectedOrder.quantity.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold">{formatAmount(selectedOrder.total)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trader</p>
                <p className="font-bold">{selectedOrder.trader}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderBook;