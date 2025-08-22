import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Building,
  FileText,
  CreditCard,
  RefreshCw
} from "lucide-react";

const PaymentTracker = () => {
  const paymentStats = [
    {
      title: "Pending Payments",
      value: "$247,563",
      count: "8 invoices",
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Received This Month",
      value: "$189,847",
      count: "12 invoices",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Overdue",
      value: "$45,230",
      count: "2 invoices",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "Total Expected",
      value: "$482,640",
      count: "22 invoices",
      icon: DollarSign,
      color: "text-primary",
    },
  ];

  const payments = [
    {
      id: "PAY-001",
      invoiceId: "INV-001",
      company: "TechFlow Solutions",
      amount: 125000,
      dueDate: "2024-03-15",
      status: "Pending",
      daysUntilDue: 14,
      paymentMethod: "Bank Transfer",
      lastUpdate: "2024-02-28 10:30 AM",
    },
    {
      id: "PAY-002",
      invoiceId: "INV-002",
      company: "Green Energy Corp",
      amount: 89500,
      dueDate: "2024-02-25",
      status: "Overdue",
      daysUntilDue: -5,
      paymentMethod: "ACH",
      lastUpdate: "2024-02-25 09:15 AM",
    },
    {
      id: "PAY-003",
      invoiceId: "INV-003",
      company: "RetailMax Inc",
      amount: 67800,
      dueDate: "2024-02-20",
      status: "Paid",
      paidDate: "2024-02-18",
      paymentMethod: "Wire Transfer",
      lastUpdate: "2024-02-18 02:45 PM",
    },
    {
      id: "PAY-004",
      invoiceId: "INV-004",
      company: "MedTech Innovations",
      amount: 156000,
      dueDate: "2024-04-10",
      status: "Pending",
      daysUntilDue: 35,
      paymentMethod: "Bank Transfer",
      lastUpdate: "2024-02-29 11:20 AM",
    },
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-success";
      case "Pending": return "bg-warning";
      case "Overdue": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid": return CheckCircle;
      case "Pending": return Clock;
      case "Overdue": return AlertCircle;
      default: return FileText;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Tracker</h1>
            <p className="text-muted-foreground">
              Real-time tracking of invoice payments and settlements
            </p>
          </div>
          <Button className="glow">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Payments
          </Button>
        </div>

        {/* Payment Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {paymentStats.map((stat) => (
            <Card key={stat.title} className="gradient-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Timeline */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Payment Timeline
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Next 30 days
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.filter(p => p.status !== "Paid").map((payment) => {
                const StatusIcon = getStatusIcon(payment.status);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-background/50"
                  >
                    <div className={`p-2 rounded-full ${getStatusColor(payment.status)}`}>
                      <StatusIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{payment.company}</h3>
                        <span className="text-lg font-semibold">
                          {formatAmount(payment.amount)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.invoiceId} • Due {payment.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.daysUntilDue > 0 
                          ? `${payment.daysUntilDue} days left`
                          : payment.daysUntilDue < 0 
                          ? `${Math.abs(payment.daysUntilDue)} days overdue`
                          : "Due today"
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Payments</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="paid">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="gradient-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <Building className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-lg">{payment.company}</h3>
                          <p className="text-sm text-muted-foreground">
                            {payment.invoiceId} • {payment.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatAmount(payment.amount)}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-medium">{payment.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium">{payment.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Update</p>
                        <p className="font-medium">{payment.lastUpdate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {payment.status === "Paid" ? "Paid Date" : "Days Until Due"}
                        </p>
                        <p className="font-medium">
                          {payment.status === "Paid" 
                            ? payment.paidDate
                            : payment.daysUntilDue > 0 
                            ? `${payment.daysUntilDue} days`
                            : payment.daysUntilDue < 0 
                            ? `${Math.abs(payment.daysUntilDue)} days overdue`
                            : "Due today"
                          }
                        </p>
                      </div>
                    </div>

                    {payment.status === "Pending" && (
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex-1 mr-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Time until due</span>
                            <span>{Math.max(0, payment.daysUntilDue)} days</span>
                          </div>
                          <Progress 
                            value={Math.max(0, Math.min(100, ((30 - payment.daysUntilDue) / 30) * 100))} 
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Send Reminder
                          </Button>
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    )}

                    {payment.status === "Paid" && (
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center space-x-2 text-success">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Payment completed successfully</span>
                        </div>
                        <Button variant="outline" size="sm">
                          View Receipt
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Other tab contents would filter the payments array */}
          <TabsContent value="pending">
            <div className="text-center py-8 text-muted-foreground">
              Pending payments view (filtered data)
            </div>
          </TabsContent>
          <TabsContent value="overdue">
            <div className="text-center py-8 text-muted-foreground">
              Overdue payments view (filtered data)
            </div>
          </TabsContent>
          <TabsContent value="paid">
            <div className="text-center py-8 text-muted-foreground">
              Completed payments view (filtered data)
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PaymentTracker;
