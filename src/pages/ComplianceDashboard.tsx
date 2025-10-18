import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Globe,
  FileText,
  TrendingUp,
  Users,
  Activity,
  Clock,
  ExternalLink,
} from "lucide-react";

interface Jurisdiction {
  code: string;
  name: string;
  status: string;
  lastCheck: string;
  violations: number;
}

interface DashboardData {
  overview: {
    totalJurisdictions: number;
    activeComplianceChecks: number;
    pendingReports: number;
    lastUpdated: string;
  };
  jurisdictions: Jurisdiction[];
  recentViolations: any[];
  upcomingReports: any[];
}

const ComplianceDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] =
    useState<string>("US");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/compliance/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getViolationSeverity = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Compliance Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Multi-jurisdiction regulatory compliance monitoring and reporting
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Live Monitoring</span>
          </Badge>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Jurisdictions
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.overview.totalJurisdictions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-jurisdiction coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Checks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.overview.activeComplianceChecks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time compliance monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.overview.pendingReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Regulatory reporting queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {dashboardData?.overview.lastUpdated
                ? new Date(
                    dashboardData.overview.lastUpdated
                  ).toLocaleTimeString()
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Real-time updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="jurisdictions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Jurisdictions Tab */}
        <TabsContent value="jurisdictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jurisdiction Status</CardTitle>
              <CardDescription>
                Real-time compliance status across all supported jurisdictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData?.jurisdictions.map((jurisdiction) => (
                  <Card key={jurisdiction.code} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{jurisdiction.name}</h3>
                      <Badge className={getStatusColor(jurisdiction.status)}>
                        {jurisdiction.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Code:</span>
                        <span className="font-mono">{jurisdiction.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Violations:</span>
                        <span
                          className={
                            jurisdiction.violations > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {jurisdiction.violations}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Check:</span>
                        <span>
                          {new Date(jurisdiction.lastCheck).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setSelectedJurisdiction(jurisdiction.code)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Violations</CardTitle>
              <CardDescription>
                Recent compliance violations and their resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentViolations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Violations
                    </h3>
                    <p className="text-gray-600">
                      All compliance checks are passing
                    </p>
                  </div>
                ) : (
                  dashboardData?.recentViolations.map((violation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{violation.type}</h4>
                        <Badge
                          className={getViolationSeverity(violation.severity)}
                        >
                          {violation.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {violation.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Jurisdiction: {violation.jurisdiction}</span>
                        <span>
                          {new Date(violation.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Reports</CardTitle>
              <CardDescription>
                Generate and submit compliance reports to regulatory authorities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-6 w-6" />
                    <span>Generate Report</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <ExternalLink className="h-6 w-6" />
                    <span>Submit Report</span>
                  </Button>
                </div>

                {dashboardData?.upcomingReports.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Upcoming Reports
                    </h3>
                    <p className="text-gray-600">
                      All regulatory reports are up to date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Upcoming Reports</h4>
                    {dashboardData?.upcomingReports.map((report, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{report.name}</span>
                          <span className="text-sm text-gray-500">
                            {report.dueDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Analytics</CardTitle>
              <CardDescription>
                Compliance trends and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-gray-600">
                  Advanced compliance analytics and reporting features will be
                  available soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceDashboard;
