import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import BinanceBlockchainAnimation from "@/components/animations/BinanceBlockchainAnimation";
import GlobalMapAnimation from "@/components/animations/GlobalMapAnimation";
import ScrollTriggeredFintechIcons from "@/components/animations/ScrollTriggeredFintechIcons";
import DigitalVaultAnimation from "@/components/animations/DigitalVaultAnimation";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  BarChart3,
  Clock,
  Award,
  Banknote
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Shield,
      title: "Secure Tokenization",
      description: "Cryptographically verified invoice ownership with advanced fraud detection and blockchain security"
    },
    {
      icon: Globe,
      title: "Global Liquidity Pool",
      description: "Access worldwide investors through our unified ledger infrastructure and cross-border settlement"
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Automated payments with real-time tracking and immediate fund transfer capabilities"
    },
    {
      icon: TrendingUp,
      title: "AI Credit Scoring",
      description: "Advanced machine learning algorithms provide transparent ratings based on verifiable data"
    }
  ];

  const stats = [
    { label: "Total Volume", value: "$127M+", icon: DollarSign, change: "+24.5%" },
    { label: "Active Investors", value: "8,250+", icon: Users, change: "+18.2%" },
    { label: "Invoices Funded", value: "45,000+", icon: FileText, change: "+31.7%" },
    { label: "Success Rate", value: "99.2%", icon: CheckCircle, change: "+0.3%" }
  ];

  const marketData = [
    { name: "Healthcare", apy: "12.5%", volume: "$45M", trend: "up" },
    { name: "Manufacturing", apy: "10.8%", volume: "$32M", trend: "up" },
    { name: "Technology", apy: "14.2%", volume: "$28M", trend: "up" },
    { name: "Logistics", apy: "11.3%", volume: "$22M", trend: "down" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero min-h-[90vh] flex items-center">
        {/* Blockchain Animation Background */}
        <div className="absolute inset-0 z-0">
          <BinanceBlockchainAnimation />
        </div>
        
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 z-10"></div>
        
        {/* Traditional grid background (subtle) */}
        <div className="absolute inset-0 professional-grid opacity-5 z-20"></div>
        
        <div className="relative container mx-auto px-6 py-20 lg:py-32 z-30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-8 text-sm px-4 py-2 glow bg-primary/10 text-primary border-primary/30 backdrop-blur-sm">
                Powered by Finternet Technology
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight text-white drop-shadow-2xl">
                Next-Generation{" "}
                <span className="text-gradient bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                  Invoice Financing
                </span>{" "}
                Platform
              </h1>
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
                Transform your receivables into instant liquidity through our advanced 
                tokenization platform. Connect with global investors and unlock working capital 
                with unprecedented speed and transparency.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 glow h-auto backdrop-blur-sm bg-primary/90 hover:bg-primary shadow-2xl"
                  onClick={() => navigate('/trading')}
                >
                  Start Trading Invoices
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4 h-auto border-primary/30 text-white hover:bg-primary/10 backdrop-blur-sm shadow-xl"
                  onClick={() => navigate('/marketplace')}
                >
                  Explore Marketplace
                </Button>
              </div>
            </div>

            {/* Live Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <Card key={index} className="glass-card hover:highlight-border transition-smooth backdrop-blur-md bg-card/80 border-white/10">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl gradient-primary mb-4 shadow-lg">
                      <stat.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="text-3xl lg:text-4xl font-bold mb-2 text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                    <div className="text-xs text-success flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-20 border-y border-border/50 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="absolute inset-0">
          <DigitalVaultAnimation />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">Live Market Overview</h2>
            <p className="text-xl text-blue-200">Real-time performance across industry sectors</p>
          </div>
          
          <Card className="glass-card max-w-4xl mx-auto bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <BarChart3 className="h-6 w-6 text-yellow-400" />
                Top Performing Sectors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.map((sector, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-smooth backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span className="font-semibold text-white">{sector.name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-blue-100">APY: <span className="text-yellow-400 font-bold">{sector.apy}</span></div>
                        <div className="text-blue-200">Volume: {sector.volume}</div>
                      </div>
                      <TrendingUp className={`h-4 w-4 ${sector.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 text-sm px-4 py-2 bg-primary/10 text-primary border-primary/30">
              Advanced Technology
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Why Industry Leaders Choose Fylaro
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience cutting-edge financial technology with institutional-grade 
              security and global accessibility powered by the Finternet.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card hover:highlight-border transition-smooth group">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 rounded-xl gradient-primary group-hover:scale-110 transition-smooth">
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blockchain Technology Showcase */}
      <section className="py-20 bg-gradient-to-br from-background via-background/95 to-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full opacity-60">
            <BinanceBlockchainAnimation />
          </div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 text-sm px-4 py-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 backdrop-blur-sm">
              Binance Smart Chain Powered
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-white">
              Built on Enterprise-Grade
              <span className="block text-gradient bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                Blockchain Infrastructure
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the speed, security, and scalability of Binance Smart Chain 
              with our advanced cross-chain interoperability powered by Finternet technology.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="glass-card hover:highlight-border transition-smooth group backdrop-blur-lg bg-card/20 border-white/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 group-hover:scale-110 transition-smooth backdrop-blur-sm">
                    <Zap className="h-7 w-7 text-yellow-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">Lightning Fast</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Sub-3 second settlement times with 1M+ transactions per second capacity 
                  on Binance Smart Chain's optimized infrastructure.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400/80">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span>Real-time validation</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:highlight-border transition-smooth group backdrop-blur-lg bg-card/20 border-white/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 group-hover:scale-110 transition-smooth backdrop-blur-sm">
                    <Shield className="h-7 w-7 text-green-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">Bank-Grade Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Multi-signature validation, cryptographic proof systems, and 
                  decentralized consensus ensure institutional-level security.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-green-400/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>99.9% uptime guarantee</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:highlight-border transition-smooth group backdrop-blur-lg bg-card/20 border-white/10">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:scale-110 transition-smooth backdrop-blur-sm">
                    <Globe className="h-7 w-7 text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">Cross-Chain Ready</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Seamless interoperability across 10+ blockchain networks with 
                  Finternet's unified ledger technology for global accessibility.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-400/80">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Multi-chain support</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Specifications */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="glass-card backdrop-blur-lg bg-card/10 border-white/10">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-center mb-8 text-white">
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-yellow-400">3s</div>
                    <div className="text-sm text-gray-400">Average Settlement</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-green-400">99.9%</div>
                    <div className="text-sm text-gray-400">Network Uptime</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-blue-400">1M+</div>
                    <div className="text-sm text-gray-400">TPS Capacity</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-purple-400">10+</div>
                    <div className="text-sm text-gray-400">Supported Chains</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Global Market Overview */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 text-sm px-4 py-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 backdrop-blur-sm">
              Live Market Data
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-white">
              Global Market Overview
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real-time performance across industry sectors with live data flow visualization 
              showing global network activity and cross-border transactions.
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto">
            <div className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden border border-gray-700/50 backdrop-blur-lg">
              <GlobalMapAnimation />
            </div>
          </div>

          {/* Market Performance Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
            {marketData.map((sector, index) => (
              <Card key={index} className="glass-card hover:highlight-border transition-smooth group backdrop-blur-lg bg-card/20 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">{sector.name}</CardTitle>
                    <div className={`flex items-center gap-1 text-sm ${
                      sector.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className={`h-4 w-4 ${sector.trend === 'down' ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">APY:</span>
                      <span className="text-yellow-400 font-bold text-lg">{sector.apy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Volume:</span>
                      <span className="text-white font-medium">{sector.volume}</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          sector.trend === 'up' ? 'bg-green-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Three Steps to Liquidity
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional-grade invoice financing made simple
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Upload & Verify",
                description: "Submit your invoice with automated KYC verification and AI-powered fraud detection systems",
                icon: FileText
              },
              {
                step: "02", 
                title: "Market Auction",
                description: "Your tokenized invoice enters our global marketplace where institutional investors compete for the best rates",
                icon: TrendingUp
              },
              {
                step: "03",
                title: "Instant Funding", 
                description: "Receive immediate working capital with automated settlement and real-time payment tracking",
                icon: Zap
              }
            ].map((item, index) => (
              <Card key={index} className="glass-card text-center hover:highlight-border transition-smooth group">
                <CardContent className="p-8">
                  <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-smooth">
                    <item.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fintech Features Animation */}
      <ScrollTriggeredFintechIcons />

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="glass-card highlight-border max-w-4xl mx-auto">
            <CardContent className="text-center p-12 lg:p-16">
              <Badge className="mb-8 text-sm px-4 py-2 bg-primary/10 text-primary border-primary/30">
                Join the Future of Finance
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Ready to Transform Your Cash Flow?
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of businesses and institutional investors already leveraging 
                Fylaro's advanced invoice financing platform to unlock global financial opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 glow h-auto"
                  onClick={() => navigate('/upload')}
                >
                  <Banknote className="mr-3 h-6 w-6" />
                  Start as Business
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4 h-auto border-primary/30 text-foreground hover:bg-primary/10"
                  onClick={() => navigate('/marketplace')}
                >
                  <Award className="mr-3 h-6 w-6" />
                  Become an Investor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">F</span>
                </div>
                <span className="text-2xl font-bold">Fylaro</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                The world's most advanced invoice financing platform, powered by Finternet technology 
                and trusted by industry leaders globally.
              </p>
              <Button 
                className="glow"
                onClick={() => navigate('/dashboard')}
              >
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="/marketplace" className="hover:text-primary transition-colors">Marketplace</a></li>
                <li><a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
                <li><a href="/portfolio" className="hover:text-primary transition-colors">Portfolio</a></li>
                <li><a href="/trading" className="hover:text-primary transition-colors">Trading</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Legal</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2024 Fylaro. All rights reserved. Licensed financial technology platform.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Risk Disclosure</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
