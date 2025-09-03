import { 
  AnalysisSession, 
  ProcessedKeyword, 
  Competitor, 
  CompetitorMetrics,
  StrengthSummary,
  RootKeyword,
  ProcessedProduct
} from '../types/analysis';

export class CalculationEngine {
  static calculateStrengthLevel(percentage: number): 'Molto Forte' | 'Forte' | 'Medio' | 'Debole' {
    if (percentage >= 80) return 'Molto Forte';
    if (percentage >= 65) return 'Forte';
    if (percentage >= 30) return 'Medio';
    return 'Debole';
  }

  static calculateListingAge(creationDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - creationDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }

  static deleteRootKeywords(session: AnalysisSession, rootWordsToDelete: string[]): void {
    // Mark root keywords as deleted
    rootWordsToDelete.forEach(rootWord => {
      session.processedData.deletedRootKeywords.add(rootWord);
      
      // Find all keyword phrases that contain this root word and mark them as deleted
      session.processedData.keywords.forEach(keyword => {
        const rootWords = this.extractRootWords(keyword.keywordPhrase);
        if (rootWords.includes(rootWord.toLowerCase())) {
          session.processedData.deletedKeywords.add(keyword.keywordPhrase);
          keyword.isDeleted = true; // Update the object flag too
        }
      });
    });

    // Recalculate root keywords to update counts
    session.processedData.rootKeywords = this.calculateRootKeywords(session);
    
    // Mark deleted root keywords
    session.processedData.rootKeywords.forEach(rk => {
      if (session.processedData.deletedRootKeywords.has(rk.rootWord)) {
        rk.isDeleted = true;
      }
    });
  }

  static restoreRootKeywords(session: AnalysisSession, rootWordsToRestore: string[]): void {
    // Remove root keywords from deleted set
    rootWordsToRestore.forEach(rootWord => {
      session.processedData.deletedRootKeywords.delete(rootWord);
      
      // Restore related keyword phrases that were only deleted because of this root
      session.processedData.keywords.forEach(keyword => {
        const rootWords = this.extractRootWords(keyword.keywordPhrase);
        if (rootWords.includes(rootWord.toLowerCase())) {
          // Check if this keyword phrase has other deleted root words
          const hasOtherDeletedRoots = rootWords.some(rw => 
            rw !== rootWord.toLowerCase() && session.processedData.deletedRootKeywords.has(rw)
          );
          
          // Only restore if no other root words are deleted
          if (!hasOtherDeletedRoots) {
            session.processedData.deletedKeywords.delete(keyword.keywordPhrase);
            keyword.isDeleted = false; // Update the object flag too
          }
        }
      });
    });

    // Recalculate root keywords to update counts
    session.processedData.rootKeywords = this.calculateRootKeywords(session);
    
    // Update deleted status
    session.processedData.rootKeywords.forEach(rk => {
      rk.isDeleted = session.processedData.deletedRootKeywords.has(rk.rootWord);
    });
  }

  static deleteCompetitors(session: AnalysisSession, competitorAsins: string[]): void {
    // Mark competitors as deleted
    competitorAsins.forEach(asin => {
      session.processedData.deletedCompetitors.add(asin);
      
      // Update the competitor object flag
      const competitor = session.processedData.competitors.find(c => c.asin === asin);
      if (competitor) {
        competitor.isDeleted = true;
      }
    });
  }

  static restoreCompetitors(session: AnalysisSession, competitorAsins: string[]): void {
    // Remove competitors from deleted set
    competitorAsins.forEach(asin => {
      session.processedData.deletedCompetitors.delete(asin);
      
      // Update the competitor object flag
      const competitor = session.processedData.competitors.find(c => c.asin === asin);
      if (competitor) {
        competitor.isDeleted = false;
      }
    });
  }

