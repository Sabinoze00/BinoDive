import { v4 as uuidv4 } from 'uuid'
import { AnalysisData, ProcessedKeyword, Competitor, ProcessedProduct } from '@/types/analysis'

// Types for CSV parsing
interface KeywordRow {
  keywordPhrase: string
  searchVolume: number
  relevance: number
  isBrand: boolean
  brandWord?: string
  rankings: Record<string, number>
}

interface BusinessRow {
  asin: string
  brand: string
  imageUrl?: string
  sellerCountry?: string
  ratings?: number
  creationDate?: Date
  price?: string
  sales?: number
  revenue?: string
  category?: string
  fulfillment?: string
}

interface ProductRow {
  asin: string
  brand: string
  imageUrl?: string
  asinVariation?: string
}

// In-memory storage for Vercel (would use database in production)
const sessions = new Map<string, AnalysisData>()

export class ServerDataProcessor {
  static async processFiles(
    keywordFileContent: string,
    businessFileContent: string,
    productFileContent: string
  ): Promise<string> {
    try {
      // Parse CSV files
      const [keywordData, businessData, productData] = await Promise.all([
        this.parseKeywordAnalysis(keywordFileContent),
        this.parseBusinessData(businessFileContent),
        this.parseProductData(productFileContent)
      ])

      // Process and combine data
      const analysisData = this.combineData(keywordData, businessData, productData)
      
      // Generate unique ID and set it
      const analysisId = uuidv4()
      analysisData.analysisId = analysisId
      sessions.set(analysisId, analysisData)

      return analysisId
    } catch (error) {
      throw new Error(`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static getAnalysisData(analysisId: string): AnalysisData | null {
    return sessions.get(analysisId) || null
  }

  static updateKeywords(analysisId: string, deletedKeywords: string[], restoredKeywords: string[]): AnalysisData | null {
    const data = sessions.get(analysisId)
    if (!data) return null

    // Update keyword deletion status
    data.keywordList.forEach(keyword => {
      if (deletedKeywords.includes(keyword.keywordPhrase)) {
        keyword.isDeleted = true
      }
      if (restoredKeywords.includes(keyword.keywordPhrase)) {
        keyword.isDeleted = false
      }
    })

    // Recalculate metrics
    const updatedData = this.recalculateMetrics(data)
    sessions.set(analysisId, updatedData)

    return updatedData
  }

  private static async parseKeywordAnalysis(content: string): Promise<KeywordRow[]> {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Keyword file must have at least header and one data row')

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data: KeywordRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length < headers.length) continue

      const row: KeywordRow = {
        keywordPhrase: values[0] || '',
        searchVolume: parseInt(values[1]) || 0,
        relevance: parseFloat(values[2]) || 0,
        isBrand: values[3]?.toLowerCase() === 'true' || values[3] === '1',
        brandWord: values[4] || undefined,
        rankings: {}
      }

      // Extract ASIN rankings (columns that start with 'B0')
      headers.forEach((header, index) => {
        if (header.startsWith('B0') && values[index]) {
          const ranking = parseInt(values[index])
          if (!isNaN(ranking) && ranking > 0) {
            row.rankings[header] = ranking
          }
        }
      })

      data.push(row)
    }

    return data
  }

  private static async parseBusinessData(content: string): Promise<BusinessRow[]> {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Business data file must have at least header and one data row')

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data: BusinessRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length < headers.length) continue

      const row: BusinessRow = {
        asin: values[0] || '',
        brand: values[1] || '',
        imageUrl: values[2] || undefined,
        sellerCountry: values[3] || undefined,
        ratings: parseFloat(values[4]) || undefined,
        creationDate: values[5] ? new Date(values[5]) : undefined,
        price: values[6] || undefined,
        sales: parseInt(values[7]) || undefined,
        revenue: values[8] || undefined,
        category: values[9] || undefined,
        fulfillment: values[10] || undefined
      }

      data.push(row)
    }

    return data
  }

  private static async parseProductData(content: string): Promise<ProductRow[]> {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Product data file must have at least header and one data row')

    const data: ProductRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length < 2) continue

      const row: ProductRow = {
        asin: values[0] || '',
        brand: values[1] || '',
        imageUrl: values[2] || undefined,
        asinVariation: values[3] || undefined
      }

      data.push(row)
    }

    return data
  }

  private static parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current.trim())
    return values
  }

  private static combineData(
    keywordData: KeywordRow[],
    businessData: BusinessRow[],
    productData: ProductRow[]
  ): AnalysisData {
    // Convert to ProcessedKeyword format
    const processedKeywords: ProcessedKeyword[] = keywordData.map(kw => ({
      keywordPhrase: kw.keywordPhrase,
      searchVolume: kw.searchVolume,
      relevance: kw.relevance,
      isBrand: kw.isBrand,
      brandWord: kw.brandWord || null,
      rankings: kw.rankings,
      isDeleted: false
    }))

    // Get unique ASINs from rankings
    const asinSet = new Set<string>()
    keywordData.forEach(kw => {
      Object.keys(kw.rankings).forEach(asin => asinSet.add(asin))
    })

    // Create competitors from business data
    const competitors: Competitor[] = Array.from(asinSet).map(asin => {
      const businessInfo = businessData.find(b => b.asin === asin)
      const productInfo = productData.find(p => p.asin === asin)

      return {
        asin,
        brand: businessInfo?.brand || productInfo?.brand || 'Unknown',
        imageUrl: businessInfo?.imageUrl || productInfo?.imageUrl || '',
        sellerCountry: businessInfo?.sellerCountry || '',
        ratings: businessInfo?.ratings || 0,
        rating: businessInfo?.ratings || 0,
        creationDate: businessInfo?.creationDate || new Date(),
        listingAgeMonths: businessInfo?.creationDate ? Math.floor((new Date().getTime() - businessInfo.creationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0,
        price: businessInfo?.price || '',
        sales: businessInfo?.sales || 0,
        revenue: businessInfo?.revenue || '',
        category: businessInfo?.category || '',
        fulfillment: businessInfo?.fulfillment || '',
        variations: 1, // Default to 1 variation
        isDeleted: false,
        strengthLevel: 'Medio',
        strengthPercentage: 0
      }
    })

    // Calculate competitor strengths
    competitors.forEach(comp => {
      const relevantKeywords = processedKeywords.filter(kw => 
        kw.rankings[comp.asin] && kw.rankings[comp.asin] <= 30
      )
      
      const totalSV = relevantKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0)
      const marketSV = processedKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0)
      
      comp.strengthPercentage = marketSV > 0 ? (totalSV / marketSV) * 100 : 0
      
      if (comp.strengthPercentage >= 40) comp.strengthLevel = 'Molto Forte'
      else if (comp.strengthPercentage >= 25) comp.strengthLevel = 'Forte'
      else if (comp.strengthPercentage >= 10) comp.strengthLevel = 'Medio'
      else comp.strengthLevel = 'Debole'
    })

    // Create products from product data
    const products: ProcessedProduct[] = productData.map(prod => ({
      asin: prod.asin,
      brand: prod.brand,
      imageUrl: prod.imageUrl || '',
      imageUrlSample: prod.imageUrl || '',
      imageCount: 1,
      title: prod.brand + ' Product', // Default title
      feature1: '',
      feature2: '',
      feature3: '',
      feature4: '',
      feature5: '',
      variationAsins: prod.asinVariation ? [prod.asinVariation] : [],
      keywordCount: 0, // Will be calculated later
      matchingKeywords: [],
      strengthPercentage: 0,
      strengthLevel: 'Debole' as const,
      isDeleted: false
    }))

    // Calculate market summary
    const totalMarketSV = processedKeywords
      .filter(kw => !kw.isDeleted)
      .reduce((sum, kw) => sum + kw.searchVolume, 0)

    const uniqueBrands = new Set(competitors.map(c => c.brand)).size
    const totalKeywords = processedKeywords.filter(kw => !kw.isDeleted).length

    return {
      analysisId: '', // Will be set by caller
      marketSummary: {
        totalMarketSV,
        brandSV: processedKeywords.filter(kw => !kw.isDeleted && kw.isBrand).reduce((sum, kw) => sum + kw.searchVolume, 0),
        totalRevenue: businessData.reduce((sum, b) => sum + (parseFloat(b.revenue?.replace(/[€,]/g, '') || '0')), 0),
        uniqueBrands,
        totalKeywords,
        deletedKeywords: 0
      },
      competitorAnalysis: competitors,
      keywordList: processedKeywords,
      productList: products,
      rootKeywords: [], // Empty for now
      strengthSummary: {
        moltoForte: competitors.filter(c => c.strengthLevel === 'Molto Forte').length,
        forte: competitors.filter(c => c.strengthLevel === 'Forte').length,
        medio: competitors.filter(c => c.strengthLevel === 'Medio').length,
        debole: competitors.filter(c => c.strengthLevel === 'Debole').length
      }
    }
  }

  private static recalculateMetrics(data: AnalysisData): AnalysisData {
    const activeKeywords = data.keywordList.filter(kw => !kw.isDeleted)
    const totalMarketSV = activeKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0)

    // Recalculate competitor strengths
    data.competitorAnalysis.forEach(comp => {
      const relevantKeywords = activeKeywords.filter(kw => 
        kw.rankings[comp.asin] && kw.rankings[comp.asin] <= 30
      )
      
      const totalSV = relevantKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0)
      comp.strengthPercentage = totalMarketSV > 0 ? (totalSV / totalMarketSV) * 100 : 0
      
      if (comp.strengthPercentage >= 40) comp.strengthLevel = 'Molto Forte'
      else if (comp.strengthPercentage >= 25) comp.strengthLevel = 'Forte'
      else if (comp.strengthPercentage >= 10) comp.strengthLevel = 'Medio'
      else comp.strengthLevel = 'Debole'
    })

    // Update market summary
    data.marketSummary = {
      totalMarketSV,
      brandSV: activeKeywords.filter(kw => kw.isBrand).reduce((sum, kw) => sum + kw.searchVolume, 0),
      totalRevenue: data.competitorAnalysis.reduce((sum, c) => sum + (parseFloat(c.revenue?.replace(/[€,]/g, '') || '0')), 0),
      uniqueBrands: new Set(data.competitorAnalysis.map(c => c.brand)).size,
      totalKeywords: activeKeywords.length,
      deletedKeywords: data.keywordList.filter(kw => kw.isDeleted).length
    }

    return data
  }
}