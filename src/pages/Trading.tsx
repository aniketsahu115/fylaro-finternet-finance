import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OrderBook from "@/components/features/OrderBook";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  ArrowUpDown,
  Eye,
  ShoppingCart,
  Wallet,
  Target,
  BarChart3
} from "lucide-react";

const Trading = () => {
  const tradingStats = [
    {
      title: "Portfolio Value",
      value: "$127,840",
      change: "+5.2%",
      trend: "up",
      icon: Wallet,
    },
    {
      title: "Today's P&L",
      value: "+$3,247",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Active Positions",
      value: "12",
      change: "+2",
      trend: "up",
      icon: Target,
    },
    {
      title: "Available Cash",
      value: "$45,620",
      change: "-$5,000",
      trend: "down",
      icon: DollarSign,
    },
  ];

  const marketData = [
    {
      id: "INV-001",
      company: "TechFlow Solutions",
      lastPrice: 0.92,
      change: +0.03,
      changePercent: +3.4,
      volume: 125000,
      bid: 0.91,
      ask: 0.93,
      yield: 8.5,
    },
    {
      id: "INV-002", 
      company: "Green Energy Corp",
      lastPrice: 0.88,
      change: -0.02,
      changePercent: -2.2,
      volume: 89500,
      bid: 0.87,
      ask: 0.89,
      yield: 12.3,
    },
    {
      id: "INV-003",
      company: "RetailMax Inc", 
      lastPrice: 0.95,
      change: +0.01,
      changePercent: +1.1,
      volume: 67800,
      bid: 0.94,
      ask: 0.96,
      yield: 9.7,
    },
    {
      id: "INV-004",
      company: "MedTech Innovations",
      lastPrice: 0.96,
      change: +0.02,
      changePercent: +2.1,
      volume: 156000,
      bid: 0.95,
      ask: 0.97,
      yield: 7.2,
    },
  ];

  const myPositions = [
    {
      id: "INV-001",
      company: "TechFlow Solutions",
      quantity: 50,
      avgPrice: 0.89,
      currentPrice: 0.92,
      marketValue: 4600,
      unrealizedPL: +150,
      unrealizedPLPercent: +3.4,
    },
    {
      id: "INV-002",
      company: "Green Energy Corp",
      quantity: 25,
      avgPrice: 0.90,
      currentPrice: 0.88,
      marketValue: 2200,
      unrealizedPL: -50,
      unrealizedPLPercent: -2.2,
    },
  ];

  const formatPrice = (price: number) => {
    return price.toFixed(3);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Secondary Trading</h1>
            <p className="text-muted-foreground">
              Trade invoice tokens on the secondary market
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="glow">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Place Order
            </Button>
          </div>
        </div>

        {/* Trading Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tradingStats.map((stat) => (
            <Card key={stat.title} className="gradient-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-success mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                  )}
                  <span className={stat.trend === "up" ? "text-success" : "text-destructive"}>
                    {stat.change}
                  </span>
                  <span className="ml-1">24h</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trading Interface */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Book Component */}
          <div className="lg:col-span-2">
            <OrderBook invoiceId="trading-overview" />
          </div>

          {/* Trading Panel */}
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpDown className="h-5 w-5 mr-2" />
                Quick Trade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="buy">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
                
                <TabsContent value="buy" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Token</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketData.map((token) => (
                          <SelectItem key={token.id} value={token.id}>
                            {token.id} - {token.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Order Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <Input type="number" placeholder="0.000" />
                  </div>
                  
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total Cost:</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between text-sm mb-4">
                      <span>Available:</span>
                      <span className="font-medium">$45,620</span>
                    </div>
                  </div>
                  
                  <Button className="w-full glow">
                    Place Buy Order
                  </Button>
                </TabsContent>
                
                <TabsContent value="sell" className="space-y-4 mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Sell order interface
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* My Positions */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              My Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-7 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                <div>Token</div>
                <div>Quantity</div>
                <div>Avg Price</div>
                <div>Current Price</div>
                <div>Market Value</div>
                <div>Unrealized P&L</div>
                <div>Actions</div>
              </div>
              
              {/* Position Rows */}
              {myPositions.map((position) => (
                <div 
                  key={position.id}
                  className="grid grid-cols-7 gap-4 py-3 hover:bg-muted/20 rounded transition-smooth"
                >
                  <div>
                    <div className="font-medium">{position.id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {position.company}
                    </div>
                  </div>
                  <div className="font-medium">{position.quantity}</div>
                  <div className="font-mono">${formatPrice(position.avgPrice)}</div>
                  <div className="font-mono">${formatPrice(position.currentPrice)}</div>
                  <div className="font-medium">{formatAmount(position.marketValue)}</div>
                  <div className={`flex items-center ${position.unrealizedPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {position.unrealizedPL >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    <div>
                      <div className="text-sm">
                        {position.unrealizedPL >= 0 ? '+' : ''}{formatAmount(position.unrealizedPL)}
                      </div>
                      <div className="text-xs">
                        ({position.unrealizedPLPercent >= 0 ? '+' : ''}{position.unrealizedPLPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      Sell
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Trading;