export * from '../../../shared/types/analysis';

// Additional types for API responses
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

export interface ProductUpdateRequest {
  deletedProducts: string[];
  restoredProducts: string[];
}

export interface ProductUpdateResponse {
  success: boolean;
  recalculated: boolean;
  affectedKeywords: string[];
}