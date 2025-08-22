import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InvestmentAnalysis from "@/components/features/InvestmentAnalysis";
import OrderBook from "@/components/features/OrderBook";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  FileText,
  Shield,
  Target,
  BarChart3
} from "lucide-react";

const InvestmentDetails = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [investmentAmount, setInvestmentAmount] = useState<string>("");

  // Mock invoice data - in real app this would come from API
  const invoiceData = {
    id: invoiceId || "INV-001",
    companyName: "TechFlow Solutions",
    amount: 125000,
    discountRate: 8.5,
    paymentTerm: 45,
    dueDate: "2024-04-15",
    industry: "Technology",
    riskLevel: "Low",
    creditScore: 785,
    currentFunding: 68,
    minInvestment: 1000,
    maxInvestment: 25000,
    totalInvestors: 12,
    description: "Invoice for software development services provided to Fortune 500 client. Backed by established contract with verified payment history.",
    debtor: {
      name: "Global Tech Corp",
      rating: "A+",
      paymentHistory: "100% on-time",
      industry: "Enterprise Software"
    }
  };

  const quickStats = [
    {
      label: "Invoice Amount",
      value: `$${invoiceData.amount.toLocaleString()}`,
      icon: DollarSign
    },
    {
      label: "Expected ROI",
      value: `${invoiceData.discountRate}%`,
      icon: TrendingUp
    },
    {
      label: "Payment Term",
      value: `${invoiceData.paymentTerm} days`,
      icon: Clock
    },
    {
      label: "Investors",
      value: invoiceData.totalInvestors,
      icon: Users
    }
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateReturn = () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount)) return 0;
    return (amount * invoiceData.discountRate) / 100;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{invoiceData.id}</h1>
              <p className="text-muted-foreground">
                {invoiceData.companyName} • {invoiceData.industry}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-success/10 text-success border-success/30">
              {invoiceData.riskLevel} Risk
            </Badge>
            <Badge variant="outline">
              {invoiceData.discountRate}% ROI
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="gradient-card border-border">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Investment Panel */}
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Make Investment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Funding Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Funding Progress</span>
                  <span>{invoiceData.currentFunding}%</span>
                </div>
                <Progress value={invoiceData.currentFunding} />
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatAmount((invoiceData.currentFunding / 100) * invoiceData.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of {formatAmount(invoiceData.amount)} raised
                  </p>
                </div>
              </div>

              {/* Investment Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Investment Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="0"
                      min={invoiceData.minInvestment}
                      max={invoiceData.maxInvestment}
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: {formatAmount(invoiceData.minInvestment)} • Max: {formatAmount(invoiceData.maxInvestment)}
                  </p>
                </div>

                {investmentAmount && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Expected Return:</span>
                      <span className="font-bold text-success">
                        {formatAmount(calculateReturn())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ROI:</span>
                      <span className="font-bold">{invoiceData.discountRate}%</span>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full glow" 
                  disabled={!investmentAmount || parseFloat(investmentAmount) < invoiceData.minInvestment}
                >
                  Invest Now
                </Button>

                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Documents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="analysis" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="trading">Trading</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis">
                <InvestmentAnalysis 
                  invoiceId={invoiceData.id}
                  companyName={invoiceData.companyName}
                />
              </TabsContent>

              <TabsContent value="trading">
                <OrderBook invoiceId={invoiceData.id} />
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Card className="gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Issuer</p>
                        <p className="font-medium">{invoiceData.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Debtor</p>
                        <p className="font-medium">{invoiceData.debtor.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-medium">{invoiceData.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Credit Rating</p>
                        <p className="font-medium">{invoiceData.debtor.rating}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-sm">{invoiceData.description}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gradient-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Overall Risk</span>
                        <Badge className="bg-success/10 text-success border-success/30">
                          {invoiceData.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Credit Score</span>
                        <span className="font-bold">{invoiceData.creditScore}/1000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Payment History</span>
                        <span className="font-medium">{invoiceData.debtor.paymentHistory}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvestmentDetails;