import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Building2,
  DollarSign,
  BarChart3
} from "lucide-react";

interface CreditScoringProps {
  companyId?: string;
  showDetails?: boolean;
}

const CreditScoring = ({ companyId, showDetails = true }: CreditScoringProps) => {
  const creditData = {
    overallScore: 785,
    riskLevel: "Low",
    factors: [
      {
        category: "Payment History",
        score: 92,
        weight: 35,
        trend: "up",
        details: "100% on-time payments in last 12 months"
      },
      {
        category: "Financial Stability", 
        score: 88,
        weight: 30,
        trend: "up",
        details: "Strong cash flow and revenue growth"
      },
      {
        category: "Business Age",
        score: 75,
        weight: 15,
        trend: "stable",
        details: "5+ years in business with consistent operations"
      },
      {
        category: "Industry Risk",
        score: 82,
        weight: 20,
        trend: "up",
        details: "Technology sector with moderate risk profile"
      }
    ],
    verificationStatus: {
      kyb: true,
      financials: true,
      references: true,
      legal: false
    },
    recentActivity: [
      { date: "2024-02-28", action: "Payment completed", impact: "+2 points" },
      { date: "2024-02-25", action: "Financial statement verified", impact: "+5 points" },
      { date: "2024-02-20", action: "New invoice submitted", impact: "Neutral" }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      "Low": "bg-success/10 text-success border-success/30",
      "Medium": "bg-warning/10 text-warning border-warning/30", 
      "High": "bg-destructive/10 text-destructive border-destructive/30"
    };
    return colors[risk as keyof typeof colors] || "bg-muted";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="gradient-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Credit Score</h3>
                <p className="text-muted-foreground">AI-powered risk assessment</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary mb-2">
                {creditData.overallScore}
              </div>
              <Badge className={getRiskBadge(creditData.riskLevel)}>
                {creditData.riskLevel} Risk
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold mb-3">Score Breakdown</h4>
              {creditData.factors.map((factor) => (
                <div key={factor.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{factor.category}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${getScoreColor(factor.score)}`}>
                        {factor.score}/100
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({factor.weight}% weight)
                      </span>
                    </div>
                  </div>
                  <Progress value={factor.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">{factor.details}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold mb-3">Verification Status</h4>
              <div className="space-y-3">
                {Object.entries(creditData.verificationStatus).map(([key, verified]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key.toUpperCase()}</span>
                    {verified ? (
                      <div className="flex items-center space-x-1 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">Pending</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetails && (
        <>
          {/* Recent Activity */}
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Score Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creditData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="glow">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Full Report
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Score History
            </Button>
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Company Profile
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CreditScoring;