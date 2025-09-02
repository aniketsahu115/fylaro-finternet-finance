import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Users, FileText } from "lucide-react";

const AnalyticsDashboard = () => {
  const overviewStats = [
    {
      title: "Total Volume",
      value: "$12.7M",
      change: "+18.2%",
      icon: DollarSign,
    },
    {
      title: "Active Users",
      value: "2,847",
      change: "+24.5%",
      icon: Users,
    },
    {
      title: "Invoices Processed",
      value: "1,432",
      change: "+12.8%",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {overviewStats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-success">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analytics dashboard is working properly. All components are
            rendering correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
