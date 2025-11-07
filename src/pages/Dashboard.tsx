import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CreditScoring from "@/components/features/CreditScoring";
import FinternInteractiveDemo from "@/components/features/FinternInteractiveDemo";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { invoiceAPI, analyticsAPI } from "@/services/api";
import { useInvoiceUpdates } from "@/hooks/useWebSocket";
import {
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  Eye,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

// Mock data for development/fallback
const mockStats = [
  {
    title: "Total Capital Raised",
    value: "$2.4M",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Active Invoices",
    value: "24",
    change: "+6",
    trend: "up",
    icon: FileText,
  },
  {
    title: "Success Rate",
    value: "94%",
    change: "+3.2%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Active Investors",
    value: "156",
    change: "+18",
    trend: "up",
    icon: Users,
  },
];

const mockRecentInvoices = [
  {
    id: "INV-2025-001",
    company: "Tech Solutions Inc.",
    amount: "$250,000",
    status: "Active",
    funded: 65,
    daysLeft: 15,
  },
  {
    id: "INV-2025-002",
    company: "Green Energy Co.",
    amount: "$500,000",
    status: "Active",
    funded: 42,
    daysLeft: 22,
  },
  {
    id: "INV-2025-003",
    company: "Retail Dynamics LLC",
    amount: "$180,000",
    status: "Funded",
    funded: 100,
    daysLeft: 0,
  },
  {
    id: "INV-2025-004",
    company: "Healthcare Partners",
    amount: "$350,000",
    status: "Active",
    funded: 78,
    daysLeft: 12,
  },
  {
    id: "INV-2025-005",
    company: "Manufacturing Pro",
    amount: "$420,000",
    status: "Active",
    funded: 55,
    daysLeft: 18,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Changed to false to show data immediately
  const [stats, setStats] = useState(mockStats);
  const [recentInvoices, setRecentInvoices] = useState(mockRecentInvoices);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(
    null
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Try to fetch analytics data
      try {
        const analyticsResponse = await analyticsAPI.getOverview();
        setAnalytics(analyticsResponse.data);

        // Update stats with real data if available
        if (analyticsResponse.data) {
          setStats([
            {
              title: "Total Capital Raised",
              value: `$${
                analyticsResponse.data.totalCapitalRaised?.toLocaleString() ||
                "0"
              }`,
              change: `+${analyticsResponse.data.capitalGrowth || 0}%`,
              trend: "up",
              icon: DollarSign,
            },
            {
              title: "Active Invoices",
              value: `${analyticsResponse.data.activeInvoices || 0}`,
              change: `+${analyticsResponse.data.newInvoices || 0}`,
              trend: "up",
              icon: FileText,
            },
            {
              title: "Success Rate",
              value: `${analyticsResponse.data.successRate || 0}%`,
              change: `+${analyticsResponse.data.successRateChange || 0}%`,
              trend: "up",
              icon: TrendingUp,
            },
            {
              title: "Active Investors",
              value: `${analyticsResponse.data.activeInvestors || 0}`,
              change: `+${analyticsResponse.data.newInvestors || 0}`,
              trend: "up",
              icon: Users,
            },
          ]);
        }
      } catch (apiError) {
        console.warn("Analytics API failed, using mock data:", apiError);
        // Mock data is already set as default
      }

      // Try to fetch recent invoices
      try {
        const invoicesResponse = await invoiceAPI.getMyInvoices({ limit: 5 });
        if (
          invoicesResponse.data.invoices &&
          invoicesResponse.data.invoices.length > 0
        ) {
          setRecentInvoices(invoicesResponse.data.invoices);
        }
      } catch (apiError) {
        console.warn("Invoices API failed, using mock data:", apiError);
        // Mock data is already set as default
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
          <Button className="glow" onClick={() => navigate("/upload")}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Invoice
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="glass-card hover:highlight-border transition-smooth"
            >
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
                  <span
                    className={
                      stat.trend === "up" ? "text-success" : "text-destructive"
                    }
                  >
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/marketplace")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No invoices yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first invoice to get started
                  </p>
                  <Button onClick={() => navigate("/upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Invoice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-smooth cursor-pointer"
                      onClick={() => navigate(`/investment/${invoice.id}`)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{invoice.id}</span>
                          <Badge
                            variant={
                              invoice.status === "Funded"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              invoice.status === "Funded"
                                ? "bg-success text-success-foreground"
                                : ""
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.company}
                        </p>
                        <p className="text-lg font-semibold">
                          {invoice.amount}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center space-x-2">
                          <Progress value={invoice.funded} className="w-20" />
                          <span className="text-sm">{invoice.funded}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {invoice.daysLeft > 0
                            ? `${invoice.daysLeft} days left`
                            : "Completed"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card hover:highlight-border transition-smooth">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full glow"
                onClick={() => navigate("/upload")}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10"
                onClick={() => navigate("/marketplace")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10"
                onClick={() => navigate("/analytics")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10"
                onClick={() => navigate("/portfolio")}
              >
                <Users className="h-4 w-4 mr-2" />
                Investor Network
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Finternet Interactive Demo */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Global Finternet Network</h2>
            <p className="text-muted-foreground">
              Real-time visualization of decentralized financial infrastructure
              and cross-border tokenized transactions
            </p>
          </div>
          <FinternInteractiveDemo />
        </div>

        {/* Credit Score Component */}
        <CreditScoring showDetails={false} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
