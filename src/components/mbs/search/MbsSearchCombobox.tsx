'use client';

import React, { useState, useCallback } from 'react';
// Direct input approach - no need for Command/Popover components
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';

interface MbsSearchComboboxProps {
  onItemSelect?: (item: MbsSearchResult) => void;
  placeholder?: string;
  className?: string;
  providerType?: string;
  category?: string;
  disabled?: boolean;
}

interface MbsSearchResult {
  itemNumber: number;
  description: string;
  category: string;
  providerType: string | null;
  scheduleFee: number | null;
  benefit75: number | null;
  relevanceScore?: number;
  hasAnaesthetic: boolean;
  isActive: boolean;
}

export function MbsSearchCombobox({
  onItemSelect,
  placeholder = "Search MBS items...",
  className,
  providerType = 'ALL',
  category,
  disabled = false,
}: MbsSearchComboboxProps) {
  const [showResults, setShowResults] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: searchResults, isLoading, error } = api.mbs.search.useQuery(
    {
      query: debouncedQuery,
      limit: 15,
      searchType: 'text', // Start with text search since we don't have OpenAI yet
      filters: {
        providerType,
        category,
        includeInactive: false,
      },
    },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  const handleItemSelect = useCallback((item: MbsSearchResult) => {
    setShowResults(false);
    setQuery('');
    onItemSelect?.(item);
  }, [onItemSelect]);

  const formatCurrency = useCallback((amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  }, []);

  const getProviderTypeLabel = useCallback((type: string | null) => {
    switch (type) {
      case 'G': return 'GP';
      case 'S': return 'Specialist';
      case 'AD': return 'Dental';
      default: return 'Any';
    }
  }, []);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Direct search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => {
            // Delay hiding results to allow for clicks
            setTimeout(() => setShowResults(false), 200);
          }}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </div>

      {/* Inline results dropdown */}
      {showResults && (debouncedQuery.length >= 2 || isLoading) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none">
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading && debouncedQuery.length >= 2 && (
              <div className="p-4 space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {error && (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">
                  Search failed. Please try again.
                </p>
              </div>
            )}

            {debouncedQuery.length >= 2 && !isLoading && searchResults?.results?.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No MBS items found for "{debouncedQuery}"</p>
              </div>
            )}

            {searchResults?.results && searchResults.results.length > 0 && (
              <div className="p-1">
                {searchResults.results.map((item) => (
                  <div
                    key={item.itemNumber}
                    onClick={() => {
                      handleItemSelect(item);
                      setShowResults(false);
                    }}
                    className="p-3 cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.itemNumber}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getProviderTypeLabel(item.providerType)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <span className="text-sm font-medium">
                            {formatCurrency(item.scheduleFee)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700">
                        {highlightMatch(
                          (item.description && item.description.trim()) ? 
                            item.description.substring(0, 120) + (item.description.length > 120 ? '...' : '') : 
                            'No description available',
                          debouncedQuery
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Category {item.category}</span>
                        {item.hasAnaesthetic && (
                          <Badge variant="outline" className="text-xs">
                            Anaesthetic
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
