export interface KeywordRow {
    keywordPhrase: string;
    searchVolume: number;
    relevance: number;
    isBrand: boolean;
    brandWord: string | null;
    rankings: Record<string, number>;
}
export interface BusinessRow {
    asin: string;
    brand: string;
    imageUrl: string;
    sellerCountry: string;
    rating: number;
    creationDate: Date;
    price: string;
    sales: number;
    revenue: string;
    category: string;
}
export interface ProductRow {
    asin: string;
    brand: string;
    imageUrl: string;
    variationAsins: string[];
}
export interface ProcessedKeyword {
    keywordPhrase: string;
    searchVolume: number;
    isBrand: boolean;
    brandWord: string | null;
    relevance: number;
    isDeleted: boolean;
    rankings: Record<string, number>;
}
export interface Competitor {
    asin: string;
    brand: string;
    imageUrl: string;
    strengthPercentage: number;
    strengthLevel: 'Molto Forte' | 'Forte' | 'Medio' | 'Debole';
    sellerCountry: string;
    variations: number;
    rating: number;
    listingAgeMonths: number;
    price: string;
    sales: number;
    revenue: string;
    category: string;
}
export interface StrengthSummary {
    moltoForte: number;
    forte: number;
    medio: number;
    debole: number;
}
export interface MarketSummary {
    totalMarketSV: number;
    uniqueBrands: number;
    totalKeywords: number;
    deletedKeywords: number;
}
export interface CompetitorMetrics {
    asin: string;
    strengthPercentage: number;
    strengthLevel: string;
    top30KeywordsSV: number;
}
export interface AnalysisData {
    analysisId: string;
    marketSummary: MarketSummary;
    competitorAnalysis: Competitor[];
    keywordList: ProcessedKeyword[];
    strengthSummary: StrengthSummary;
}
export interface AnalysisSession {
    id: string;
    createdAt: Date;
    originalData: {
        keywordData: KeywordRow[];
        businessData: BusinessRow[];
        productData: ProductRow[];
    };
    processedData: {
        competitors: Competitor[];
        keywords: ProcessedKeyword[];
        deletedKeywords: Set<string>;
    };
    calculations: {
        totalMarketSV: number;
        strengthSummary: StrengthSummary;
        competitorMetrics: Map<string, CompetitorMetrics>;
    };
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface UploadFilesResponse {
    analysisId: string;
    summary: {
        totalKeywords: number;
        totalCompetitors: number;
        totalMarketSV: number;
    };
}
export interface KeywordUpdateRequest {
    deletedKeywords: string[];
    restoredKeywords: string[];
}
export interface KeywordUpdateResponse {
    success: boolean;
    recalculated: boolean;
    newMarketSV: number;
    affectedCompetitors: string[];
}
