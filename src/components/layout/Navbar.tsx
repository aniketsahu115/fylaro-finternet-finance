import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Wallet,
  Menu,
  Search,
  Globe,
  ChevronDown,
  Sun,
  Moon
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "next-themes";

const Navbar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden group-hover:scale-110 transition-smooth">
              <img src="/src/assets/fylaro-logo-icon.png" alt="Fylaro Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold text-foreground">Fylaro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Marketplace
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Dashboard
            </Link>
            <Link to="/portfolio" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Portfolio
            </Link>
            <Link to="/trading" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Trading
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden lg:flex text-muted-foreground hover:text-primary">
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-primary"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Language/Region */}
            <Button variant="ghost" size="sm" className="hidden lg:flex text-muted-foreground hover:text-primary">
              <Globe className="h-4 w-4 mr-2" />
              EN
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-primary">
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
            </Button>

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <Badge className="bg-success/10 text-success border-success/30 hidden lg:flex">
                  Connected
                </Badge>
                <Button 
                  variant="outline" 
                  className="border-primary/30 text-foreground hover:bg-primary/10"
                  onClick={() => setIsConnected(false)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  0x1234...5678
                </Button>
              </div>
            ) : (
              <Button 
                className="glow"
                onClick={() => setIsConnected(true)}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}

            {/* Mobile Menu */}
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;