import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Wallet,
  Menu,
  Search,
  Sun,
  Moon,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useWallet } from "@/hooks/useWallet";
import { WalletConnectModal } from "@/components/features/WalletConnectModal";
import SearchModal from "@/components/features/SearchModal";
import LanguageSelector from "@/components/features/LanguageSelector";
import { toast } from "sonner";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { 
    isConnected, 
    address, 
    isConnecting, 
    disconnectWallet, 
    formatAddress,
    isOnBSC,
    switchToBSC 
  } = useWallet();

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden lg:flex navbar-button"
              onClick={() => setIsSearchModalOpen(true)}
              title="Search (Ctrl+K)"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="navbar-button"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative navbar-button">
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
            </Button>

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {!isOnBSC && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchToBSC}
                      className="border-warning/30 text-warning hover:bg-warning/10"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Switch to BSC
                    </Button>
                  )}
                  <Badge className={`${isOnBSC ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'} hidden lg:flex`}>
                    {isOnBSC ? 'BSC Connected' : 'Wrong Network'}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  className="border-primary/30 text-foreground hover:bg-primary/10"
                  onClick={disconnectWallet}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {formatAddress(address)}
                </Button>
              </div>
            ) : (
              <Button 
                className="glow"
                onClick={() => setIsWalletModalOpen(true)}
                disabled={isConnecting}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}

            {/* Mobile Menu */}
            <Button variant="ghost" size="sm" className="lg:hidden navbar-button">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />

      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;