  static deleteProducts(session: AnalysisSession, productAsins: string[]): void {
    // Mark products as deleted
    productAsins.forEach(asin => {
      session.processedData.deletedProducts.add(asin);
      
      // Update the product object flag
      const product = session.processedData.products.find(p => p.asin === asin);
      if (product) {
        product.isDeleted = true;
      }

      // Also mark corresponding competitor as deleted (same ASIN)
      session.processedData.deletedCompetitors.add(asin);
      const competitor = session.processedData.competitors.find(c => c.asin === asin);
      if (competitor) {
        competitor.isDeleted = true;
      }
    });
  }

  static restoreProducts(session: AnalysisSession, productAsins: string[]): void {
    // Remove products from deleted set
    productAsins.forEach(asin => {
      session.processedData.deletedProducts.delete(asin);
      
      // Update the product object flag
      const product = session.processedData.products.find(p => p.asin === asin);
      if (product) {
        product.isDeleted = false;
      }

      // Also restore corresponding competitor (same ASIN)
      session.processedData.deletedCompetitors.delete(asin);
      const competitor = session.processedData.competitors.find(c => c.asin === asin);
      if (competitor) {
        competitor.isDeleted = false;
      }
    });
  }

  static recalculateMetrics(session: AnalysisSession): void {
    // 1. Sync isDeleted flags with deleted sets
    session.processedData.keywords.forEach(keyword => {
      keyword.isDeleted = session.processedData.deletedKeywords.has(keyword.keywordPhrase);
    });

    session.processedData.competitors.forEach(competitor => {
      competitor.isDeleted = session.processedData.deletedCompetitors.has(competitor.asin);
    });

    session.processedData.products.forEach(product => {
      product.isDeleted = session.processedData.deletedProducts.has(product.asin);
    });

    // 2. Filter active keywords (not deleted)
    const activeKeywords = session.processedData.keywords.filter(
      kw => !session.processedData.deletedKeywords.has(kw.keywordPhrase)
    );

    // 2. Recalculate total market SV and brand SV
    session.calculations.totalMarketSV = activeKeywords.reduce(
      (sum, kw) => sum + kw.searchVolume, 
      0
    );
    
    session.calculations.brandSV = activeKeywords
      .filter(kw => kw.isBrand)
      .reduce((sum, kw) => sum + kw.searchVolume, 0);

    // 3. Recalculate competitor metrics (only for active competitors)
    const activeCompetitors = session.processedData.competitors.filter(
      c => !session.processedData.deletedCompetitors.has(c.asin)
    );

    activeCompetitors.forEach(competitor => {
      const top30Keywords = activeKeywords.filter(kw => {
        const ranking = kw.rankings[competitor.asin];
        return ranking && ranking <= 30;
      });

      const competitorSV = top30Keywords.reduce(
        (sum, kw) => sum + kw.searchVolume, 
        0
      );

      const strengthPercentage = session.calculations.totalMarketSV > 0 
        ? (competitorSV / session.calculations.totalMarketSV) * 100 
        : 0;

      competitor.strengthPercentage = strengthPercentage;
      competitor.strengthLevel = this.calculateStrengthLevel(strengthPercentage);

      // Update competitor metrics map
      session.calculations.competitorMetrics.set(competitor.asin, {
        asin: competitor.asin,
        strengthPercentage,
        strengthLevel: competitor.strengthLevel,
        top30KeywordsSV: competitorSV
      });
    });

    // 4. Update strength summary
    this.updateStrengthSummary(session);

    // 5. Recalculate product metrics
    this.recalculateProductMetrics(session, activeKeywords);
  }

  static updateStrengthSummary(session: AnalysisSession): void {
    const summary: StrengthSummary = {
      moltoForte: 0,
      forte: 0,
      medio: 0,
      debole: 0
    };

    // Only count active competitors
    const activeCompetitors = session.processedData.competitors.filter(
      c => !session.processedData.deletedCompetitors.has(c.asin)
    );

    activeCompetitors.forEach(competitor => {
      switch (competitor.strengthLevel) {
        case 'Molto Forte':
          summary.moltoForte++;
          break;
        case 'Forte':
          summary.forte++;
          break;
        case 'Medio':
          summary.medio++;
          break;
        case 'Debole':
          summary.debole++;
          break;
      }
    });

    session.calculations.strengthSummary = summary;
  }

