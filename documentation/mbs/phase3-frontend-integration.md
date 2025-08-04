# Phase 3: Frontend Integration

## Overview
This phase creates the React components, tRPC integration, and user interface for the MBS Billing Assistant. Timeline: Week 3.

## 1. Component Architecture

### 1.1 Component Structure
```
apps/web/src/components/mbs/
├── search/
│   ├── MbsSearchCombobox.tsx
│   ├── SearchResults.tsx
│   └── SearchFilters.tsx
├── suggestions/
│   ├── BillingSidebar.tsx
│   ├── SuggestionCard.tsx
│   └── SoapAnalyzer.tsx
├── details/
│   ├── ItemDrawer.tsx
│   ├── ItemDetail.tsx
│   └── FeeBreakdown.tsx
├── comparison/
│   ├── ComparisonTable.tsx
│   └── RevenueGapChart.tsx
└── shared/
    ├── MbsProvider.tsx
    ├── LoadingStates.tsx
    └── ErrorBoundary.tsx
```

## 2. Core Components

### 2.1 MBS Search Combobox

Create `apps/web/src/components/mbs/search/MbsSearchCombobox.tsx`:

```tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface MbsSearchComboboxProps {
  onItemSelect?: (item: MbsSearchResult) => void;
  placeholder?: string;
  className?: string;
  providerType?: 'G' | 'S' | 'all';
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
  relevanceScore: number;
  hasAnaesthetic: boolean;
  isActive: boolean;
}

export function MbsSearchCombobox({
  onItemSelect,
  placeholder = "Search MBS items...",
  className,
  providerType = 'all',
  category,
  disabled = false,
}: MbsSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: searchResults, isLoading, error } = trpc.mbs.search.useQuery(
    {
      query: debouncedQuery,
      limit: 15,
      searchType: 'hybrid',
      providerType,
      category,
      includeInactive: false,
    },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  const handleItemSelect = useCallback((item: MbsSearchResult) => {
    setOpen(false);
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
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {query || placeholder}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={setQuery}
              className="border-0 focus:ring-0"
            />
            
            <CommandList className="max-h-[300px] overflow-y-auto">
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

              {debouncedQuery.length < 2 && (
                <CommandEmpty>
                  Type at least 2 characters to search...
                </CommandEmpty>
              )}

              {debouncedQuery.length >= 2 && !isLoading && searchResults?.length === 0 && (
                <CommandEmpty>
                  No MBS items found for "{debouncedQuery}"
                </CommandEmpty>
              )}

              {searchResults && searchResults.length > 0 && (
                <CommandGroup>
                  {searchResults.map((item) => (
                    <CommandItem
                      key={item.itemNumber}
                      value={item.itemNumber.toString()}
                      onSelect={() => handleItemSelect(item)}
                      className="flex flex-col items-start gap-2 p-4 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {item.itemNumber}
                          </Badge>
                          <Badge variant="secondary">
                            {getProviderTypeLabel(item.providerType)}
                          </Badge>
                          {item.hasAnaesthetic && (
                            <Badge variant="destructive" className="text-xs">
                              Anaesthetic
                            </Badge>
                          )}
                          {!item.isActive && (
                            <Badge variant="outline" className="text-xs text-red-600">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(item.scheduleFee)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-left line-clamp-2">
                        {highlightMatch(item.description, debouncedQuery)}
                      </p>
                      
                      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                        <span>Category {item.category}</span>
                        <span>Relevance: {(item.relevanceScore * 100).toFixed(0)}%</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

### 2.2 SOAP Analyzer Component

Create `apps/web/src/components/mbs/suggestions/SoapAnalyzer.tsx`:

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Lightbulb
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SoapAnalyzerProps {
  className?: string;
  onSuggestionGenerated?: (suggestions: BillingSuggestion[]) => void;
}

interface BillingSuggestion {
  itemNumber: number;
  shortDescription: string;
  fullDescription: string;
  scheduleFee: number;
  benefitAmount: number;
  confidence: number;
  reasoning: string;
  matchedConcepts: string[];
  hasRestrictions: boolean;
  restrictions?: string;
}

const SAMPLE_SOAP_NOTES = [
  {
    label: "Standard Consultation",
    content: `S: 45-year-old male presents with 3-day history of productive cough and fever up to 38.5°C. No chest pain or shortness of breath.
