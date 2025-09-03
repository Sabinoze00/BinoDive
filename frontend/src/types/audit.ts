// Audit System Types

export interface UserProduct {
  name: string;
  brand: string;
  asin?: string;
  price: number;
  category: string;
  features: string[];
  targetKeywords: string[];
  uniqueSellingPoints: string[];
  currentPerformance?: {
    monthlyRevenue?: number;
    monthlySales?: number;
    conversionRate?: number;
  };
}

export interface UserAnalysis {
  id: string;
  title: string;
  content: string;
  category: 'market_insight' | 'competitor_analysis' | 'keyword_strategy' | 'pricing_strategy' | 'other';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: Date;
}

export interface SessionEvent {
  id: string;
  timestamp: Date;
  sessionId: string;
  analysisId: string;
  eventType: 'upload' | 'filter' | 'delete' | 'restore' | 'view_change' | 'analysis_add' | 'product_add';
  action: string;
  details: Record<string, unknown>;
  duration?: number;
}

export interface BrandOpportunity {
  type: 'brand_defense' | 'brand_attack';
  targetBrand: string;
  searchVolume: number;
  competitorPresence: boolean;
  estimatedConversion: number;
  potentialRevenue: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface KeywordGap {
  keyword: string;
  searchVolume: number;
  competitorStrength: 'weak' | 'medium' | 'strong';
  userProductRelevance: number;
  opportunity: 'high' | 'medium' | 'low';
  suggestedStrategy: string;
}

export interface PriceGap {
  priceRange: {
    min: number;
    max: number;
  };
  competitorCount: number;
  averageRevenue: number;
  userProductFit: 'perfect' | 'good' | 'poor';
  opportunity: string;
}

export interface CompetitorSegment {
  name: string;
  priceRange: {
    min: number;
    max: number;
  };
  marketShare: number;
  characteristics: string[];
  keyPlayers: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface AuditDataInput {
  // Base session data
  sessionId: string;
  analysisId: string;
  brandName: string;
  analysisDate: Date;
  
  // Market data
  marketSnapshot: {
    totalSearchVolume: number;
    totalRevenue: number;
    averageAOV: number;
    competitorCount: number;
    topCompetitors: string[];
    topKeywords: string[];
  };
  
  // User context
  userProduct?: UserProduct;
  userAnalyses: UserAnalysis[];
  
  // Session behavior insights
  userBehavior: {
    timeSpent: {
      competitors: number;
      keywords: number;
      products: number;
    };
    focusedCompetitors: string[];
    appliedFilters: {
      type: string;
      value: unknown;
      resultsCount: number;
    }[];
    deletedItems: {
      keywords: string[];
      competitors: string[];
      products: string[];
    };
    restoredItems: {
      keywords: string[];
      competitors: string[];
      products: string[];
    };
  };
  
  // Identified opportunities
  opportunities: {
    brandDefense: BrandOpportunity[];
    brandAttack: BrandOpportunity[];
    keywordGaps: KeywordGap[];
    priceGaps: PriceGap[];
  };
  
  // Market segmentation
  competitorSegments: CompetitorSegment[];
}

export interface AuditSection {
  title: string;
  content: string;
  data?: unknown[];
  charts?: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'scatter';
  title: string;
  data: unknown[];
  config: Record<string, unknown>;
}

export interface AuditReport {
  id: string;
  sessionId: string;
  brandName: string;
  generatedAt: Date;
  
  // Report sections
  executiveSummary: AuditSection;
  marketAnalysis: AuditSection;
  opportunityAnalysis: AuditSection;
  competitorIntelligence: AuditSection;
  userProductAnalysis?: AuditSection;
  userInsights?: AuditSection;
  roadmap: AuditSection;
  conclusions: AuditSection;
  
  // Metadata
  confidence: number;
  dataQuality: 'high' | 'medium' | 'low';
  recommendations: string[];
  nextSteps: string[];
  
  // Export options
  exportFormats: ('html' | 'pdf' | 'docx')[];
}

export interface DeepSeekAuditRequest {
  model: string;
  messages: {
    role: 'system' | 'user';
    content: string;
  }[];
  temperature: number;
  max_tokens: number;
}

export interface AuditGenerationConfig {
  aiProvider: 'deepseek';
  model: string;
  temperature: number;
  maxTokens: number;
  includeCharts: boolean;
  includeUserProduct: boolean;
  includeUserAnalyses: boolean;
  focusAreas: string[];
}