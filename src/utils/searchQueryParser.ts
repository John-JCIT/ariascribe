/**
 * Smart MBS Search Query Parser
 * Analyzes search queries to determine intent and extract components
 */

export enum SearchIntent {
  EXACT_ITEM_NUMBER = 'exact_item_number',    // "23", "123"
  ITEM_NUMBER_PLUS_TEXT = 'item_number_text', // "23 consultation", "item 45 anaesthetic"
  TEXT_SEARCH = 'text_search'                 // "general practitioner", "consultation"
}

export interface ParsedQuery {
  intent: SearchIntent;
  itemNumber?: number;
  textQuery?: string;
  originalQuery: string;
  confidence: number; // 0-1 confidence in the parsing
}

/**
 * Parse a search query to determine intent and extract components
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return {
      intent: SearchIntent.TEXT_SEARCH,
      originalQuery: query,
      confidence: 0
    };
  }

  // Pattern 1: Pure numeric (exact item number search)
  const pureNumericMatch = /^(\d{1,6})$/.exec(trimmedQuery);
  if (pureNumericMatch) {
    const itemNumber = parseInt(pureNumericMatch[1], 10);
    return {
      intent: SearchIntent.EXACT_ITEM_NUMBER,
      itemNumber,
      originalQuery: query,
      confidence: 1.0
    };
  }

  // Pattern 2: Item number with keywords
  const itemNumberPatterns = [
    /^(?:item\s+|mbs\s+|#)?(\d{1,6})\s+(.+)$/i,           // "item 23 consultation", "123 anaesthetic"
    /^(.+?)\s+(?:item\s+|mbs\s+|#)(\d{1,6})$/i,          // "consultation item 23"
    /^(?:item\s+|mbs\s+)(\d{1,6})$/i,                     // "item 23", "mbs 123"
  ];

  for (const pattern of itemNumberPatterns) {
    const match = pattern.exec(trimmedQuery);
    if (match) {
      // Determine which group contains the number vs text
      const group1IsNumber = /^\d+$/.test(match[1]);
      const itemNumber = parseInt(group1IsNumber ? match[1] : match[2], 10);
      const textPart = group1IsNumber ? match[2] : match[1];
      
      return {
        intent: SearchIntent.ITEM_NUMBER_PLUS_TEXT,
        itemNumber,
        textQuery: textPart?.trim(),
        originalQuery: query,
        confidence: 0.9
      };
    }
  }

  // Pattern 3: Number at start or end (partial item number match)
  const partialItemNumberPatterns = [
    /^(\d{1,6})\s+(.+)$/,  // "23 something"
    /^(.+?)\s+(\d{1,6})$/  // "something 23"
  ];

  for (const pattern of partialItemNumberPatterns) {
    const match = pattern.exec(trimmedQuery);
    if (match) {
      const group1IsNumber = /^\d+$/.test(match[1]);
      const itemNumber = parseInt(group1IsNumber ? match[1] : match[2], 10);
      const textPart = group1IsNumber ? match[2] : match[1];
      
      // Lower confidence since we're not sure if the number is meant to be an item number
      return {
        intent: SearchIntent.ITEM_NUMBER_PLUS_TEXT,
        itemNumber,
        textQuery: textPart?.trim(),
        originalQuery: query,
        confidence: 0.7
      };
    }
  }

  // Default: Pure text search
  return {
    intent: SearchIntent.TEXT_SEARCH,
    textQuery: trimmedQuery,
    originalQuery: query,
    confidence: 0.8
  };
}

/**
 * Generate search suggestions based on query analysis
 */
export function generateSearchSuggestions(parsedQuery: ParsedQuery): string[] {
  const suggestions: string[] = [];
  
  if (parsedQuery.intent === SearchIntent.EXACT_ITEM_NUMBER && parsedQuery.itemNumber) {
    suggestions.push(`Item ${parsedQuery.itemNumber}`);
    suggestions.push(`MBS ${parsedQuery.itemNumber}`);
  }
  
  if (parsedQuery.intent === SearchIntent.ITEM_NUMBER_PLUS_TEXT && parsedQuery.itemNumber) {
    suggestions.push(`Item ${parsedQuery.itemNumber}`);
    if (parsedQuery.textQuery) {
      suggestions.push(parsedQuery.textQuery);
    }
  }
  
  return suggestions;
}

/**
 * Determine if a query should trigger exact item number search
 */
export function shouldSearchExactItem(parsedQuery: ParsedQuery): boolean {
  return parsedQuery.intent === SearchIntent.EXACT_ITEM_NUMBER || 
         (parsedQuery.intent === SearchIntent.ITEM_NUMBER_PLUS_TEXT && parsedQuery.confidence >= 0.8);
}

/**
 * Get display-friendly description of search intent
 */
export function getSearchIntentDescription(intent: SearchIntent): string {
  switch (intent) {
    case SearchIntent.EXACT_ITEM_NUMBER:
      return 'Searching for exact item number';
    case SearchIntent.ITEM_NUMBER_PLUS_TEXT:
      return 'Searching by item number and keywords';
    case SearchIntent.TEXT_SEARCH:
      return 'Searching by keywords';
    default:
      return 'Searching';
  }
}
