'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MbsSearchCombobox } from './search/MbsSearchCombobox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomButton } from '@/components/CustomButton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Brain, BarChart3, History, Info, ExternalLink } from 'lucide-react';
import { api } from '@/trpc/react';

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

interface SelectedItem {
  item: MbsSearchResult;
  selectedAt: Date;
}

export function MbsDashboard() {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedItemNumber, setSelectedItemNumber] = useState<number | null>(null);

  // Get search filters for the filter options
  const { data: searchFilters } = api.mbs.getSearchFilters.useQuery();

  // Get item details when an item is selected
  const { data: itemDetails, isLoading: itemLoading } = api.mbs.getItem.useQuery(
    { itemNumber: selectedItemNumber! },
    { enabled: !!selectedItemNumber }
  );

  const handleItemSelect = useCallback((item: MbsSearchResult) => {
    setSelectedItemNumber(item.itemNumber);
    
    // Add to selected items if not already there
    const exists = selectedItems.some(selected => selected.item.itemNumber === item.itemNumber);
    if (!exists) {
      setSelectedItems(prev => [...prev, { item, selectedAt: new Date() }]);
    }
  }, [selectedItems]);

  const handleRemoveItem = useCallback((itemNumber: number) => {
    setSelectedItems(prev => prev.filter(selected => selected.item.itemNumber !== itemNumber));
    if (selectedItemNumber === itemNumber) {
      setSelectedItemNumber(null);
    }
  }, [selectedItemNumber]);

  const formatCurrency = (amount: number | null) => {
    if (amount == null || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const getProviderTypeLabel = (type: string | null) => {
    switch (type) {
      case 'G': return 'GP';
      case 'S': return 'Specialist';
      case 'AD': return 'Dental';
      default: return 'Any';
    }
  };

  const totalFees = selectedItems.reduce((sum, selected) => {
    const fee = Number(selected.item.scheduleFee);
    // Only add if fee is a valid number
    if (!isNaN(fee) && fee !== null) {
      return sum + fee;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MBS Billing Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Search Medicare Benefits Schedule items and build your billing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {searchFilters?.categories?.length || 0} Categories
          </Badge>
          <Badge variant="outline" className="text-sm">
            Text Search Active
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    MBS Item Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MbsSearchCombobox
                    onItemSelect={handleItemSelect}
                    placeholder="Search by item number, description, or keyword..."
                    className="w-full"
                  />
                  
                  <div className="text-sm text-muted-foreground">
                    Search through {searchFilters?.categories?.reduce((sum, cat) => sum + cat.count, 0) || 0} active MBS items
                  </div>
                </CardContent>
              </Card>

              {/* Selected Item Details */}
              {selectedItemNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Item Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {itemLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                      </div>
                    ) : itemDetails ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-lg px-3 py-1">
                              {itemDetails.itemNumber}
                            </Badge>
                            <Badge variant="secondary">
                              {getProviderTypeLabel(itemDetails.providerType)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-green-600 text-lg font-semibold">
                            {formatCurrency(itemDetails.scheduleFee)}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Description</h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {itemDetails.description || 'No description available'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Category:</span> {itemDetails.category}
                          </div>
                          <div>
                            <span className="font-medium">Benefit (75%):</span> {formatCurrency(itemDetails.benefit75)}
                          </div>
                          <div>
                            <span className="font-medium">Benefit (85%):</span> {formatCurrency(itemDetails.benefit85)}
                          </div>
                          <div>
                            <span className="font-medium">Anaesthetic:</span> {itemDetails.hasAnaesthetic ? 'Yes' : 'No'}
                          </div>
                        </div>
                        
                        {itemDetails.itemStartDate && (
                          <div className="text-sm">
                            <span className="font-medium">Start Date:</span> {new Date(itemDetails.itemStartDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Item not found</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Selected Items Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Selected Items</span>
                    <Badge variant="outline">{selectedItems.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No items selected. Search and select MBS items to add them here.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedItems.map((selected) => (
                        <div key={selected.item.itemNumber} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{selected.item.itemNumber}</Badge>
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(selected.item.itemNumber)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              ×
                            </CustomButton>
                          </div>
                          <p className="text-sm text-gray-700">
                            {selected.item.description?.substring(0, 60)}...
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {getProviderTypeLabel(selected.item.providerType)}
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(selected.item.scheduleFee)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(totalFees)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Billing Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Suggestions Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Upload SOAP notes to get AI-powered MBS item suggestions based on consultation content.
                </p>
                <Badge variant="outline">Requires OpenAI API Key</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total MBS Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {searchFilters?.categories?.reduce((sum, cat) => sum + cat.count, 0)?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Active items available</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchFilters?.categories?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Service categories</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Provider Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchFilters?.providerTypes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Different providers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Search History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Search History</h3>
                <p className="text-muted-foreground">
                  Your recent searches and billing sessions will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