O: T 37.8°C, BP 125/80, HR 88, RR 16. Chest examination reveals coarse crackles in right lower lobe. No lymphadenopathy.
A: Community-acquired pneumonia, right lower lobe
P: Amoxicillin 500mg TDS for 7 days. Follow-up in 48 hours if not improving. Return if SOB or chest pain develops.`
  },
  {
    label: "Complex Mental Health",
    content: `S: 28-year-old female with 6-month history of depression and anxiety. Recent job loss, relationship breakdown. Sleep disturbance, appetite loss, low mood daily. No suicidal ideation currently.
O: Appears tearful, good eye contact. Speech normal rate and tone. Mood depressed, affect congruent. No psychotic features.
A: Major depressive episode with anxiety features
P: Discussed treatment options including medication and psychology referral. Commenced sertraline 50mg daily. Mental Health Care Plan initiated. Psychology referral provided. Review in 2 weeks.`
  },
  {
    label: "Chronic Disease Management",
    content: `S: 65-year-old male with T2DM, hypertension, and hyperlipidemia for routine review. HbA1c last month 7.2%. Taking metformin, gliclazide, perindopril, atorvastatin. Generally well.
O: BP 138/82, BMI 29.2. Feet examination normal. No diabetic complications evident.
A: T2DM - reasonable control. Hypertension - target achieved. Hyperlipidemia - on treatment.
P: Continue current medications. Dietitian referral for weight management. Annual eye screen due. Team Care Arrangement updated. Review in 3 months.`
  },
];

export function SoapAnalyzer({ className, onSuggestionGenerated }: SoapAnalyzerProps) {
  const [soapNote, setSoapNote] = useState('');
  const [consultationType, setConsultationType] = useState<string>('standard');
  const [showSamples, setShowSamples] = useState(false);

  const suggestMutation = trpc.mbs.suggest.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Suggestions Generated",
        description: `Found ${data.suggestions.length} billing suggestions`,
        variant: "default",
      });
      onSuggestionGenerated?.(data.suggestions);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = useCallback(() => {
    if (soapNote.trim().length < 20) {
      toast({
        title: "Invalid Input",
        description: "Please enter at least 20 characters in the SOAP note",
        variant: "destructive",
      });
      return;
    }

    suggestMutation.mutate({
      soapNote: soapNote.trim(),
      consultationType: consultationType as any,
      providerType: 'G',
      includeLowConfidence: false,
    });
  }, [soapNote, consultationType, suggestMutation]);

  const handleSampleSelect = useCallback((sample: typeof SAMPLE_SOAP_NOTES[0]) => {
    setSoapNote(sample.content);
    setShowSamples(false);
    toast({
      title: "Sample Loaded",
      description: `Loaded: ${sample.label}`,
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  }, []);

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getConfidenceLabel = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SOAP Note Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SOAP Note Content</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSamples(!showSamples)}
                className="text-xs"
              >
                {showSamples ? 'Hide' : 'Show'} Samples
              </Button>
            </div>
            
            {showSamples && (
              <div className="grid gap-2 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Click to load sample:</p>
                {SAMPLE_SOAP_NOTES.map((sample, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSampleSelect(sample)}
                    className="justify-start h-auto p-2 text-left"
                  >
                    <div>
                      <div className="font-medium text-xs">{sample.label}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {sample.content.substring(0, 80)}...
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            <Textarea
              placeholder="Enter SOAP note content here..."
              value={soapNote}
              onChange={(e) => setSoapNote(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              disabled={suggestMutation.isPending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{soapNote.length} characters</span>
              <span>Minimum: 20 characters</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Consultation Type</label>
              <Select value={consultationType} onValueChange={setConsultationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Consultation</SelectItem>
                  <SelectItem value="complex">Complex Consultation</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="mental_health">Mental Health</SelectItem>
                  <SelectItem value="chronic_disease">Chronic Disease Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAnalyze}
                disabled={suggestMutation.isPending || soapNote.trim().length < 20}
                className="w-full"
              >
                {suggestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Suggestions
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {suggestMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Billing Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                {suggestMutation.data.summary}
              </AlertDescription>
            </Alert>

            {/* Processing Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {suggestMutation.data.processingTimeMs}ms
              </div>
              <div>Model: {suggestMutation.data.modelUsed}</div>
              <div>Type: {suggestMutation.data.detectedConsultationType}</div>
            </div>

            <Separator />

            {/* Suggestions List */}
            <div className="space-y-4">
              {suggestMutation.data.suggestions.map((suggestion, index) => (
                <Card key={suggestion.itemNumber} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {suggestion.itemNumber}
                        </Badge>
                        <Badge 
                          className={cn(
                            "text-xs",
                            getConfidenceColor(suggestion.confidence)
                          )}
                        >
                          {getConfidenceLabel(suggestion.confidence)} 
                          ({(suggestion.confidence * 100).toFixed(0)}%)
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {formatCurrency(suggestion.scheduleFee)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Benefit: {formatCurrency(suggestion.benefitAmount)}
                        </div>
                      </div>
                    </div>

                    <h4 className="font-medium mb-2">{suggestion.shortDescription}</h4>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {suggestion.fullDescription}
                    </p>

                    <div className="space-y-2">
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">REASONING</h5>
                        <p className="text-sm">{suggestion.reasoning}</p>
                      </div>

                      {suggestion.matchedConcepts.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">MATCHED CONCEPTS</h5>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.matchedConcepts.map((concept, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestion.hasRestrictions && suggestion.restrictions && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Restrictions:</strong> {suggestion.restrictions}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Extracted Concepts */}
            {suggestMutation.data.extractedConcepts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Extracted Medical Concepts</h4>
                <div className="flex flex-wrap gap-1">
                  {suggestMutation.data.extractedConcepts.map((concept, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### 2.3 Billing Sidebar Component

Create `apps/web/src/components/mbs/suggestions/BillingSidebar.tsx`:

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingSidebarProps {
  suggestions?: BillingSuggestion[];
  currentBilling?: CurrentBilling[];
  onAddToBill?: (suggestion: BillingSuggestion) => void;
  onViewDetail?: (itemNumber: number) => void;
  onDismiss?: (suggestionId: string) => void;
  className?: string;
}

interface BillingSuggestion {
  id?: string;
  itemNumber: number;
  shortDescription: string;
  scheduleFee: number;
  confidence: number;
  reasoning: string;
  matchedConcepts: string[];
  hasRestrictions: boolean;
  status?: 'suggested' | 'accepted' | 'dismissed';
}

interface CurrentBilling {
  itemNumber: number;
  description: string;
  fee: number;
  quantity: number;
}

export function BillingSidebar({
  suggestions = [],
  currentBilling = [],
  onAddToBill,
  onViewDetail,
  onDismiss,
  className,
}: BillingSidebarProps) {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set());

  const toggleExpanded = useCallback((itemNumber: number) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemNumber)) {
        newSet.delete(itemNumber);
      } else {
        newSet.add(itemNumber);
      }
      return newSet;
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  }, []);

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }, []);

  const getCurrentTotal = useCallback(() => {
    return currentBilling.reduce((sum, item) => sum + (item.fee * item.quantity), 0);
  }, [currentBilling]);

  const getPotentialTotal = useCallback(() => {
    const currentTotal = getCurrentTotal();
    const suggestedTotal = suggestions
      .filter(s => s.status !== 'dismissed')
      .reduce((sum, s) => sum + s.scheduleFee, 0);
    return currentTotal + suggestedTotal;
  }, [currentBilling, suggestions, getCurrentTotal]);

  const activeSuggestions = suggestions.filter(s => s.status !== 'dismissed');
  const potentialIncrease = getPotentialTotal() - getCurrentTotal();

  return (
    <div className={cn("w-80 border-l bg-card", className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Billing Assistant
        </h3>
        <p className="text-sm text-muted-foreground">
          AI-powered billing suggestions
        </p>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
        <div className="p-4 space-y-4">
          
          {/* Revenue Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Billing:</span>
                <span className="font-medium">{formatCurrency(getCurrentTotal())}</span>
              </div>
              {potentialIncrease > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Potential Increase:</span>
                    <span className="font-medium">+{formatCurrency(potentialIncrease)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Potential:</span>
                    <span className="text-green-600">{formatCurrency(getPotentialTotal())}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Current Billing Items */}
          {currentBilling.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Current Billing ({currentBilling.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentBilling.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <Badge variant="outline" className="mr-2 font-mono text-xs">
                        {item.itemNumber}
                      </Badge>
                      <span className="line-clamp-1">{item.description}</span>
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground"> x{item.quantity}</span>
                      )}
                    </div>
                    <span className="font-medium">{formatCurrency(item.fee * item.quantity)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {activeSuggestions.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Suggestions ({activeSuggestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeSuggestions.map((suggestion) => {
                  const isExpanded = expandedSuggestions.has(suggestion.itemNumber);
                  
                  return (
                    <div
                      key={suggestion.itemNumber}
                      className={cn(
                        "border rounded-lg p-3 space-y-2",
                        getConfidenceColor(suggestion.confidence)
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              {suggestion.itemNumber}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {(suggestion.confidence * 100).toFixed(0)}%
                            </Badge>
                            {suggestion.hasRestrictions && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm font-medium line-clamp-2">
                            {suggestion.shortDescription}
                          </p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(suggestion.scheduleFee)}
                          </p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 text-xs">
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Reasoning:</p>
                            <p className="text-sm">{suggestion.reasoning}</p>
                          </div>
                          
                          {suggestion.matchedConcepts.length > 0 && (
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Concepts:</p>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.matchedConcepts.slice(0, 3).map((concept, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {concept}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-1 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleExpanded(suggestion.itemNumber)}
                          className="flex-1 text-xs h-7"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {isExpanded ? 'Less' : 'More'}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => onViewDetail?.(suggestion.itemNumber)}
                          variant="outline"
                          className="text-xs h-7"
                        >
                          Details
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => onAddToBill?.(suggestion)}
                          className="text-xs h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDismiss?.(suggestion.id || suggestion.itemNumber.toString())}
                          className="text-xs h-7 text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No billing suggestions available</p>
                <p className="text-xs">Analyze a SOAP note to get started</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => window.open('https://www.mbsonline.gov.au', '_blank')}
              >
                <Eye className="h-3 w-3 mr-2" />
                View MBS Online
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => window.open('https://www.racgp.org.au', '_blank')}
              >
                <Eye className="h-3 w-3 mr-2" />
                RACGP Guidelines
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
```

