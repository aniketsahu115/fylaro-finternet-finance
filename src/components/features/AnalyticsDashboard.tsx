import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Target,
  Globe,
  Clock,
  PieChart,
  Activity,
  Download,
  RefreshCw
} from "lucide-react";

const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [category, setCategory] = useState('overview');

  const overviewStats = [
    {
      title: "Total Volume",
      value: "$12.7M",
      change: "+18.2%",
      trend: "up",
      icon: DollarSign,
      description: "Total transaction volume"
    },
    {
      title: "Active Users",
      value: "2,847",
      change: "+24.5%",
      trend: "up",
      icon: Users,
      description: "Monthly active users"
    },
    {
      title: "Invoices Processed",
      value: "1,432",
      change: "+12.8%",
      trend: "up",
      icon: FileText,
      description: "Successfully processed invoices"
    },
    {
      title: "Success Rate",
      value: "97.3%",
      change: "+2.1%",
      trend: "up",
      icon: Target,
      description: "Payment success rate"
    }
  ];

  const performanceMetrics = [
    {
      category: "Invoice Volume",
      current: "$4.2M",
      previous: "$3.8M",
      change: "+10.5%",
      trend: "up"
    },
    {
      category: "Average Processing Time",
      current: "2.4 hrs",
      previous: "2.8 hrs",
      change: "-14.3%",
      trend: "up"
    },
    {
      category: "User Acquisition",
      current: "342",
      previous: "298",
      change: "+14.8%",
      trend: "up"
    },
    {
      category: "Revenue",
      current: "$128K",
      previous: "$115K",
      change: "+11.3%",
      trend: "up"
    }
  ];

  const geographicData = [
    { region: "North America", percentage: 45, volume: "$5.7M", color: "bg-primary" },
    { region: "Europe", percentage: 32, volume: "$4.1M", color: "bg-success" },
    { region: "Asia Pacific", percentage: 18, volume: "$2.3M", color: "bg-warning" },
    { region: "Other", percentage: 5, volume: "$0.6M", color: "bg-muted" }
  ];

  const industryBreakdown = [
    { industry: "Technology", share: 28, growth: "+15.2%" },
    { industry: "Healthcare", share: 22, growth: "+8.7%" },
    { industry: "Manufacturing", share: 19, growth: "+12.1%" },
    { industry: "Retail", share: 16, growth: "+5.3%" },
    { industry: "Energy", share: 10, growth: "+18.9%" },
    { industry: "Other", share: 5, growth: "+2.4%" }
  ];

  const recentActivity = [
    {
      timestamp: "2024-02-29 14:30",
      event: "Large invoice processed",
      amount: "$125,000",
      status: "completed"
    },
    {
      timestamp: "2024-02-29 13:45",
      event: "New investor joined",
      amount: "$50,000 portfolio",
      status: "active"
    },
    {
      timestamp: "2024-02-29 12:20",
      event: "Payment received",
      amount: "$89,500",
      status: "completed"
    },
    {
      timestamp: "2024-02-29 11:15",
      event: "Risk assessment completed",
      amount: "High confidence",
      status: "verified"
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-success" : "text-destructive";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-success/10 text-success border-success/30",
      active: "bg-primary/10 text-primary border-primary/30",
      verified: "bg-warning/10 text-warning border-warning/30",
      pending: "bg-muted/10 text-muted-foreground border-muted/30"
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="glow">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <Card key={stat.title} className="gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <div className={`flex items-center mr-2 ${getTrendColor(stat.trend)}`}>
                  {getTrendIcon(stat.trend)}
                  <span className="ml-1">{stat.change}</span>
                </div>
                <span>vs last period</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="industry">Industry</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Performance Chart Placeholder */}
            <Card className="gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Volume Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Volume trend chart</p>
                    <p className="text-sm">(Chart integration pending)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Key Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <p className="font-medium">{metric.category}</p>
                        <p className="text-sm text-muted-foreground">
                          Previous: {metric.previous}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{metric.current}</p>
                        <div className={`flex items-center text-sm ${getTrendColor(metric.trend)}`}>
                          {getTrendIcon(metric.trend)}
                          <span className="ml-1">{metric.change}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {geographicData.map((region, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{region.region}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold">{region.percentage}%</span>
                          <p className="text-xs text-muted-foreground">{region.volume}</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${region.color}`}
                          style={{ width: `${region.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Regional Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Geographic pie chart</p>
                    <p className="text-sm">(Chart integration pending)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="industry" className="space-y-6">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle>Industry Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {industryBreakdown.map((industry, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="font-medium">{industry.industry}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold">{industry.share}%</span>
                      <Badge variant="outline" className="text-success">
                        {industry.growth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium">{activity.event}</p>
                        <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{activity.amount}</p>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;