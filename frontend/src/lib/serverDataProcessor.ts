import { v4 as uuidv4 } from 'uuid'
import { AnalysisData, ProcessedKeyword, Competitor, ProcessedProduct, RootKeyword } from '@/types/analysis'
import { DatabaseService } from './database'

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
  title?: string
  imageUrl?: string
  asinVariation?: string
}

// Using Turso database for persistent storage

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
      
      // Generate unique ID and save to database
      const analysisId = uuidv4()
      analysisData.analysisId = analysisId
      
      await DatabaseService.saveAnalysis(analysisId, analysisData)

      return analysisId
    } catch (error) {
      throw new Error(`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getAnalysisData(analysisId: string): Promise<AnalysisData | null> {
    return await DatabaseService.getAnalysis(analysisId)
  }

  static async updateKeywords(analysisId: string, deletedKeywords: string[], restoredKeywords: string[]): Promise<AnalysisData | null> {
    const data = await DatabaseService.getAnalysis(analysisId)
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
    
    await DatabaseService.updateAnalysis(analysisId, updatedData)

    return updatedData
  }

  private static async parseKeywordAnalysis(content: string): Promise<KeywordRow[]> {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Keyword file must have at least header and one data row')

    // Detect separator (try semicolon first, then comma)
    const separator = lines[0].includes(';') ? ';' : ','
    console.log('Detected CSV separator:', separator)
    
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''))
    const data: KeywordRow[] = []

    // Debug: Log the headers to understand CSV structure
    console.log('CSV Headers found:', headers)
    console.log('Looking for ASIN columns (starting with B0):', headers.filter(h => h.startsWith('B0')))

    for (let i = 1; i < lines.length; i++) {
      const values = separator === ';' ? lines[i].split(';') : this.parseCSVLine(lines[i])
      if (values.length < 5) continue // Need at least basic fields

      // Map based on actual CSV structure from logs
      const row: KeywordRow = {
        keywordPhrase: (values[0] || '').replace(';0', ''), // Remove ";0" suffix
        relevance: parseFloat(values[1]) || 0,
        searchVolume: parseInt(values[2]) || 0,
        isBrand: values[9]?.toLowerCase() === 'true' || values[9] === '1',
        brandWord: values[10] || undefined,
        rankings: {}
      }

      // Extract ASIN rankings (columns that start with 'B0')
      let rankingsFound = 0
      headers.forEach((header, index) => {
        if (header.startsWith('B0') && values[index] && values[index].trim() !== '') {
          const ranking = parseInt(values[index])
          if (!isNaN(ranking) && ranking > 0) {
            row.rankings[header] = ranking
            rankingsFound++
          }
        }
      })

      // Debug: Log first few rows to understand the data
      if (i <= 3) {
        console.log(`Row ${i}: keyword="${row.keywordPhrase}", rankings found: ${rankingsFound}`, row.rankings)
      }

      data.push(row)
    }

    console.log(`Total keywords processed: ${data.length}`)
    const totalRankings = data.reduce((sum, row) => sum + Object.keys(row.rankings).length, 0)
    console.log(`Total rankings found across all keywords: ${totalRankings}`)

    return data
  }

  private static async parseBusinessData(content: string): Promise<BusinessRow[]> {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Business data file must have at least header and one data row')

    // Detect separator 
    const separator = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''))
    const data: BusinessRow[] = []

    // Debug: Log business data structure
    console.log('Business CSV Headers:', headers)

    for (let i = 1; i < lines.length; i++) {
      const values = separator === ';' ? lines[i].split(';') : this.parseCSVLine(lines[i])
      if (values.length < 5) continue

      // Map based on actual CSV structure from logs
      // From logs: ASIN is at index 3, Brand at index 6, etc.
      const asinIndex = headers.findIndex(h => h.toLowerCase().includes('asin'))
      const brandIndex = headers.findIndex(h => h.toLowerCase().includes('brand'))
      const salesIndex = headers.findIndex(h => h.toLowerCase().includes('asin sales'))
      const revenueIndex = headers.findIndex(h => h.toLowerCase().includes('asin revenue'))
      const imageUrlIndex = headers.findIndex(h => h.toLowerCase().includes('image url'))
      const sellerCountryIndex = headers.findIndex(h => h.toLowerCase().includes('seller country'))
      const ratingsIndex = headers.findIndex(h => h.toLowerCase().includes('ratings'))
      const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('category'))
      const fulfillmentIndex = headers.findIndex(h => h.toLowerCase().includes('fulfillment'))
      const creationDateIndex = headers.findIndex(h => h.toLowerCase().includes('creation date'))
      const priceIndex = headers.findIndex(h => h.toLowerCase().includes('price'))

      const row: BusinessRow = {
        asin: asinIndex >= 0 ? values[asinIndex] || '' : '',
        brand: brandIndex >= 0 ? values[brandIndex] || '' : '',
        imageUrl: imageUrlIndex >= 0 ? values[imageUrlIndex] || undefined : undefined,
        sellerCountry: sellerCountryIndex >= 0 ? values[sellerCountryIndex] || undefined : undefined,
        ratings: ratingsIndex >= 0 ? parseFloat(values[ratingsIndex]) || undefined : undefined,
        creationDate: creationDateIndex >= 0 && values[creationDateIndex] ? new Date(values[creationDateIndex]) : undefined,
        price: priceIndex >= 0 ? values[priceIndex] || undefined : undefined,
        sales: salesIndex >= 0 ? this.parseEuropeanNumber(values[salesIndex] || '') || undefined : undefined,
        revenue: revenueIndex >= 0 ? values[revenueIndex] || undefined : undefined,
        category: categoryIndex >= 0 ? values[categoryIndex] || undefined : undefined,
        fulfillment: fulfillmentIndex >= 0 ? values[fulfillmentIndex] || undefined : undefined
      }

      // Debug: Log first few business rows
      if (i <= 3) {
        console.log(`Business Row ${i}:`, { asin: row.asin, brand: row.brand, sales: row.sales, revenue: row.revenue })
      }

      data.push(row)
    }

    console.log(`Total business records processed: ${data.length}`)
    return data
  }

  private static async parseProductData(content: string): Promise<ProductRow[]> {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Product data file must have at least header and one data row')

    // Detect separator
    const separator = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''))
    console.log('Product CSV Headers:', headers)
    
    const data: ProductRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = separator === ';' ? lines[i].split(';') : this.parseCSVLine(lines[i])
      if (values.length < 2) continue

      // Map based on actual CSV structure from logs
      // From logs: ASIN is at index 0, but brand should be taken from index 17 (Marca)
      const asinIndex = headers.findIndex(h => h.toLowerCase().includes('asin'))
      const brandIndex = headers.findIndex(h => h.toLowerCase().includes('marca'))
      const titleIndex = headers.findIndex(h => h.toLowerCase().includes('titolo') || h.toLowerCase().includes('title') || h.toLowerCase().includes('nome'))
      const imageUrlIndex = headers.findIndex(h => h.toLowerCase().includes('immagine'))
      const asinVariationIndex = headers.findIndex(h => h.toLowerCase().includes('asin di variazione'))

      const row: ProductRow = {
        asin: asinIndex >= 0 ? values[asinIndex] || '' : values[0] || '',
        brand: brandIndex >= 0 ? values[brandIndex] || '' : 'Unknown',
        title: titleIndex >= 0 ? values[titleIndex] || undefined : undefined,
        imageUrl: imageUrlIndex >= 0 ? values[imageUrlIndex] || undefined : undefined,
        asinVariation: asinVariationIndex >= 0 ? values[asinVariationIndex] || undefined : undefined
      }

      // Debug: Log first few product rows
      if (i <= 3) {
        console.log(`Product Row ${i}:`, { asin: row.asin, brand: row.brand, title: row.title?.substring(0, 50), imageUrl: row.imageUrl?.substring(0, 50) })
      }

      data.push(row)
    }

    console.log(`Total product records processed: ${data.length}`)
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

  // Helper function for European number parsing
  private static parseEuropeanNumber(value: string): number {
    if (!value || typeof value !== 'string') return 0
    
    const cleaned = value.trim()
    
    if (cleaned.includes(',')) {
      // Format: "24.779,36" -> "24779.36"
      const parts = cleaned.split(',')
      const integerPart = parts[0].replace(/\./g, '')
      const decimalPart = parts[1] || ''
      return parseFloat(integerPart + '.' + decimalPart) || 0
    } else {
      // Format: "1.487" (could be 1487 or 1.487)
      const parts = cleaned.split('.')
      if (parts.length === 2 && parts[1].length > 2) {
        // This is likely "1.487" = 1487
        return parseInt(cleaned.replace(/\./g, '')) || 0
      } else if (parts.length > 2) {
        // Multiple dots: "1.234.567" = 1234567
        return parseInt(cleaned.replace(/\./g, '')) || 0
      } else {
        // Simple number or decimal: "1.5" = 1.5
        return parseFloat(cleaned) || 0
      }
    }
  }

  // Generate root keywords by extracting common root words from keyword phrases
  private static generateRootKeywords(keywords: ProcessedKeyword[]): RootKeyword[] {
    const rootWordMap = new Map<string, {
      keywords: ProcessedKeyword[]
      totalSV: number
      brandCount: number
      nonBrandCount: number
    }>()

    // Common Italian stop words to exclude
    const stopWords = new Set(['di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'a', 'e', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'del', 'dello', 'della', 'dei', 'degli', 'delle'])

    keywords.forEach(keyword => {
      if (keyword.isDeleted) return

      const words = keyword.keywordPhrase.toLowerCase()
        .split(/[\s\-_]+/)
        .filter(word => word.length > 2 && !stopWords.has(word))

      // For each word, consider it as a potential root
      words.forEach(word => {
        if (!rootWordMap.has(word)) {
          rootWordMap.set(word, {
            keywords: [],
            totalSV: 0,
            brandCount: 0,
            nonBrandCount: 0
          })
        }

        const rootData = rootWordMap.get(word)!
        rootData.keywords.push(keyword)
        rootData.totalSV += keyword.searchVolume
        if (keyword.isBrand) {
          rootData.brandCount++
        } else {
          rootData.nonBrandCount++
        }
      })
    })

    // Convert to root keywords format and filter out roots with less than 2 keywords
    const rootKeywords = Array.from(rootWordMap.entries())
      .filter(([, data]) => data.keywords.length >= 2)
      .map(([rootWord, data]) => {
        const totalCount = data.brandCount + data.nonBrandCount
        const brandPercentage = totalCount > 0 ? Math.round((data.brandCount / totalCount) * 100) : 0
        const averageRelevance = data.keywords.length > 0 ? 
          Math.round(data.keywords.reduce((sum, kw) => sum + kw.relevance, 0) / data.keywords.length) : 0

        return {
          rootWord,
          totalSV: data.totalSV,
          totalCount,
          brandCount: data.brandCount,
          nonBrandCount: data.nonBrandCount,
          brandPercentage,
          averageRelevance,
          relatedPhrases: data.keywords.map(kw => kw.keywordPhrase),
          isDeleted: false
        }
      })
      .sort((a, b) => b.totalSV - a.totalSV) // Sort by total search volume
      .slice(0, 50) // Limit to top 50 root keywords

    console.log('Generated root keywords:', rootKeywords.length)
    return rootKeywords
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

    // Calculate competitor strengths (relevance = % of keywords with ranking <=30)
    competitors.forEach(comp => {
      const relevantKeywords = processedKeywords.filter(kw => 
        kw.rankings[comp.asin] && kw.rankings[comp.asin] <= 30
      )
      
      const totalKeywordsCount = relevantKeywords.length
      const activeKeywordsCount = processedKeywords.filter(kw => !kw.isDeleted).length
      
      comp.strengthPercentage = activeKeywordsCount > 0 ? (totalKeywordsCount / activeKeywordsCount) * 100 : 0
      
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
      title: prod.title || (prod.brand + ' Product'), // Use actual title from CSV or fallback
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

    // Generate root keywords
    const rootKeywords = this.generateRootKeywords(processedKeywords)

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
      rootKeywords: rootKeywords,
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

    // Recalculate competitor strengths (relevance = % of keywords with ranking <=30)
    data.competitorAnalysis.forEach(comp => {
      const relevantKeywords = activeKeywords.filter(kw => 
        kw.rankings[comp.asin] && kw.rankings[comp.asin] <= 30
      )
      
      const totalKeywordsCount = relevantKeywords.length
      const activeKeywordsCount = activeKeywords.length
      
      comp.strengthPercentage = activeKeywordsCount > 0 ? (totalKeywordsCount / activeKeywordsCount) * 100 : 0
      
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