### 2.4 Item Detail Drawer

Create `apps/web/src/components/mbs/details/ItemDrawer.tsx`:

```tsx
'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Calendar, 
  ExternalLink, 
  Info,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ItemDrawerProps {
  itemNumber: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToBill?: (itemNumber: number) => void;
}

export function ItemDrawer({ 
  itemNumber, 
  open, 
  onOpenChange, 
  onAddToBill 
}: ItemDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  const { data: item, isLoading, error } = trpc.mbs.getItem.useQuery(
    { itemNumber: itemNumber! },
    { enabled: !!itemNumber && open }
  );

  const formatCurrency = React.useCallback((amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  }, []);

  const formatDate = React.useCallback((dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-AU');
  }, []);

  const getProviderTypeLabel = React.useCallback((type: string | null) => {
    switch (type) {
      case 'G': return 'General Practitioner';
      case 'S': return 'Specialist';
      case 'AD': return 'Accredited Dental Practitioner';
      case 'AO': return 'Accredited Orthodontist';
      case 'AOS': return 'Approved Oral Surgeon';
      default: return 'Any Provider';
    }
  }, []);

  const handleCopyItemNumber = React.useCallback(() => {
    if (itemNumber) {
      navigator.clipboard.writeText(itemNumber.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: `Item number ${itemNumber} copied to clipboard`,
      });
    }
  }, [itemNumber]);

  const handleAddToBill = React.useCallback(() => {
    if (itemNumber) {
      onAddToBill?.(itemNumber);
      toast({
        title: "Added to Bill",
        description: `Item ${itemNumber} added to billing`,
      });
    }
  }, [itemNumber, onAddToBill]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            MBS Item {itemNumber}
            {itemNumber && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyItemNumber}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Detailed information and billing guidelines
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load item details: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {item && (
            <>
              {/* Status and Basic Info */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={item.isActive ? "default" : "destructive"}
                          className="font-mono"
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {item.isNewItem && (
                          <Badge variant="secondary">New Item</Badge>
                        )}
                        {item.hasAnaesthetic && (
                          <Badge variant="destructive">Anaesthetic</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Category {item.category} • {getProviderTypeLabel(item.providerType)}
                      </p>
                    </div>
                    
                    {onAddToBill && (
                      <Button onClick={handleAddToBill} className="shrink-0">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Add to Bill
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-sm leading-relaxed">{item.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4" />
                    Fee Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Schedule Fee</p>
                      <p className="text-lg font-semibold">{formatCurrency(item.scheduleFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">75% Benefit</p>
                      <p className="text-lg font-semibold text-blue-600">{formatCurrency(item.benefit75)}</p>
                    </div>
                  </div>

                  {(item.benefit85 || item.benefit100) && (
                    <div className="grid grid-cols-2 gap-4">
                      {item.benefit85 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">85% Benefit</p>
                          <p className="text-lg font-semibold text-green-600">{formatCurrency(item.benefit85)}</p>
                        </div>
                      )}
                      {item.benefit100 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">100% Benefit</p>
                          <p className="text-lg font-semibold text-green-600">{formatCurrency(item.benefit100)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {item.hasAnaesthetic && item.anaestheticBasicUnits && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Anaesthetic Basic Units</p>
                      <p className="font-medium">{item.anaestheticBasicUnits}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Derived Fee */}
              {item.derivedFeeDescription && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Derived Fee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{item.derivedFeeDescription}</p>
                  </CardContent>
                </Card>
              )}

              {/* Dates and Validity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Validity Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Item Start Date</p>
                      <p>{formatDate(item.itemStartDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Item End Date</p>
                      <p>{formatDate(item.itemEndDate)}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last updated: {formatDate(item.lastUpdated)}
                  </div>
                </CardContent>
              </Card>

              {/* External Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open(`https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Item-${item.itemNumber}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on MBS Online
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open('https://www.racgp.org.au/education/professional-development/online-learning/gplearning/clinical-areas', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    RACGP Guidelines
                  </Button>
                </CardContent>
              </Card>

              {/* Compliance Notice */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This information is based on the Medicare Benefits Schedule and should be used as a guide only. 
                  Always refer to the official MBS and consult with your medical billing specialist for complex cases. 
                  Billing must comply with all relevant Medicare guidelines and regulations.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### 2.5 Comparison Table Component

Create `apps/web/src/components/mbs/comparison/ComparisonTable.tsx`:

```tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  currentBilling: BillingItem[];
  suggestedBilling: BillingItem[];
  onViewItem?: (itemNumber: number) => void;
  className?: string;
}

interface BillingItem {
  itemNumber: number;
  description: string;
  fee: number;
  quantity?: number;
  confidence?: number;
  status?: 'current' | 'suggested' | 'missed';
}

export function ComparisonTable({
  currentBilling,
  suggestedBilling,
  onViewItem,
  className,
}: ComparisonTableProps) {
  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  }, []);

  const getCurrentTotal = React.useCallback(() => {
    return currentBilling.reduce((sum, item) => sum + (item.fee * (item.quantity || 1)), 0);
  }, [currentBilling]);

  const getSuggestedTotal = React.useCallback(() => {
    return suggestedBilling.reduce((sum, item) => sum + (item.fee * (item.quantity || 1)), 0);
  }, [suggestedBilling]);

  const getPotentialIncrease = React.useCallback(() => {
    return getSuggestedTotal() - getCurrentTotal();
  }, [getCurrentTotal, getSuggestedTotal]);

  const getRowIcon = React.useCallback((status: string) => {
    switch (status) {
      case 'current':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'suggested':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  const getRowClassName = React.useCallback((status: string) => {
    switch (status) {
      case 'current':
        return 'bg-green-50 border-green-200';
      case 'suggested':
        return 'bg-blue-50 border-blue-200';
      case 'missed':
        return 'bg-orange-50 border-orange-200';
      default:
        return '';
    }
  }, []);

  // Combine and deduplicate items
  const allItems = React.useMemo(() => {
    const itemMap = new Map<number, BillingItem & { type: 'current' | 'suggested' | 'both' }>();

    // Add current billing items
    currentBilling.forEach(item => {
      itemMap.set(item.itemNumber, { ...item, type: 'current', status: 'current' });
    });

    // Add suggested items (mark as 'both' if already exists)
    suggestedBilling.forEach(item => {
      const existing = itemMap.get(item.itemNumber);
      if (existing) {
        itemMap.set(item.itemNumber, { ...existing, type: 'both' });
      } else {
        itemMap.set(item.itemNumber, { ...item, type: 'suggested', status: 'suggested' });
      }
    });

    return Array.from(itemMap.values()).sort((a, b) => a.itemNumber - b.itemNumber);
  }, [currentBilling, suggestedBilling]);

  const potentialIncrease = getPotentialIncrease();
  const percentageIncrease = getCurrentTotal() > 0 ? (potentialIncrease / getCurrentTotal()) * 100 : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Billing</p>
              <p className="text-2xl font-bold">{formatCurrency(getCurrentTotal())}</p>
              <p className="text-xs text-muted-foreground">{currentBilling.length} items</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Suggested Billing</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(getSuggestedTotal())}</p>
              <p className="text-xs text-muted-foreground">{suggestedBilling.length} items</p>
            </div>
            
            <div className={cn(
              "text-center p-4 rounded-lg",
              potentialIncrease > 0 ? "bg-green-50" : potentialIncrease < 0 ? "bg-red-50" : "bg-gray-50"
            )}>
              <p className="text-sm text-muted-foreground">Potential Change</p>
              <div className="flex items-center justify-center gap-1">
                {potentialIncrease > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : potentialIncrease < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : null}
                <p className={cn(
                  "text-2xl font-bold",
                  potentialIncrease > 0 ? "text-green-600" : potentialIncrease < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {potentialIncrease > 0 ? '+' : ''}{formatCurrency(potentialIncrease)}
                </p>
              </div>
              {Math.abs(percentageIncrease) > 0.1 && (
                <p className="text-xs text-muted-foreground">
                  {percentageIncrease > 0 ? '+' : ''}{percentageIncrease.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Item-by-Item Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground py-2 border-b">
              <div className="col-span-1"></div>
              <div className="col-span-2">Item</div>
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Fee</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            {allItems.map((item) => (
              <div
                key={item.itemNumber}
                className={cn(
                  "grid grid-cols-12 gap-2 py-3 px-2 rounded-lg border text-sm items-center",
                  getRowClassName(item.status || 'current')
                )}
              >
                <div className="col-span-1 flex justify-center">
                  {getRowIcon(item.status || 'current')}
                </div>
                
                <div className="col-span-2">
                  <Badge variant="outline" className="font-mono">
                    {item.itemNumber}
                  </Badge>
                </div>
                
                <div className="col-span-5">
                  <p className="line-clamp-2">{item.description}</p>
                  {item.confidence && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {(item.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  )}
                </div>
                
                <div className="col-span-2 font-medium">
                  {formatCurrency(item.fee)}
                </div>
                
                <div className="col-span-1 text-center">
                  {item.quantity || 1}
                </div>
                
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewItem?.(item.itemNumber)}
                    className="h-6 w-6 p-0"
                  >
                    <AlertCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {allItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No billing items to compare</p>
                <p className="text-xs">Add current billing or generate suggestions to see comparison</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Currently Billed</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              <span>AI Suggested</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <span>Potential Opportunity</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 3. Main Integration Pages

### 3.1 MBS Dashboard Page

Create `apps/web/src/app/mbs/page.tsx`:

```tsx
import React from 'react';
import { Metadata } from 'next';
import { MbsDashboard } from '@/components/mbs/MbsDashboard';

export const metadata: Metadata = {
  title: 'MBS Billing Assistant | Aria Scribe',
  description: 'AI-powered Medicare Benefits Schedule billing suggestions and search',
};

export default function MbsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">MBS Billing Assistant</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered billing suggestions based on your consultation notes
        </p>
      </div>
      
      <MbsDashboard />
    </div>
  );
}
```

### 3.2 Main Dashboard Component

Create `apps/web/src/components/mbs/MbsDashboard.tsx`:

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SoapAnalyzer } from './suggestions/SoapAnalyzer';
import { MbsSearchCombobox } from './search/MbsSearchCombobox';
import { BillingSidebar } from './suggestions/BillingSidebar';
import { ComparisonTable } from './comparison/ComparisonTable';
import { ItemDrawer } from './details/ItemDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Brain, BarChart3, History } from 'lucide-react';

interface BillingSuggestion {
  id?: string;
  itemNumber: number;
  shortDescription: string;
  scheduleFee: number;
  confidence: number;
  reasoning: string;
  matchedConcepts: string[];
  hasRestrictions: boolean;
  status?: 'suggested' | 'accepted' | 'dismissed';
}

interface CurrentBilling {
  itemNumber: number;
  description: string;
  fee: number;
  quantity: number;
}

export function MbsDashboard() {
  const [suggestions, setSuggestions] = useState<BillingSuggestion[]>([]);
  const [currentBilling, setCurrentBilling] = useState<CurrentBilling[]>([]);
  const [selectedItemNumber, setSelectedItemNumber] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSuggestionGenerated = useCallback((newSuggestions: BillingSuggestion[]) => {
    setSuggestions(newSuggestions.map(s => ({ ...s, status: 'suggested' as const })));
  }, []);

  const handleAddToBill = useCallback((suggestion: BillingSuggestion) => {
    