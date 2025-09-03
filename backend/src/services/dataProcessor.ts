import { AnalysisSession, KeywordRow, BusinessRow, ProductRow } from '../types/analysis';
import { CSVParser } from './csvParser';
import { CalculationEngine } from './calculationEngine';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export class DataProcessor {
  private static sessions = new Map<string, AnalysisSession>();
  private static readonly DATA_DIR = path.join(__dirname, '../../data');

  static async processFiles(
    keywordFile: Express.Multer.File,
    businessFile: Express.Multer.File,
    productFile: Express.Multer.File
  ): Promise<string> {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.DATA_DIR)) {
        fs.mkdirSync(this.DATA_DIR, { recursive: true });
      }

      // Parse CSV files
      const keywordContent = fs.readFileSync(keywordFile.path, 'utf-8');
      const businessContent = fs.readFileSync(businessFile.path, 'utf-8');
      const productContent = fs.readFileSync(productFile.path, 'utf-8');

      const [keywordData, businessData, productData] = await Promise.all([
        CSVParser.parseKeywordAnalysis(keywordContent),
        CSVParser.parseBusinessData(businessContent),
        CSVParser.parseProductData(productContent)
      ]);

      // Create analysis session
      const sessionId = uuidv4();
      const session: AnalysisSession = {
        id: sessionId,
        createdAt: new Date(),
        originalData: {
          keywordData,
          businessData,
          productData
        },
        processedData: {
          competitors: [],
          keywords: [],
          rootKeywords: [],
          products: [],
          deletedKeywords: new Set<string>(),
          deletedRootKeywords: new Set<string>(),
          deletedCompetitors: new Set<string>(),
          deletedProducts: new Set<string>()
        },
        calculations: {
          totalMarketSV: 0,
          brandSV: 0,
          strengthSummary: { moltoForte: 0, forte: 0, medio: 0, debole: 0 },
          competitorMetrics: new Map()
        }
      };

      // Process initial data and calculate metrics
      CalculationEngine.processInitialData(session);

      // Store session
      this.sessions.set(sessionId, session);
      
      // Save to file for persistence
      await this.saveSession(session);

      // Clean up uploaded files
      [keywordFile.path, businessFile.path, productFile.path].forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      return sessionId;
    } catch (error) {
      console.error('Error processing files:', error);
      throw new Error(`Failed to process files: ${error}`);
    }
  }

  static getSession(sessionId: string): AnalysisSession | null {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // Try to load from file
      const loadedSession = this.loadSession(sessionId);
      if (loadedSession) {
        this.sessions.set(sessionId, loadedSession);
        session = loadedSession;
      }
    }
    
    return session || null;
  }

  static async updateKeywords(
    sessionId: string,
    deletedKeywords: string[],
    restoredKeywords: string[]
  ): Promise<boolean> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      console.log('Updating keywords:', { deletedKeywords, restoredKeywords });
      console.log('Current deleted set size before:', session.processedData.deletedKeywords.size);
      
      // Update deleted keywords set
      deletedKeywords.forEach(keywordPhrase => {
        console.log('Adding to deleted:', keywordPhrase);
        session.processedData.deletedKeywords.add(keywordPhrase);
      });

      restoredKeywords.forEach(keywordPhrase => {
        console.log('Removing from deleted:', keywordPhrase);
        session.processedData.deletedKeywords.delete(keywordPhrase);
      });
      
      console.log('Current deleted set size after:', session.processedData.deletedKeywords.size);

      // Recalculate metrics
      CalculationEngine.recalculateMetrics(session);

      // Save updated session
      await this.saveSession(session);

      return true;
    } catch (error) {
      console.error('Error updating keywords:', error);
      throw new Error(`Failed to update keywords: ${error}`);
    }
  }

  static async updateRootKeywords(sessionId: string, deletedRootWords: string[], restoredRootWords: string[]): Promise<boolean> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      console.log('Updating root keywords:', { deletedRootWords, restoredRootWords });
      
      // Delete root keywords and related phrases
      if (deletedRootWords.length > 0) {
        CalculationEngine.deleteRootKeywords(session, deletedRootWords);
      }

      // Restore root keywords and related phrases
      if (restoredRootWords.length > 0) {
        CalculationEngine.restoreRootKeywords(session, restoredRootWords);
      }

      // Recalculate all metrics
      CalculationEngine.recalculateMetrics(session);

      // Save updated session
      await this.saveSession(session);

      return true;
    } catch (error) {
      console.error('Error updating root keywords:', error);
      throw new Error(`Failed to update root keywords: ${error}`);
    }
  }

  static async updateCompetitors(sessionId: string, deletedCompetitors: string[], restoredCompetitors: string[]): Promise<boolean> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      console.log('Updating competitors:', { deletedCompetitors, restoredCompetitors });
      
      // Delete competitors
      if (deletedCompetitors.length > 0) {
        CalculationEngine.deleteCompetitors(session, deletedCompetitors);
      }

      // Restore competitors
      if (restoredCompetitors.length > 0) {
        CalculationEngine.restoreCompetitors(session, restoredCompetitors);
      }

      // Recalculate all metrics (this will update revenue too)
      CalculationEngine.recalculateMetrics(session);

      // Save updated session
      await this.saveSession(session);

      return true;
    } catch (error) {
      console.error('Error updating competitors:', error);
      throw new Error(`Failed to update competitors: ${error}`);
    }
  }

  static async updateProducts(sessionId: string, deletedProducts: string[], restoredProducts: string[]): Promise<boolean> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      console.log('Updating products:', { deletedProducts, restoredProducts });
      
      // Delete products
      if (deletedProducts.length > 0) {
        CalculationEngine.deleteProducts(session, deletedProducts);
      }

      // Restore products
      if (restoredProducts.length > 0) {
        CalculationEngine.restoreProducts(session, restoredProducts);
      }

      // Save updated session
      await this.saveSession(session);

      return true;
    } catch (error) {
      console.error('Error updating products:', error);
      throw new Error(`Failed to update products: ${error}`);
    }
  }

  private static async saveSession(session: AnalysisSession): Promise<void> {
    const filePath = path.join(this.DATA_DIR, `${session.id}.json`);
    
    // Convert Set and Map to arrays for JSON serialization
    const serializable = {
      ...session,
      processedData: {
        ...session.processedData,
        deletedKeywords: Array.from(session.processedData.deletedKeywords),
        deletedRootKeywords: Array.from(session.processedData.deletedRootKeywords),
        deletedCompetitors: Array.from(session.processedData.deletedCompetitors),
        deletedProducts: Array.from(session.processedData.deletedProducts)
      },
      calculations: {
        ...session.calculations,
        competitorMetrics: Array.from(session.calculations.competitorMetrics.entries())
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2));
  }

  private static loadSession(sessionId: string): AnalysisSession | null {
    try {
      const filePath = path.join(this.DATA_DIR, `${sessionId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Convert arrays back to Set and Map
      return {
        ...data,
        processedData: {
          ...data.processedData,
          deletedKeywords: new Set(data.processedData.deletedKeywords),
          deletedRootKeywords: new Set(data.processedData.deletedRootKeywords || []),
          deletedCompetitors: new Set(data.processedData.deletedCompetitors || []),
          deletedProducts: new Set(data.processedData.deletedProducts || [])
        },
        calculations: {
          ...data.calculations,
          competitorMetrics: new Map(data.calculations.competitorMetrics)
        },
        createdAt: new Date(data.createdAt)
      };
    } catch (error) {
      console.error(`Error loading session ${sessionId}:`, error);
      return null;
    }
  }

  static getAnalysisData(sessionId: string) {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const activeKeywords = session.processedData.keywords.filter(
      kw => !session.processedData.deletedKeywords.has(kw.keywordPhrase)
    );

    const activeCompetitors = session.processedData.competitors.filter(
      c => !session.processedData.deletedCompetitors.has(c.asin)
    );

    // Calculate total revenue from active competitors
    const totalRevenue = activeCompetitors.reduce((sum, competitor) => {
      if (!competitor.revenue) return sum;
      
      // Handle different revenue formats (€1,234.56 or €1.234,56 or €1234)
      let revenueStr = competitor.revenue.toString();
      
      // Remove currency symbols and spaces
      revenueStr = revenueStr.replace(/[€$£¥\s]/g, '');
      
      // Handle European format (1.234,56) vs American format (1,234.56)
      if (revenueStr.includes(',') && revenueStr.includes('.')) {
        // Check which comes last - if comma is last, it's European format
        if (revenueStr.lastIndexOf(',') > revenueStr.lastIndexOf('.')) {
          // European format: remove dots, replace comma with dot
          revenueStr = revenueStr.replace(/\./g, '').replace(',', '.');
        } else {
          // American format: remove commas
          revenueStr = revenueStr.replace(/,/g, '');
        }
      } else if (revenueStr.includes(',')) {
        // Only comma - could be thousands separator or decimal
        const parts = revenueStr.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Decimal separator (123,45)
          revenueStr = revenueStr.replace(',', '.');
        } else {
          // Thousands separator (1,234)
          revenueStr = revenueStr.replace(/,/g, '');
        }
      }
      
      const revenue = parseFloat(revenueStr) || 0;
      return sum + revenue;
    }, 0);
    
    return {
      analysisId: session.id,
      marketSummary: {
        totalMarketSV: session.calculations.totalMarketSV,
        brandSV: session.calculations.brandSV,
        uniqueBrands: new Set(activeCompetitors.map(c => c.brand)).size,
        totalKeywords: activeKeywords.length,
        deletedKeywords: session.processedData.deletedKeywords.size,
        totalRevenue: totalRevenue
      },
      competitorAnalysis: session.processedData.competitors,
      keywordList: session.processedData.keywords,
      rootKeywords: session.processedData.rootKeywords,
      productList: session.processedData.products,
      strengthSummary: session.calculations.strengthSummary
    };
  }
}