'use client';

import React, { useState, useCallback, useId, useRef, useEffect } from 'react';
// Direct input approach - no need for Command/Popover components
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';
import type { ProviderType, SectionedSearchResponse } from '@/server/services/mbs/types/search';
import { parseSearchQuery } from '@/utils/searchQueryParser';

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
  shortDescription?: string;
  category?: string;
  providerType?: ProviderType;
  scheduleFee?: number;
  benefit75?: number;
  relevanceScore?: number;
  hasAnaesthetic?: boolean;
  isActive: boolean;
}

// Helper functions moved to module scope to avoid recreation on every render
const formatCurrency = (amount: number | null) => {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
};

const getProviderTypeLabel = (type: ProviderType | undefined) => {
  switch (type) {
    case 'G': return 'GP';
    case 'S': return 'Specialist';
    case 'AD': return 'Dental';
    case 'ALL': return 'Any';
    default: return 'Any';
  }
};

// Component for individual search result item
function SearchResultItem({
  item,
  isActive,
  onSelect,
  onClose,
  query,
  comboboxId,
  isExactMatch
}: {
  item: MbsSearchResult;
  isActive: boolean;
  onSelect: (item: MbsSearchResult) => void;
  onClose: () => void;
  query: string;
  comboboxId: string;
  isExactMatch: boolean;
}) {
  return (
    <div
      id={`${comboboxId}-option-${item.itemNumber}`}
      role="option"
      aria-selected={isActive}
      onClick={() => {
        onSelect(item);
        onClose();
      }}
      className={cn(
        "p-3 cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
        isActive && "bg-accent text-accent-foreground",
        isExactMatch && "border-l-2 border-green-500"
      )}
    >
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              color="slate"
              className={cn(
                "text-xs font-semibold",
                isExactMatch ? "border-green-500 text-green-700 bg-green-50" : "border-slate-300"
              )}
            >
              {item.itemNumber}
            </Badge>
            <Badge variant="outline" color="blue" className="text-xs">
              {getProviderTypeLabel(item.providerType)}
            </Badge>
            {isExactMatch && (
              <Badge variant="outline" color="green" className="text-xs bg-green-50 text-green-700 border-green-300">
                Exact
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <span className="text-sm font-medium">
              {formatCurrency(item.scheduleFee ?? null)}
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-700">
          <ExpandableDescription
            shortDescription={item.shortDescription}
            fullDescription={item.description}
            query={query}
          />
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Category {item.category}</span>
          {item.hasAnaesthetic && (
            <Badge variant="outline" color="orange" className="text-xs border-orange-300 text-orange-700">
              Anaesthetic
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for expandable description text
function ExpandableDescription({ 
  shortDescription, 
  fullDescription, 
  query 
}: { 
  shortDescription?: string; 
  fullDescription: string; 
  query: string; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use shortDescription if available, otherwise truncate fullDescription
  const displayText = shortDescription?.trim() ?? fullDescription?.trim();
  if (!displayText) return <span className="text-gray-500">No description available</span>;
  
  const shouldShowExpand = fullDescription && shortDescription && fullDescription.length > shortDescription.length;
  
  const highlightMatch = (text: string, query: string) => {
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
  };
  
  return (
    <div className="space-y-1">
      <div>
        {highlightMatch(isExpanded ? fullDescription : displayText, query)}
      </div>
      {shouldShowExpand && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent item selection

            setIsExpanded(!isExpanded);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Also prevent on mouse down
          }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
          type="button"
          tabIndex={-1} // Prevent focus from moving away from search input
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show more
            </>
          )}
        </button>
      )}
    </div>
  );
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
  const [isInteractingWithResults, setIsInteractingWithResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  
  // Parse query to determine search intent
  const parsedQuery = parseSearchQuery(debouncedQuery);
  
  // Generate unique IDs for ARIA attributes
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  
  // Refs for managing focus and keyboard navigation
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const queryResult = api.mbs.smartSearch.useQuery(
    {
      query: debouncedQuery,
      limit: 15,
      searchType: 'text', // Start with text search since we don't have OpenAI yet
      intent: parsedQuery.intent,
      itemNumber: parsedQuery.itemNumber,
      textQuery: parsedQuery.textQuery,
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data, isLoading, error } = queryResult;
  // Type assertion to help TypeScript understand the correct return type
  const typedSearchResults = data as SectionedSearchResponse | undefined;

  const handleItemSelect = useCallback((item: MbsSearchResult) => {
    setShowResults(false);
    setQuery('');
    setActiveOptionIndex(-1);
    onItemSelect?.(item);
  }, [onItemSelect]);

  // Reset active option when results change
  useEffect(() => {
    setActiveOptionIndex(-1);
  }, [typedSearchResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!typedSearchResults || error) return;
    
    const exactMatches = typedSearchResults.exactMatches ?? [];
    const relatedMatches = typedSearchResults.relatedMatches ?? [];
    const allResults = [...exactMatches, ...relatedMatches];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!showResults && query.length >= 2) {
          setShowResults(true);
        } else if (allResults.length > 0) {
          setActiveOptionIndex(prev => 
            prev < allResults.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (allResults.length > 0) {
          setActiveOptionIndex(prev => 
            prev > 0 ? prev - 1 : allResults.length - 1
          );
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (activeOptionIndex >= 0 && allResults[activeOptionIndex]) {
          handleItemSelect(allResults[activeOptionIndex]);
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
  }, [typedSearchResults, showResults, query.length, activeOptionIndex, handleItemSelect, error]);





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
            // Only hide results if we're not interacting with them
            if (!isInteractingWithResults) {
              setTimeout(() => {
                setShowResults(false);
                setActiveOptionIndex(-1);
              }, 300); // Increased timeout for expand/collapse interactions
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          // ARIA combobox attributes
          role="combobox"
          aria-expanded={showResults && debouncedQuery.length >= 2}
          aria-controls={showResults && debouncedQuery.length >= 2 ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            activeOptionIndex >= 0 && typedSearchResults && !error
              ? (() => {
                  const exactMatches = typedSearchResults.exactMatches ?? [];
                  const relatedMatches = typedSearchResults.relatedMatches ?? [];
                  const allResults = [...exactMatches, ...relatedMatches];
                  return allResults[activeOptionIndex]
                    ? `${comboboxId}-option-${allResults[activeOptionIndex].itemNumber}`
                    : undefined;
                })()
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
          onMouseEnter={() => setIsInteractingWithResults(true)}
          onMouseLeave={() => setIsInteractingWithResults(false)}
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

            {debouncedQuery.length >= 2 && !isLoading && !error &&
             (typedSearchResults?.exactMatches?.length === 0 && typedSearchResults?.relatedMatches?.length === 0) && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No MBS items found for &ldquo;{debouncedQuery}&rdquo;</p>
              </div>
            )}

            {!error && ((typedSearchResults?.exactMatches && typedSearchResults.exactMatches.length > 0) ||
             (typedSearchResults?.relatedMatches && typedSearchResults.relatedMatches.length > 0)) ? (
              <div className="p-1 space-y-1">
                {/* Exact Matches Section */}
                {typedSearchResults?.exactMatches && typedSearchResults.exactMatches.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border-b border-green-100">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Exact Match
                      </div>
                    </div>
                    {typedSearchResults.exactMatches?.map((item, index) => (
                      <SearchResultItem
                        key={`exact-${item.itemNumber}`}
                        item={item}
                        isActive={index === activeOptionIndex}
                        onSelect={handleItemSelect}
                        onClose={() => setShowResults(false)}
                        query={debouncedQuery}
                        comboboxId={comboboxId}
                        isExactMatch={true}
                      />
                    ))}
                  </div>
                )}

                {/* Related Matches Section */}
                {typedSearchResults?.relatedMatches && typedSearchResults.relatedMatches.length > 0 && (
                  <div>
                    {typedSearchResults?.exactMatches && typedSearchResults.exactMatches.length > 0 && (
                      <div className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border-b border-blue-100">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Related Items
                        </div>
                      </div>
                    )}
                    {typedSearchResults.relatedMatches?.map((item, index) => {
                      const adjustedIndex = (typedSearchResults.exactMatches?.length ?? 0) + index;
                      return (
                        <SearchResultItem
                          key={`related-${item.itemNumber}`}
                          item={item}
                          isActive={adjustedIndex === activeOptionIndex}
                          onSelect={handleItemSelect}
                          onClose={() => setShowResults(false)}
                          query={debouncedQuery}
                          comboboxId={comboboxId}
                          isExactMatch={false}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
