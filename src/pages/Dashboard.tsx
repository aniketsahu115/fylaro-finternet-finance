import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CreditScoring from "@/components/features/CreditScoring";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  Eye,
  MoreHorizontal
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const stats = [
    {
      title: "Total Capital Raised",
      value: "$2,847,563",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Active Invoices",
      value: "23",
      change: "+3",
      trend: "up", 
      icon: FileText,
    },
    {
      title: "Success Rate",
      value: "94.7%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Active Investors",
      value: "156",
      change: "+8",
      trend: "up",
      icon: Users,
    },
  ];

  const recentInvoices = [
    {
      id: "INV-001",
      company: "TechCorp Ltd",
      amount: "$125,000",
      status: "Active",
      funded: 85,
      daysLeft: 12,
    },
    {
      id: "INV-002", 
      company: "BuildCo Inc",
      amount: "$89,500",
      status: "Funded",
      funded: 100,
      daysLeft: 0,
    },
    {
      id: "INV-003",
      company: "RetailMax",
      amount: "$67,800",
      status: "Active",
      funded: 42,
      daysLeft: 18,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your invoice financing overview.
            </p>
          </div>
          <Button className="glow" onClick={() => navigate('/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Invoice
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="glass-card hover:highlight-border transition-smooth">
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
                    <ArrowUpRight className="h-4 w-4 text-success mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
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

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Invoices */}
          <Card className="lg:col-span-2 glass-card hover:highlight-border transition-smooth">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Invoices</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-smooth"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{invoice.id}</span>
                        <Badge 
                          variant={invoice.status === "Funded" ? "default" : "secondary"}
                          className={invoice.status === "Funded" ? "bg-success text-success-foreground" : ""}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.company}</p>
                      <p className="text-lg font-semibold">{invoice.amount}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-2">
                        <Progress value={invoice.funded} className="w-20" />
                        <span className="text-sm">{invoice.funded}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {invoice.daysLeft > 0 ? `${invoice.daysLeft} days left` : "Completed"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card hover:highlight-border transition-smooth">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full glow" onClick={() => navigate('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Invoice
              </Button>
              <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10" onClick={() => navigate('/marketplace')}>
                <Eye className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
              <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10" onClick={() => navigate('/analytics')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10" onClick={() => navigate('/portfolio')}>
                <Users className="h-4 w-4 mr-2" />
                Investor Network
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Credit Score Component */}
        <CreditScoring showDetails={false} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;