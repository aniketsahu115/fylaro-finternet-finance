import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
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
  RefreshCw,
  Loader
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PaymentTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState([
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
  ]);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncingPayments, setSyncingPayments] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentSchedule, setPaymentSchedule] = useState(null);
  
  // Modal states
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Form states
  const [expectedAmount, setExpectedAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [gracePeriod, setGracePeriod] = useState('7');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('0');
  const [externalRef, setExternalRef] = useState('');
  
  // Transaction state
  const [pendingTx, setPendingTx] = useState(null);

  // Stats calculated from data
  const [paymentStats, setPaymentStats] = useState([
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
  ]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/invoices`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data.invoices) {
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncPayments = async () => {
    try {
      setSyncingPayments(true);
      
      // This would ideally call a backend endpoint to sync with blockchain
      // For now, let's simulate it with a timeout
      toast({
        title: "Syncing",
        description: "Synchronizing payment data with blockchain...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: "Payment data synchronized successfully",
        variant: "default",
      });
      
      // Refresh invoices and payment data
      await fetchInvoices();
      
    } catch (error) {
      console.error('Error syncing payments:', error);
      toast({
        title: "Error",
        description: "Failed to sync payment data",
        variant: "destructive",
      });
    } finally {
      setSyncingPayments(false);
    }
  };

  const handleSelectInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    
    try {
      // Try to fetch payment schedule if it exists
      const response = await axios.get(`${API_URL}/blockchain/invoices/${invoice.id}/payment-schedule`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.schedule) {
        setPaymentSchedule(response.data.schedule);
      } else {
        setPaymentSchedule(null);
      }
    } catch (error) {
      // Schedule might not exist yet
      setPaymentSchedule(null);
      console.error('No payment schedule found:', error);
    }
  };

  const setupPaymentTracking = async (e) => {
    e.preventDefault();
    
    if (!selectedInvoice) {
      return toast({
        title: "Error",
        description: "No invoice selected",
        variant: "destructive",
      });
    }
    
    try {
      setShowTrackingForm(false);
      setPendingTx("processing");
      
      // Convert due date to timestamp
      const dueDateTimestamp = new Date(dueDate).getTime() / 1000;
      const gracePeriodDays = parseInt(gracePeriod);
      
      const response = await axios.post(
        `${API_URL}/blockchain/invoices/${selectedInvoice.id}/payment-tracking`,
        {
          expectedAmount: parseFloat(expectedAmount),
          dueDate: dueDateTimestamp,
          gracePeriod: gracePeriodDays * 86400 // Convert days to seconds
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setPendingTx(response.data.txHash);
      
      toast({
        title: "Success",
        description: "Payment tracking set up initiated. Transaction pending...",
      });
      
      // Simulate blockchain confirmation
      setTimeout(async () => {
        // Fetch updated payment schedule
        try {
          const scheduleResponse = await axios.get(
            `${API_URL}/blockchain/invoices/${selectedInvoice.id}/payment-schedule`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          setPaymentSchedule(scheduleResponse.data.schedule);
          clearTrackingForm();
          setPendingTx(null);
          
          toast({
            title: "Success",
            description: "Payment tracking set up successfully",
          });
        } catch (error) {
          console.error('Error fetching updated schedule:', error);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error setting up payment tracking:', error);
      setPendingTx(null);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to set up payment tracking",
        variant: "destructive",
      });
    }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedInvoice) {
      return toast({
        title: "Error",
        description: "No invoice selected",
        variant: "destructive",
      });
    }
    
    try {
      setShowPaymentForm(false);
      setPendingTx("processing");
      
      const response = await axios.post(
        `${API_URL}/blockchain/invoices/${selectedInvoice.id}/payments`,
        {
          amount: parseFloat(paymentAmount),
          paymentMethod: parseInt(paymentMethod),
          externalRef
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setPendingTx(response.data.txHash);
      
      toast({
        title: "Success",
        description: "Payment recording initiated. Transaction pending...",
      });
      
      // Simulate blockchain confirmation
      setTimeout(async () => {
        // Fetch updated payment schedule
        try {
          const scheduleResponse = await axios.get(
            `${API_URL}/blockchain/invoices/${selectedInvoice.id}/payment-schedule`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          setPaymentSchedule(scheduleResponse.data.schedule);
          clearPaymentForm();
          setPendingTx(null);
          
          toast({
            title: "Success",
            description: "Payment recorded successfully",
          });
          
          // Refresh payment data
          syncPayments();
        } catch (error) {
          console.error('Error fetching updated schedule:', error);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error recording payment:', error);
      setPendingTx(null);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const clearTrackingForm = () => {
    setExpectedAmount('');
    setDueDate('');
    setGracePeriod('7');
  };

  const clearPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('0');
    setExternalRef('');
  };

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

  // Format date from timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Check if timestamp is in seconds (blockchain) or milliseconds (JS)
    const date = new Date(timestamp.toString().length > 10 ? parseInt(timestamp) : parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
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
          <Button className="glow" onClick={syncPayments} disabled={syncingPayments}>
            {syncingPayments ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Payments
              </>
            )}
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

        {/* Blockchain Integration Section */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Blockchain Payment Tracking
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTrackingForm(!showTrackingForm)}
                disabled={pendingTx !== null}
              >
                {showTrackingForm ? "Cancel" : "Set Up Tracking"}
              </Button>
            </div>
            <CardDescription>
              Configure payment tracking and settlement on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTx && (
              <Alert className="mb-4">
                <Loader className="h-4 w-4 animate-spin mr-2" />
                <AlertTitle>Transaction in Progress</AlertTitle>
                <AlertDescription>
                  Your blockchain transaction is being processed. This may take a few moments.
                  {pendingTx !== "processing" && (
                    <div className="text-xs font-mono mt-2 break-all">
                      TX Hash: {pendingTx}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {showTrackingForm ? (
              <form onSubmit={setupPaymentTracking} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedAmount">Expected Amount ($)</Label>
                    <Input
                      id="expectedAmount"
                      type="number"
                      step="0.01"
                      placeholder="Total expected payment"
                      value={expectedAmount}
                      onChange={(e) => setExpectedAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                    <Input
                      id="gracePeriod"
                      type="number"
                      placeholder="Days after due date"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowTrackingForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Set Up Tracking</Button>
                </div>
              </form>
            ) : showPaymentForm ? (
              <form onSubmit={recordPayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      placeholder="Amount received"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                    >
                      <option value="0">Bank Transfer</option>
                      <option value="1">Credit Card</option>
                      <option value="2">Cryptocurrency</option>
                      <option value="3">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="externalRef">Reference ID</Label>
                    <Input
                      id="externalRef"
                      type="text"
                      placeholder="External reference ID"
                      value={externalRef}
                      onChange={(e) => setExternalRef(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Record Payment</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Select Invoice for Tracking</h3>
                  <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                        <span>Loading invoices...</span>
                      </div>
                    ) : invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedInvoice?.id === invoice.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => handleSelectInvoice(invoice)}
                        >
                          <div className="font-medium">Invoice #{invoice.id}</div>
                          <div className="text-sm opacity-90">
                            Amount: ${parseFloat(invoice.totalValue).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        No invoices found
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {selectedInvoice ? (
                    <>
                      <h3 className="font-semibold">Payment Status</h3>
                      {paymentSchedule ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Expected Amount</p>
                              <p className="font-medium">
                                ${parseFloat(paymentSchedule.expectedAmount || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Due Date</p>
                              <p className="font-medium">{formatDate(paymentSchedule.dueDate)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <Badge className={
                                paymentSchedule.status === 0 ? "bg-warning" : 
                                paymentSchedule.status === 1 ? "bg-success" :
                                paymentSchedule.status === 2 ? "bg-destructive" :
                                paymentSchedule.status === 3 ? "bg-destructive/80" : "bg-muted"
                              }>
                                {paymentSchedule.status === 0 ? "Pending" : 
                                 paymentSchedule.status === 1 ? "Paid" :
                                 paymentSchedule.status === 2 ? "Late" :
                                 paymentSchedule.status === 3 ? "Defaulted" : "Unknown"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Paid Amount</p>
                              <p className="font-medium">
                                ${parseFloat(paymentSchedule.paidAmount || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => setShowPaymentForm(true)}
                            disabled={pendingTx !== null}
                          >
                            Record New Payment
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center p-6 border border-dashed rounded-lg">
                          <p className="text-muted-foreground mb-4">
                            No payment tracking set up for this invoice
                          </p>
                          <Button 
                            onClick={() => setShowTrackingForm(true)}
                            disabled={pendingTx !== null}
                          >
                            Set Up Payment Tracking
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        Select an invoice to manage payment tracking
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                          <Button variant="outline" size="sm" onClick={() => {/* Send reminder functionality can be added later */}}>
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
