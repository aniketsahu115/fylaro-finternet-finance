import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InvestmentAnalysis from "@/components/features/InvestmentAnalysis";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { marketplaceAPI } from "@/services/api";
import { useTradingUpdates } from "@/hooks/useWebSocket";
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  Shield,
  Target,
  Loader2,
} from "lucide-react";

const Marketplace = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    industry: "",
    riskLevel: "",
    minAmount: "",
    maxAmount: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  });

  // Real-time updates
  const { orderBook, recentTrades, marketStats } = useTradingUpdates();

  useEffect(() => {
    fetchListings();
  }, [filters, pagination.page]);

  const fetchListings = async () => {
    try {
      if (pagination.page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await marketplaceAPI.getListings(params);
      const newListings = response.data.listings || [];

      if (pagination.page === 1) {
        setListings(newListings);
      } else {
        setListings((prev) => [...prev, ...newListings]);
      }

      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        hasMore: newListings.length === pagination.limit,
      }));
    } catch (error) {
      console.error("Failed to fetch listings:", error);
      toast({
        title: "Error",
        description: "Failed to load marketplace listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pagination.hasMore || isLoadingMore) return;

    setPagination((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-success";
      case "Medium":
        return "text-warning";
      case "High":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoice Marketplace</h1>
            <p className="text-muted-foreground">
              Discover investment opportunities in verified invoices
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {invoiceListings.length} Active Listings
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company or invoice ID..."
                    className="pl-10 bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount-desc">
                    Amount (High to Low)
                  </SelectItem>
                  <SelectItem value="amount-asc">
                    Amount (Low to High)
                  </SelectItem>
                  <SelectItem value="return-desc">
                    Return (High to Low)
                  </SelectItem>
                  <SelectItem value="credit-desc">Credit Score</SelectItem>
                  <SelectItem value="time-asc">Time Remaining</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
                onClick={() => {
                  /* Filter functionality can be added later */
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Listings */}
        <div className="grid gap-6 lg:grid-cols-2">
          {invoiceListings.map((invoice) => (
            <Card
              key={invoice.id}
              className="glass-card hover:highlight-border transition-smooth group"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">
                        {invoice.company}
                      </CardTitle>
                      {invoice.verified && (
                        <Shield className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{invoice.id}</span>
                      <span>•</span>
                      <span>{invoice.industry}</span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${getRiskColor(
                      invoice.riskLevel
                    )} bg-secondary/50`}
                  >
                    {invoice.riskLevel} Risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount and Return */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatAmount(invoice.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invoice Amount
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-success">
                      {invoice.expectedReturn}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expected Return
                    </p>
                  </div>
                </div>

                {/* Funding Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Funding Progress</span>
                    <span>{invoice.funded}%</span>
                  </div>
                  <Progress value={invoice.funded} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatAmount((invoice.amount * invoice.funded) / 100)}{" "}
                      raised
                    </span>
                    <span>{invoice.daysLeft} days left</span>
                  </div>
                </div>

                {/* Credit Score and Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-semibold">
                        {invoice.creditScore}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Credit Score
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{invoice.daysLeft}d</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Time Left</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-semibold">
                        {invoice.expectedReturn}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">ROI</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    className="flex-1 glow group-hover:scale-105 transition-smooth"
                    onClick={() => navigate("/investment-details")}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Invest Now
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-primary/30 hover:bg-primary/10"
                    onClick={() => navigate("/investment-details")}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Investment Analysis */}
        <InvestmentAnalysis
          invoiceId="marketplace-overview"
          companyName="Market Analysis"
        />

        {/* Load More */}
        {displayedListings < allInvoiceListings.length && (
          <div className="text-center pt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More Listings"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
