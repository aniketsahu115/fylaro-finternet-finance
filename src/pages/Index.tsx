import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  CheckCircle
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure Tokenization",
      description: "Cryptographically verified invoice ownership with fraud detection"
    },
    {
      icon: Globe,
      title: "Global Liquidity",
      description: "Access investors worldwide through the Unified Ledger"
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Automated payments and real-time tracking"
    },
    {
      icon: TrendingUp,
      title: "Fair Credit Scoring",
      description: "Transparent rating system based on verifiable data"
    }
  ];

  const stats = [
    { label: "Total Volume", value: "$50M+", icon: DollarSign },
    { label: "Active Investors", value: "2,500+", icon: Users },
    { label: "Invoices Funded", value: "15,000+", icon: FileText },
    { label: "Success Rate", value: "98.5%", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 binance-grid opacity-20"></div>
        <div className="relative container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 text-xs px-3 py-1 glow">
              Powered by Finternet
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Invoice Financing on the{" "}
              <span className="text-gradient">Unified Ledger</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Fylaro connects businesses seeking working capital with global investors 
              through tokenized invoices and seamless cross-border financial access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="glow">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                View Marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg gradient-primary mb-4">
                  <stat.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose Fylaro?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of invoice financing with cutting-edge 
              technology and global accessibility.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="gradient-card border-border hover:glow transition-smooth">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg gradient-primary">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple steps to unlock your working capital
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload Invoice</h3>
              <p className="text-muted-foreground">
                Submit your verified invoice with automated KYC and fraud detection
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Funded</h3>
              <p className="text-muted-foreground">
                Investors bid on your tokenized invoice through the marketplace
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Receive Capital</h3>
              <p className="text-muted-foreground">
                Get instant access to working capital with automated settlement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="gradient-card border-border text-center p-12">
            <CardContent className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Ready to Transform Your Cash Flow?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of businesses and investors already using Fylaro 
                to unlock global financial opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="glow">
                  Start as Business
                </Button>
                <Button size="lg" variant="outline">
                  Invest in Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
