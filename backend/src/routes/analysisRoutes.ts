import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import { upload } from '../middleware/upload';

const router = Router();

// POST /api/v1/analysis - Upload and process CSV files
router.post('/', 
  upload.fields([
    { name: 'keywordAnalysisFile', maxCount: 1 },
    { name: 'businessDataFile', maxCount: 1 },
    { name: 'productDataFile', maxCount: 1 }
  ]),
  AnalysisController.uploadFiles
);

// GET /api/v1/analysis/:analysisId - Get analysis data
router.get('/:analysisId', AnalysisController.getAnalysis);

// PUT /api/v1/analysis/:analysisId/keywords - Update keywords (delete/restore)
router.put('/:analysisId/keywords', AnalysisController.updateKeywords);

// PUT /api/v1/analysis/:analysisId/root-keywords - Update root keywords (delete/restore)
router.put('/:analysisId/root-keywords', AnalysisController.updateRootKeywords);

// PUT /api/v1/analysis/:analysisId/competitors - Update competitors (delete/restore)
router.put('/:analysisId/competitors', AnalysisController.updateCompetitors);

// PUT /api/v1/analysis/:analysisId/products - Update products (delete/restore)
router.put('/:analysisId/products', AnalysisController.updateProducts);

export { router as analysisRoutes };