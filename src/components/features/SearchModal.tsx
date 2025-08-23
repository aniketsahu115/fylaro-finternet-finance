import React, { useState, useEffect } from 'react';
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
  type: 'invoice' | 'user' | 'market' | 'company';
  path: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Mock search results - in a real app, this would be an API call
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Invoice #INV-001',
      description: 'Healthcare sector invoice - $45,000',
      type: 'invoice',
      path: '/marketplace'
    },
    {
      id: '2',
      title: 'TechCorp Ltd.',
      description: 'Technology company with AAA rating',
      type: 'company',
      path: '/marketplace'
    },
    {
      id: '3',
      title: 'Healthcare Market',
      description: 'APY: 12.5% | Volume: $45M',
      type: 'market',
      path: '/trading'
    },
    {
      id: '4',
      title: 'Investor Portfolio',
      description: 'Top performing portfolio this quarter',
      type: 'user',
      path: '/portfolio'
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Filter mock results based on search query
      const filtered = mockResults.filter(
        result => 
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
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
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'market':
        return <TrendingUp className="h-4 w-4" />;
      case 'company':
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
                        <div className="font-medium text-sm">{result.title}</div>
                        <div className="text-xs text-muted-foreground">{result.description}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No results found for "{searchQuery}"</p>
                  <p className="text-xs">Try searching for invoices, companies, or markets</p>
                </div>
              )}
            </div>
          )}

          {searchQuery.length <= 2 && (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs">Search for invoices, companies, markets, and more</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