  static recalculateProductMetrics(session: AnalysisSession, activeKeywords: ProcessedKeyword[]): void {
    // Update metrics for all products (both active and deleted)
    session.processedData.products.forEach(product => {
      // Find keywords where this product ranks in top 30
      const matchingKeywords = activeKeywords.filter(kw => {
        const ranking = kw.rankings[product.asin];
        return ranking && ranking <= 30;
      });

      // Calculate keyword count and matching keywords
      product.keywordCount = matchingKeywords.length;
      product.matchingKeywords = matchingKeywords.map(kw => kw.keywordPhrase);

      // Calculate strength percentage based on search volume
      const productSV = matchingKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0);
      product.strengthPercentage = session.calculations.totalMarketSV > 0 
        ? (productSV / session.calculations.totalMarketSV) * 100 
        : 0;

      // Calculate strength level
      product.strengthLevel = this.calculateStrengthLevel(product.strengthPercentage);
    });
  }

  static calculateRelevance(keyword: ProcessedKeyword): number {
    // If it's a brand keyword, relevance should be 0
    if (keyword.isBrand) {
      return 0;
    }
    
    // Otherwise, return the original relevance
    return keyword.relevance;
  }

  static getVariationCount(variationAsins: string[]): number {
    // If no variations are specified, default to 1
    if (!variationAsins || variationAsins.length === 0) {
      return 1;
    }
    
    // Return count of variation ASINs
    return variationAsins.length;
  }

  static extractRootWords(keywordPhrase: string): string[] {
    // Remove brand words and split into individual words
    return keywordPhrase
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out small words
      .filter(word => !['the', 'and', 'for', 'with', 'are', 'you', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'men', 'run', 'she', 'try', 'use'].includes(word));
  }

  static calculateRootKeywords(session: AnalysisSession): RootKeyword[] {
    const activeKeywords = session.processedData.keywords.filter(
      kw => !session.processedData.deletedKeywords.has(kw.keywordPhrase)
    );

    const rootMap = new Map<string, {
      totalSV: number;
      relevances: number[];
      brandCount: number;
      nonBrandCount: number;
      relatedPhrases: string[];
    }>();

    activeKeywords.forEach(keyword => {
      const rootWords = this.extractRootWords(keyword.keywordPhrase);
      
      rootWords.forEach(rootWord => {
        if (!rootMap.has(rootWord)) {
          rootMap.set(rootWord, {
            totalSV: 0,
            relevances: [],
            brandCount: 0,
            nonBrandCount: 0,
            relatedPhrases: []
          });
        }

        const rootData = rootMap.get(rootWord)!;
        rootData.totalSV += keyword.searchVolume;
        rootData.relevances.push(keyword.relevance);
        
        if (keyword.isBrand) {
          rootData.brandCount++;
        } else {
          rootData.nonBrandCount++;
        }

        if (!rootData.relatedPhrases.includes(keyword.keywordPhrase)) {
          rootData.relatedPhrases.push(keyword.keywordPhrase);
        }
      });
    });

    // Convert to RootKeyword array
    const rootKeywords: RootKeyword[] = [];
    for (const [rootWord, data] of rootMap.entries()) {
      const averageRelevance = data.relevances.length > 0 
        ? Math.round(data.relevances.reduce((sum, rel) => sum + rel, 0) / data.relevances.length)
        : 0;

      const totalCount = data.brandCount + data.nonBrandCount;
      const brandPercentage = totalCount > 0 ? Math.round((data.brandCount / totalCount) * 100) : 0;

      rootKeywords.push({
        rootWord,
        totalSV: data.totalSV,
        averageRelevance,
        brandCount: data.brandCount,
        nonBrandCount: data.nonBrandCount,
        totalCount,
        brandPercentage,
        relatedPhrases: data.relatedPhrases,
        isDeleted: false
      });
    }

    // Sort by total SV descending
    return rootKeywords.sort((a, b) => b.totalSV - a.totalSV);
  }

  static processInitialData(session: AnalysisSession): void {
    const { keywordData, businessData, productData } = session.originalData;

    // Create competitors map from business data
    const competitorsMap = new Map<string, Competitor>();
    
    businessData.forEach(business => {
      if (business.asin) {
        const product = productData.find(p => p.asin === business.asin);
        
        competitorsMap.set(business.asin, {
          asin: business.asin,
          brand: business.brand || product?.brand || 'Unknown',
          imageUrl: business.imageUrl || product?.imageUrl || '',
          strengthPercentage: 0, // Will be calculated
          strengthLevel: 'Debole', // Will be calculated
          sellerCountry: business.sellerCountry,
          variations: this.getVariationCount(product?.variationAsins || []),
          rating: business.rating,
          listingAgeMonths: this.calculateListingAge(business.creationDate),
          price: business.price,
          sales: business.sales,
          revenue: business.revenue,
          category: business.category,
          fulfillment: business.fulfillment,
          isDeleted: false
        });
      }
    });

    // Process keywords
    const processedKeywords: ProcessedKeyword[] = keywordData.map(kw => {
      // Calculate relevance: competitors in top 30 / total competitors * 100
      let relevance = 0;
      if (!kw.isBrand) {
        const totalCompetitors = Object.keys(kw.rankings).length;
        const competitorsInTop30 = Object.values(kw.rankings).filter(ranking => ranking > 0 && ranking <= 30).length;
        relevance = totalCompetitors > 0 ? Math.round((competitorsInTop30 / totalCompetitors) * 100) : 0;
      }
      
      const processed: ProcessedKeyword = {
        keywordPhrase: kw.keywordPhrase,
        searchVolume: kw.searchVolume,
        isBrand: kw.isBrand,
        brandWord: kw.brandWord,
        relevance: relevance, // Calcolata dinamicamente
        isDeleted: false,
        rankings: kw.rankings
      };
      
      // Debug per prime 3 keyword
      if (keywordData.indexOf(kw) < 3) {
        console.log('Relevance calculation:', {
          keyword: kw.keywordPhrase,
          isBrand: kw.isBrand,
          rankings: kw.rankings,
          totalCompetitors: Object.keys(kw.rankings).length,
          competitorsInTop30: Object.values(kw.rankings).filter(ranking => ranking > 0 && ranking <= 30).length,
          calculatedRelevance: relevance
        });
      }
      
      return processed;
    });

    // Create processed products
    const processedProducts: ProcessedProduct[] = productData.map(product => ({
      asin: product.asin,
      brand: product.brand || 'Unknown',
      imageUrl: product.imageUrl || '',
      imageUrlSample: product.imageUrlSample || '',
      imageCount: product.imageCount || 0,
      title: product.title || `Product ${product.asin}`,
      feature1: product.feature1 || '',
      feature2: product.feature2 || '',
      feature3: product.feature3 || '',
      feature4: product.feature4 || '',
      feature5: product.feature5 || '',
      variationAsins: product.variationAsins || [],
      keywordCount: 0, // Will be calculated later
      matchingKeywords: [], // Will be calculated later
      strengthPercentage: 0, // Will be calculated later
      strengthLevel: 'Debole', // Will be calculated later
      isDeleted: false
    }));

    // Set processed data
    session.processedData.competitors = Array.from(competitorsMap.values());
    session.processedData.keywords = processedKeywords;
    session.processedData.products = processedProducts;
    session.processedData.deletedKeywords = new Set<string>();
    session.processedData.deletedRootKeywords = new Set<string>();
    session.processedData.deletedCompetitors = new Set<string>();
    session.processedData.deletedProducts = new Set<string>();
    
    // Calculate root keywords
    session.processedData.rootKeywords = this.calculateRootKeywords(session);

    // Initialize calculations
    session.calculations = {
      totalMarketSV: 0,
      brandSV: 0,
      strengthSummary: { moltoForte: 0, forte: 0, medio: 0, debole: 0 },
      competitorMetrics: new Map<string, CompetitorMetrics>()
    };

    // Calculate initial metrics
    this.recalculateMetrics(session);
  }
}