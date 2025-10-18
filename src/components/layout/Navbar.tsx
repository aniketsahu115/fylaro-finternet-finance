import { Button } from "@/components/ui/button";
import { Bell, Menu, Search, Sun, Moon, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useWallet } from "@/hooks/useWallet";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SearchModal from "@/components/features/SearchModal";
import NotificationDropdown from "@/components/features/NotificationDropdown";
import LanguageSelector from "@/components/features/LanguageSelector";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { isConnected, isOnBSC, switchToBSC } = useWallet();

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden group-hover:scale-110 transition-smooth">
              <img
                src="/src/assets/fylaro-logo-icon.png"
                alt="Fylaro Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-bold text-foreground">Fylaro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              to="/marketplace"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Marketplace
            </Link>
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/portfolio"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Portfolio
            </Link>
            <Link
              to="/trading"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Trading
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Join Waitlist */}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex navbar-button"
              asChild
            >
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSdwA6QzkyjYxhfNupg0_lg6IX-UZr3i01FwM8WwAZSlp6V2KQ/viewform?usp=dialog"
                target="_blank"
                rel="noopener noreferrer"
                title="Join the early access waitlist"
              >
                Join Waitlist
              </a>
            </Button>

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
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Notifications */}
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onToggle={() => setIsNotificationOpen(!isNotificationOpen)}
            />

            {/* Wallet Connection (RainbowKit) */}
            <div className="flex items-center space-x-2">
              {!isOnBSC && isConnected && (
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
              <ConnectButton
                accountStatus={{
                  smallScreen: "avatar",
                  largeScreen: "address",
                }}
                chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
                showBalance={false}
              />
            </div>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden navbar-button"
            >
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

      {/* RainbowKit handles its own modal; custom modal removed */}
    </nav>
  );
};

export default Navbar;
