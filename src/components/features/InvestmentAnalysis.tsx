import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Target,
  Users
} from "lucide-react";

interface InvestmentAnalysisProps {
  invoiceId: string;
  companyName: string;
}

const InvestmentAnalysis = ({ invoiceId, companyName }: InvestmentAnalysisProps) => {
  const analysisData = {
    riskAssessment: {
      overallRisk: "Low",
      riskScore: 85,
      factors: [
        { name: "Debtor Credit Rating", risk: "Low", score: 92 },
        { name: "Invoice Age", risk: "Low", score: 88 },
        { name: "Industry Volatility", risk: "Medium", score: 75 },
        { name: "Payment History", risk: "Low", score: 95 }
      ]
    },
    financialMetrics: {
      invoiceAmount: 125000,
      discountRate: 8.5,
      expectedReturn: 10625,
      roi: 8.5,
      paymentTerm: 45,
      currentFunding: 65,
      minInvestment: 1000
    },
    dueDiligence: {
      documentVerification: true,
      debtorVerification: true,
      creditCheck: true,
      legalReview: false,
      complianceCheck: true
    },
    marketComparison: [
      { metric: "Discount Rate", value: "8.5%", benchmark: "7.2%", performance: "higher" },
      { metric: "ROI", value: "8.5%", benchmark: "6.8%", performance: "higher" },
      { metric: "Payment Term", value: "45 days", benchmark: "52 days", performance: "better" },
      { metric: "Risk Score", value: "85/100", benchmark: "78/100", performance: "better" }
    ],
    investorPool: {
      totalInvestors: 12,
      avgInvestment: 8750,
      institutionalRatio: 0.4,
      retailRatio: 0.6
    }
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      "Low": "text-success",
      "Medium": "text-warning",
      "High": "text-destructive"
    };
    return colors[risk as keyof typeof colors] || "text-muted-foreground";
  };

  const getPerformanceIcon = (performance: string) => {
    if (performance === "higher" || performance === "better") {
      return <TrendingUp className="h-3 w-3 text-success" />;
    }
    return <AlertTriangle className="h-3 w-3 text-warning" />;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investment Analysis</h2>
          <p className="text-muted-foreground">
            {invoiceId} • {companyName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${getRiskColor(analysisData.riskAssessment.overallRisk)}`}>
            {analysisData.riskAssessment.overallRisk} Risk
          </Badge>
          <Badge variant="outline">
            {analysisData.financialMetrics.roi}% ROI
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Invoice Value</span>
            </div>
            <p className="text-xl font-bold">{formatAmount(analysisData.financialMetrics.invoiceAmount)}</p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Expected ROI</span>
            </div>
            <p className="text-xl font-bold text-success">{analysisData.financialMetrics.roi}%</p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">Payment Term</span>
            </div>
            <p className="text-xl font-bold">{analysisData.financialMetrics.paymentTerm} days</p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Investors</span>
            </div>
            <p className="text-xl font-bold">{analysisData.investorPool.totalInvestors}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="diligence">Due Diligence</TabsTrigger>
          <TabsTrigger value="market">Market Data</TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="space-y-4">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium">Overall Risk Score</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {analysisData.riskAssessment.riskScore}/100
                    </div>
                    <Badge className={getRiskColor(analysisData.riskAssessment.overallRisk)}>
                      {analysisData.riskAssessment.overallRisk} Risk
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  {analysisData.riskAssessment.factors.map((factor, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{factor.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getRiskColor(factor.risk)}>
                            {factor.risk}
                          </Badge>
                          <span className="text-sm font-bold">{factor.score}/100</span>
                        </div>
                      </div>
                      <Progress value={factor.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gradient-card border-border">
              <CardHeader>
                <CardTitle>Investment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Invoice Amount:</span>
                  <span className="font-bold">{formatAmount(analysisData.financialMetrics.invoiceAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount Rate:</span>
                  <span className="font-bold">{analysisData.financialMetrics.discountRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Return:</span>
                  <span className="font-bold text-success">
                    {formatAmount(analysisData.financialMetrics.expectedReturn)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ROI:</span>
                  <span className="font-bold text-success">{analysisData.financialMetrics.roi}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum Investment:</span>
                  <span className="font-bold">{formatAmount(analysisData.financialMetrics.minInvestment)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border">
              <CardHeader>
                <CardTitle>Funding Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Funding</span>
                    <span>{analysisData.financialMetrics.currentFunding}%</span>
                  </div>
                  <Progress value={analysisData.financialMetrics.currentFunding} />
                </div>
                <div className="text-center pt-4">
                  <p className="text-2xl font-bold">
                    {formatAmount((analysisData.financialMetrics.currentFunding / 100) * analysisData.financialMetrics.invoiceAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of {formatAmount(analysisData.financialMetrics.invoiceAmount)} raised
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diligence" className="space-y-4">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Due Diligence Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analysisData.dueDiligence).map(([key, completed]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span className="capitalize font-medium">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {completed ? (
                      <div className="flex items-center space-x-2 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Market Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.marketComparison.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span className="font-medium">{item.metric}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold">{item.value}</p>
                        <p className="text-xs text-muted-foreground">vs {item.benchmark}</p>
                      </div>
                      {getPerformanceIcon(item.performance)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Investment Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="glow">
          <DollarSign className="h-4 w-4 mr-2" />
          Invest Now
        </Button>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Compare Similar
        </Button>
      </div>
    </div>
  );
};

export default InvestmentAnalysis;