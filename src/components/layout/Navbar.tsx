import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Wallet, User, ChevronDown } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gradient">Fylaro</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Finternet
          </Badge>
        </div>

        {/* Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="/marketplace" className="text-sm font-medium hover:text-primary transition-smooth">
            Marketplace
          </a>
          <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-smooth">
            Dashboard
          </a>
          <a href="/portfolio" className="text-sm font-medium hover:text-primary transition-smooth">
            Portfolio
          </a>
          <a href="/trading" className="text-sm font-medium hover:text-primary transition-smooth">
            Trading
          </a>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></span>
          </Button>

          {/* Wallet Connection */}
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">0x1234...5678</span>
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setIsConnected(true)}
              className="glow"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;