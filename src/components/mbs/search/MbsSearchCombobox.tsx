'use client';

import React, { useState, useCallback, useId, useRef, useEffect } from 'react';
// Direct input approach - no need for Command/Popover components
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';
import type { ProviderType } from '@/server/services/mbs/types/search';

interface MbsSearchComboboxProps {
  onItemSelect?: (item: MbsSearchResult) => void;
  placeholder?: string;
  className?: string;
  providerType?: ProviderType;
  category?: string;
  disabled?: boolean;
}

interface MbsSearchResult {
  itemNumber: number;
  description: string;
  category?: string;
  providerType?: ProviderType;
  scheduleFee?: number;
  benefit75?: number;
  relevanceScore?: number;
  hasAnaesthetic?: boolean;
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
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  
  // Generate unique IDs for ARIA attributes
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  
  // Refs for managing focus and keyboard navigation
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

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
    setActiveOptionIndex(-1);
    onItemSelect?.(item);
  }, [onItemSelect]);

  // Reset active option when results change
  useEffect(() => {
    setActiveOptionIndex(-1);
  }, [searchResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const results = searchResults?.results ?? [];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!showResults && query.length >= 2) {
          setShowResults(true);
        } else if (results.length > 0) {
          setActiveOptionIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (results.length > 0) {
          setActiveOptionIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (activeOptionIndex >= 0 && results[activeOptionIndex]) {
          handleItemSelect(results[activeOptionIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setActiveOptionIndex(-1);
        inputRef.current?.blur();
        break;
        
      case 'Tab':
        setShowResults(false);
        setActiveOptionIndex(-1);
        break;
    }
  }, [searchResults, showResults, query.length, activeOptionIndex, handleItemSelect]);

  const formatCurrency = useCallback((amount: number | null) => {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  }, []);

  const getProviderTypeLabel = useCallback((type: ProviderType | undefined) => {
    switch (type) {
      case 'G': return 'GP';
      case 'S': return 'Specialist';
      case 'AD': return 'Dental';
      case 'ALL': return 'Any';
      default: return 'Any';
    }
  }, []);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      index % 2 === 1 ? (
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
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => {
            // Delay hiding results to allow for clicks
            setTimeout(() => {
              setShowResults(false);
              setActiveOptionIndex(-1);
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          // ARIA combobox attributes
          role="combobox"
          aria-expanded={showResults && debouncedQuery.length >= 2}
          aria-controls={showResults && debouncedQuery.length >= 2 ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            activeOptionIndex >= 0 && searchResults?.results?.[activeOptionIndex]
              ? `${comboboxId}-option-${searchResults.results[activeOptionIndex].itemNumber}`
              : undefined
          }
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
        <div 
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
        >
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
                <p className="text-sm">No MBS items found for &ldquo;{debouncedQuery}&rdquo;</p>
              </div>
            )}

            {searchResults?.results && searchResults.results.length > 0 && (
              <div className="p-1">
                {searchResults.results.map((item, index) => (
                  <div
                    key={item.itemNumber}
                    id={`${comboboxId}-option-${item.itemNumber}`}
                    role="option"
                    aria-selected={index === activeOptionIndex}
                    onClick={() => {
                      handleItemSelect(item);
                      setShowResults(false);
                    }}
                    className={cn(
                      "p-3 cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground",
                      index === activeOptionIndex && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" color="slate" className="text-xs">
                            {item.itemNumber}
                          </Badge>
                          <Badge variant="outline" color="blue" className="text-xs">
                            {getProviderTypeLabel(item.providerType)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <span className="text-sm font-medium">
                            {formatCurrency(item.scheduleFee ?? null)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700">
                        {highlightMatch(
                          item.description?.trim() ? 
                            item.description.substring(0, 120) + (item.description.length > 120 ? '...' : '') : 
                            'No description available',
                          debouncedQuery
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Category {item.category}</span>
                        {'hasAnaesthetic' in item && 
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                          (item as any).hasAnaesthetic === true && (
                          <Badge variant="outline" color="orange" className="text-xs">
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
