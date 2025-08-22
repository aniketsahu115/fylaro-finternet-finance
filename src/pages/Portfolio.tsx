import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Eye,
  Download
} from "lucide-react";

const Portfolio = () => {
  const portfolioStats = [
    {
      title: "Total Invested",
      value: "$847,563",
      change: "+15.2%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Active Investments",
      value: "23",
      change: "+3",
      trend: "up",
      icon: FileText,
    },
    {
      title: "Total Returns",
      value: "$92,847",
      change: "+8.7%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Avg. ROI",
      value: "11.2%",
      change: "+0.8%",
      trend: "up",
      icon: Target,
    },
  ];

  const activeInvestments = [
    {
      id: "INV-001",
      company: "TechFlow Solutions",
      amount: 50000,
      invested: 25000,
      currentValue: 27500,
      roi: 10.0,
      status: "Active",
      daysLeft: 14,
      riskLevel: "Low",
    },
    {
      id: "INV-002",
      company: "Green Energy Corp",
      amount: 89500,
      invested: 15000,
      currentValue: 16800,
      roi: 12.0,
      status: "Active",
      daysLeft: 21,
      riskLevel: "Medium",
    },
    {
      id: "INV-003",
      company: "MedTech Innovations",
      amount: 156000,
      invested: 30000,
      currentValue: 31200,
      roi: 4.0,
      status: "Active",
      daysLeft: 28,
      riskLevel: "Low",
    },
  ];

  const completedInvestments = [
    {
      id: "INV-C01",
      company: "RetailMax Inc",
      invested: 20000,
      finalValue: 22400,
      roi: 12.0,
      completedDate: "2024-01-15",
      duration: "45 days",
    },
    {
      id: "INV-C02",
      company: "BuildCo Ltd",
      invested: 35000,
      finalValue: 37800,
      roi: 8.0,
      completedDate: "2024-01-08",
      duration: "30 days",
    },
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-success";
      case "Medium": return "text-warning";
      case "High": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Investment Portfolio</h1>
            <p className="text-muted-foreground">
              Track your invoice investments and returns
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="glow">
              <Eye className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {portfolioStats.map((stat) => (
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
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Portfolio Breakdown */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart Placeholder */}
          <Card className="lg:col-span-2 gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Portfolio Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Portfolio performance chart</p>
                  <p className="text-sm">(Chart integration pending)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocation */}
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Technology</span>
                  <span className="text-sm font-medium">35%</span>
                </div>
                <Progress value={35} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Healthcare</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <Progress value={25} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Energy</span>
                  <span className="text-sm font-medium">20%</span>
                </div>
                <Progress value={20} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Retail</span>
                  <span className="text-sm font-medium">20%</span>
                </div>
                <Progress value={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Investments</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {activeInvestments.map((investment) => (
                <Card key={investment.id} className="gradient-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{investment.company}</h3>
                        <p className="text-sm text-muted-foreground">{investment.id}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="secondary"
                          className={getRiskColor(investment.riskLevel)}
                        >
                          {investment.riskLevel} Risk
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Invested</p>
                        <p className="font-semibold">{formatAmount(investment.invested)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="font-semibold text-success">
                          {formatAmount(investment.currentValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ROI</p>
                        <p className="font-semibold text-success">+{investment.roi}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Days Left</p>
                        <p className="font-semibold">{investment.daysLeft}d</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant="default">{investment.status}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round((investment.invested / investment.amount) * 100)}%</span>
                        </div>
                        <Progress value={(investment.invested / investment.amount) * 100} />
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4">
              {completedInvestments.map((investment) => (
                <Card key={investment.id} className="gradient-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{investment.company}</h3>
                        <p className="text-sm text-muted-foreground">{investment.id}</p>
                      </div>
                      <Badge className="bg-success">Completed</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Invested</p>
                        <p className="font-semibold">{formatAmount(investment.invested)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Final Value</p>
                        <p className="font-semibold text-success">
                          {formatAmount(investment.finalValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total ROI</p>
                        <p className="font-semibold text-success">+{investment.roi}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">{investment.duration}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Portfolio;