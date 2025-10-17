import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Users, TrendingUp, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "invoice" | "user" | "market" | "company";
  path: string;
  keywords?: string[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Mock search results - in a real app, this would be an API call
  const mockResults: SearchResult[] = [
    {
      id: "0",
      title: "Fylaro Platform",
      description:
        "Explore the Fylaro finance and invoice tokenization platform",
      type: "company",
      path: "/",
      keywords: ["home", "index", "landing", "platform"],
    },
    {
      id: "careers",
      title: "Careers",
      description: "Open roles and hiring information at Fylaro",
      type: "company",
      path: "/careers",
      keywords: ["jobs", "hiring", "roles", "recruiting"],
    },
    {
      id: "about",
      title: "About",
      description: "Learn about the Fylaro mission and team",
      type: "company",
      path: "/about",
      keywords: ["company", "mission", "team"],
    },
    {
      id: "help",
      title: "Help Center",
      description: "FAQs and support resources",
      type: "company",
      path: "/help",
      keywords: ["support", "faq", "docs", "documentation"],
    },
    {
      id: "contact",
      title: "Contact",
      description: "Get in touch with the Fylaro team",
      type: "company",
      path: "/contact",
      keywords: ["email", "reach", "talk", "connect"],
    },
    {
      id: "security",
      title: "Security",
      description: "Security practices and protections",
      type: "company",
      path: "/security",
      keywords: ["privacy", "safety", "trust"],
    },
    {
      id: "press",
      title: "Press",
      description: "Press kit and media inquiries",
      type: "company",
      path: "/press",
      keywords: ["media", "brand", "logos"],
    },
    {
      id: "legal",
      title: "Legal",
      description: "Terms, privacy policy, and compliance",
      type: "company",
      path: "/legal",
      keywords: ["terms", "privacy", "policy"],
    },
    {
      id: "api-docs",
      title: "API Docs",
      description: "Developer documentation and APIs",
      type: "company",
      path: "/api-docs",
      keywords: ["developers", "api", "sdk", "documentation"],
    },
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Your account overview and metrics",
      type: "user",
      path: "/dashboard",
      keywords: ["home", "account", "overview"],
    },
    {
      id: "marketplace",
      title: "Marketplace",
      description: "Browse and invest in verified invoices",
      type: "market",
      path: "/marketplace",
      keywords: ["invoices", "invest", "offers", "listings"],
    },
    {
      id: "trading",
      title: "Trading",
      description: "Trade tokenized invoices",
      type: "market",
      path: "/trading",
      keywords: ["exchange", "orders", "buy", "sell"],
    },
    {
      id: "portfolio",
      title: "Portfolio",
      description: "Track your holdings and returns",
      type: "user",
      path: "/portfolio",
      keywords: ["assets", "holdings", "positions"],
    },
    {
      id: "payments",
      title: "Payments",
      description: "Payment schedule and tracking",
      type: "user",
      path: "/payments",
      keywords: ["receivables", "cash flow", "due"],
    },
    {
      id: "upload",
      title: "Upload Invoice",
      description: "Tokenize a new invoice",
      type: "user",
      path: "/upload",
      keywords: ["submit", "new", "create", "tokenize"],
    },
    {
      id: "1",
      title: "Invoice #INV-001",
      description: "Healthcare sector invoice - $45,000",
      type: "invoice",
      path: "/marketplace",
    },
    {
      id: "2",
      title: "TechCorp Ltd.",
      description: "Technology company with AAA rating",
      type: "company",
      path: "/marketplace",
    },
    {
      id: "3",
      title: "Healthcare Market",
      description: "APY: 12.5% | Volume: $45M",
      type: "market",
      path: "/trading",
    },
    {
      id: "4",
      title: "Investor Portfolio",
      description: "Top performing portfolio this quarter",
      type: "user",
      path: "/portfolio",
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Filter mock results based on search query
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          (result.keywords &&
            result.keywords.some((k) =>
              k.toLowerCase().includes(query.toLowerCase())
            ))
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <FileText className="h-4 w-4" />;
      case "user":
        return <Users className="h-4 w-4" />;
      case "market":
        return <TrendingUp className="h-4 w-4" />;
      case "company":
        return <Building className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Fylaro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices, companies, markets..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {searchQuery.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.length > 0 ? (
                results.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded bg-primary/10 text-primary">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {result.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-xs">
                    Try searching for invoices, companies, or markets
                  </p>
                </div>
              )}
            </div>
          )}

          {searchQuery.length <= 2 && (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs">
                Search for invoices, companies, markets, and more
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
