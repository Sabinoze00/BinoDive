import { Request, Response } from 'express';
import { DataProcessor } from '../services/dataProcessor';
import { ApiResponse, UploadFilesResponse, KeywordUpdateResponse, ProductUpdateResponse } from '../types/analysis';

export class AnalysisController {
  static async uploadFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.keywordAnalysisFile || !files.businessDataFile || !files.productDataFile) {
        res.status(400).json({
          success: false,
          error: 'All three CSV files are required: keywordAnalysisFile, businessDataFile, productDataFile'
        } as ApiResponse<null>);
        return;
      }

      const keywordFile = files.keywordAnalysisFile[0];
      const businessFile = files.businessDataFile[0];
      const productFile = files.productDataFile[0];

      const analysisId = await DataProcessor.processFiles(keywordFile, businessFile, productFile);
      const analysisData = DataProcessor.getAnalysisData(analysisId);

      if (!analysisData) {
        res.status(500).json({
          success: false,
          error: 'Failed to process analysis data'
        } as ApiResponse<null>);
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          summary: {
            totalKeywords: analysisData.keywordList.length,
            totalCompetitors: analysisData.competitorAnalysis.length,
            totalMarketSV: analysisData.marketSummary.totalMarketSV
          }
        } as UploadFilesResponse
      } as ApiResponse<UploadFilesResponse>);

    } catch (error) {
      console.error('Upload files error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async getAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;

      if (!analysisId) {
        res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        } as ApiResponse<null>);
        return;
      }

      const analysisData = DataProcessor.getAnalysisData(analysisId);

      if (!analysisData) {
        res.status(404).json({
          success: false,
          error: 'Analysis not found'
        } as ApiResponse<null>);
        return;
      }

      res.status(200).json({
        success: true,
        data: analysisData
      });

    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async updateKeywords(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      const { deletedKeywords, restoredKeywords } = req.body;

      if (!analysisId) {
        res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        } as ApiResponse<null>);
        return;
      }

      if (!Array.isArray(deletedKeywords) || !Array.isArray(restoredKeywords)) {
        res.status(400).json({
          success: false,
          error: 'deletedKeywords and restoredKeywords must be arrays'
        } as ApiResponse<null>);
        return;
      }

      const success = await DataProcessor.updateKeywords(analysisId, deletedKeywords, restoredKeywords);
      
      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to update keywords'
        } as ApiResponse<null>);
        return;
      }

      // Get updated data
      const analysisData = DataProcessor.getAnalysisData(analysisId);
      const affectedCompetitors = analysisData?.competitorAnalysis.map(c => c.asin) || [];

      res.status(200).json({
        success: true,
        data: {
          success: true,
          recalculated: true,
          newMarketSV: analysisData?.marketSummary.totalMarketSV || 0,
          affectedCompetitors
        } as KeywordUpdateResponse
      });

    } catch (error) {
      console.error('Update keywords error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async updateRootKeywords(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      const { deletedRootWords, restoredRootWords } = req.body;

      if (!analysisId) {
        res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        } as ApiResponse<null>);
        return;
      }

      if (!Array.isArray(deletedRootWords) || !Array.isArray(restoredRootWords)) {
        res.status(400).json({
          success: false,
          error: 'deletedRootWords and restoredRootWords must be arrays'
        } as ApiResponse<null>);
        return;
      }

      const success = await DataProcessor.updateRootKeywords(analysisId, deletedRootWords, restoredRootWords);
      
      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to update root keywords'
        } as ApiResponse<null>);
        return;
      }

      // Get updated data
      const analysisData = DataProcessor.getAnalysisData(analysisId);
      const affectedCompetitors = analysisData?.competitorAnalysis.map(c => c.asin) || [];

      res.status(200).json({
        success: true,
        data: {
          success: true,
          recalculated: true,
          newMarketSV: analysisData?.marketSummary.totalMarketSV || 0,
          affectedCompetitors
        } as KeywordUpdateResponse
      });

    } catch (error) {
      console.error('Update root keywords error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async updateCompetitors(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      const { deletedCompetitors, restoredCompetitors } = req.body;

      if (!analysisId) {
        res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        } as ApiResponse<null>);
        return;
      }

      if (!Array.isArray(deletedCompetitors) || !Array.isArray(restoredCompetitors)) {
        res.status(400).json({
          success: false,
          error: 'deletedCompetitors and restoredCompetitors must be arrays'
        } as ApiResponse<null>);
        return;
      }

      const success = await DataProcessor.updateCompetitors(analysisId, deletedCompetitors, restoredCompetitors);
      
      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to update competitors'
        } as ApiResponse<null>);
        return;
      }

      // Get updated data
      const analysisData = DataProcessor.getAnalysisData(analysisId);

      res.status(200).json({
        success: true,
        data: {
          success: true,
          recalculated: true,
          newMarketSV: analysisData?.marketSummary.totalMarketSV || 0,
          affectedCompetitors: deletedCompetitors.concat(restoredCompetitors)
        } as KeywordUpdateResponse
      });

    } catch (error) {
      console.error('Update competitors error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async updateProducts(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      const { deletedProducts, restoredProducts } = req.body;

      if (!analysisId) {
        res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        } as ApiResponse<null>);
        return;
      }

      if (!Array.isArray(deletedProducts) || !Array.isArray(restoredProducts)) {
        res.status(400).json({
          success: false,
          error: 'deletedProducts and restoredProducts must be arrays'
        } as ApiResponse<null>);
        return;
      }

      const success = await DataProcessor.updateProducts(analysisId, deletedProducts, restoredProducts);
      
      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to update products'
        } as ApiResponse<null>);
        return;
      }

      // Get updated data
      const analysisData = DataProcessor.getAnalysisData(analysisId);
      
      res.status(200).json({
        success: true,
        data: {
          success: true,
          recalculated: true,
          affectedKeywords: [] // Products don't affect keywords directly
        } as ProductUpdateResponse
      });

    } catch (error) {
      console.error('Update products error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse<null>);
    }
  }
}