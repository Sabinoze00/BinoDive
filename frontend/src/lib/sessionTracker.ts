import type { SessionEvent, UserProduct, UserAnalysis, AuditDataInput } from '../../../../shared/types/audit'
import type { AnalysisData } from '@/types/analysis'

class SessionTracker {
  private events: SessionEvent[] = []
  private sessionId: string
  private startTime: Date
  private sectionTimes: Record<string, { start: Date, total: number }> = {}
  
  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = new Date()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private addEvent(eventType: SessionEvent['eventType'], action: string, details: any = {}, duration?: number) {
    const event: SessionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.sessionId,
      analysisId: this.getCurrentAnalysisId(),
      eventType,
      action,
      details,
      duration
    }
    
    this.events.push(event)
    
    // Store in localStorage as backup
    this.saveToLocalStorage()
  }

  private getCurrentAnalysisId(): string {
    return localStorage.getItem('binodive_analysisId') || 'unknown'
  }

  private saveToLocalStorage() {
    localStorage.setItem('binodive_session_events', JSON.stringify(this.events))
    localStorage.setItem('binodive_session_id', this.sessionId)
  }

  private loadFromLocalStorage() {
    const savedEvents = localStorage.getItem('binodive_session_events')
    const savedSessionId = localStorage.getItem('binodive_session_id')
    
    if (savedEvents) {
      try {
        this.events = JSON.parse(savedEvents)
      } catch (e) {
        console.warn('Failed to load session events from localStorage')
      }
    }
    
    if (savedSessionId) {
      this.sessionId = savedSessionId
    }
  }

  // Public tracking methods
  trackUpload(fileTypes: string[], fileCount: number, processingTime: number) {
    this.addEvent('upload', 'files_uploaded', {
      fileTypes,
      fileCount,
      processingTime
    }, processingTime)
  }

  trackFilter(filterType: string, filterValue: any, resultsCount: number) {
    this.addEvent('filter', 'filter_applied', {
      filterType,
      filterValue,
      resultsCount
    })
  }

  trackDelete(itemType: 'keywords' | 'competitors' | 'products', items: string[]) {
    this.addEvent('delete', `${itemType}_deleted`, {
      itemType,
      items,
      count: items.length
    })
  }

  trackRestore(itemType: 'keywords' | 'competitors' | 'products', items: string[]) {
    this.addEvent('restore', `${itemType}_restored`, {
      itemType,
      items,
      count: items.length
    })
  }

  trackViewChange(fromView: string, toView: string) {
    // End timing for previous view
    if (this.sectionTimes[fromView]) {
      const elapsed = Date.now() - this.sectionTimes[fromView].start.getTime()
      this.sectionTimes[fromView].total += elapsed
    }

    // Start timing for new view
    this.sectionTimes[toView] = {
      start: new Date(),
      total: this.sectionTimes[toView]?.total || 0
    }

    this.addEvent('view_change', 'section_changed', {
      fromView,
      toView
    })
  }

  trackProductAdd(product: UserProduct) {
    this.addEvent('product_add', 'user_product_added', {
      productName: product.name,
      brand: product.brand,
      price: product.price,
      featuresCount: product.features.length,
      keywordsCount: product.targetKeywords.length,
      uspCount: product.uniqueSellingPoints.length
    })
  }

  trackAnalysisAdd(analysis: UserAnalysis) {
    this.addEvent('analysis_add', 'user_analysis_added', {
      title: analysis.title,
      category: analysis.category,
      priority: analysis.priority,
      contentLength: analysis.content.length,
      tagsCount: analysis.tags.length
    })
  }

  // Generate audit data
  generateAuditData(
    analysisData: AnalysisData, 
    userProduct?: UserProduct, 
    userAnalyses: UserAnalysis[] = []
  ): AuditDataInput {
    // Calculate time spent per section
    const currentTime = Date.now()
    Object.keys(this.sectionTimes).forEach(section => {
      if (this.sectionTimes[section].start) {
        const elapsed = currentTime - this.sectionTimes[section].start.getTime()
        this.sectionTimes[section].total += elapsed
      }
    })

    // Extract user behavior insights
    const filterEvents = this.events.filter(e => e.eventType === 'filter')
    const deleteEvents = this.events.filter(e => e.eventType === 'delete')
    const restoreEvents = this.events.filter(e => e.eventType === 'restore')

    // Identify focused competitors (most analyzed)
    const competitorInteractions = this.events
      .filter(e => e.details.competitors || e.details.asin)
      .map(e => e.details.competitors || [e.details.asin])
      .flat()
      .filter(Boolean)

    const competitorCounts = competitorInteractions.reduce((acc: Record<string, number>, comp: string) => {
      acc[comp] = (acc[comp] || 0) + 1
      return acc
    }, {})

    const focusedCompetitors = Object.entries(competitorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([comp]) => comp)

    // Build audit data
    const auditData: AuditDataInput = {
      sessionId: this.sessionId,
      analysisId: this.getCurrentAnalysisId(),
      brandName: userProduct?.brand || 'Brand Analysis',
      analysisDate: this.startTime,

      marketSnapshot: {
        totalSearchVolume: analysisData.marketSummary.totalMarketSV,
        totalRevenue: analysisData.marketSummary.totalRevenue,
        averageAOV: analysisData.marketSummary.totalRevenue / (analysisData.competitorAnalysis.filter(c => !c.isDeleted).length || 1),
        competitorCount: analysisData.competitorAnalysis.filter(c => !c.isDeleted).length,
        topCompetitors: analysisData.competitorAnalysis
          .filter(c => !c.isDeleted)
          .sort((a, b) => b.strengthPercentage - a.strengthPercentage)
          .slice(0, 10)
          .map(c => c.brand),
        topKeywords: analysisData.keywordList
          .filter(k => !k.isDeleted)
          .sort((a, b) => b.searchVolume - a.searchVolume)
          .slice(0, 20)
          .map(k => k.keywordPhrase)
      },

      userProduct,
      userAnalyses,

      userBehavior: {
        timeSpent: {
          competitors: Math.round((this.sectionTimes.competitors?.total || 0) / 1000),
          keywords: Math.round((this.sectionTimes.mlk?.total || 0) / 1000),
          products: Math.round((this.sectionTimes.products?.total || 0) / 1000)
        },
        focusedCompetitors,
        appliedFilters: filterEvents.map(e => ({
          type: e.details.filterType,
          value: e.details.filterValue,
          resultsCount: e.details.resultsCount
        })),
        deletedItems: {
          keywords: deleteEvents.filter(e => e.details.itemType === 'keywords').map(e => e.details.items).flat(),
          competitors: deleteEvents.filter(e => e.details.itemType === 'competitors').map(e => e.details.items).flat(),
          products: deleteEvents.filter(e => e.details.itemType === 'products').map(e => e.details.items).flat()
        },
        restoredItems: {
          keywords: restoreEvents.filter(e => e.details.itemType === 'keywords').map(e => e.details.items).flat(),
          competitors: restoreEvents.filter(e => e.details.itemType === 'competitors').map(e => e.details.items).flat(),
          products: restoreEvents.filter(e => e.details.itemType === 'products').map(e => e.details.items).flat()
        }
      },

      opportunities: this.identifyOpportunities(analysisData, userProduct),
      competitorSegments: this.analyzeCompetitorSegments(analysisData)
    }

    return auditData
  }

  private identifyOpportunities(analysisData: AnalysisData, userProduct?: UserProduct) {
    // Basic opportunity identification logic
    const brandDefense = []
    const brandAttack = []
    const keywordGaps = []
    const priceGaps = []

    // Look for brand defense opportunities (brand keywords with no strong competitor)
    if (userProduct) {
      const brandKeywords = analysisData.keywordList.filter(k => 
        k.keywordPhrase.toLowerCase().includes(userProduct.brand.toLowerCase()) &&
        !k.isDeleted
      )

      for (const keyword of brandKeywords) {
        const strongCompetitors = Object.values(keyword.rankings).filter(rank => rank <= 3).length
        if (strongCompetitors < 2) {
          brandDefense.push({
            type: 'brand_defense' as const,
            targetBrand: userProduct.brand,
            searchVolume: keyword.searchVolume,
            competitorPresence: strongCompetitors > 0,
            estimatedConversion: keyword.searchVolume * 0.03, // 3% conservative
            potentialRevenue: keyword.searchVolume * 0.03 * userProduct.price,
            confidence: 'high' as const,
            reasoning: `Low competition on brand keyword "${keyword.keywordPhrase}" with ${keyword.searchVolume} monthly searches`
          })
        }
      }
    }

    // Look for competitor weakness (brand attack opportunities)
    const competitorBrands = new Set(analysisData.competitorAnalysis.map(c => c.brand.toLowerCase()))
    const brandKeywords = analysisData.keywordList.filter(k => 
      !k.isDeleted && 
      competitorBrands.has(k.brandWord?.toLowerCase() || '')
    )

    for (const keyword of brandKeywords) {
      const targetBrand = keyword.brandWord
      if (!targetBrand) continue

      const competitorStrength = Object.values(keyword.rankings).filter(rank => rank <= 5).length
      if (competitorStrength < 3) {
        brandAttack.push({
          type: 'brand_attack' as const,
          targetBrand,
          searchVolume: keyword.searchVolume,
          competitorPresence: competitorStrength > 0,
          estimatedConversion: keyword.searchVolume * 0.01, // 1% conservative for attack
          potentialRevenue: keyword.searchVolume * 0.01 * (userProduct?.price || 25),
          confidence: 'medium' as const,
          reasoning: `Weak competition on "${targetBrand}" brand keyword with ${keyword.searchVolume} searches`
        })
      }
    }

    return {
      brandDefense: brandDefense.slice(0, 5),
      brandAttack: brandAttack.slice(0, 5),
      keywordGaps: keywordGaps.slice(0, 10),
      priceGaps: priceGaps.slice(0, 5)
    }
  }

  private analyzeCompetitorSegments(analysisData: AnalysisData) {
    const competitors = analysisData.competitorAnalysis.filter(c => !c.isDeleted)
    
    // Simple price-based segmentation
    const prices = competitors
      .map(c => parseFloat(c.price.replace(/[€,]/g, '')) || 0)
      .filter(p => p > 0)
      .sort((a, b) => a - b)

    if (prices.length === 0) return []

    const segments = [
      {
        name: 'Budget',
        priceRange: { min: prices[0], max: prices[Math.floor(prices.length * 0.33)] },
        marketShare: 0.4,
        characteristics: ['Prezzo basso', 'Volumi alti'],
        keyPlayers: [],
        strengths: ['Accessibilità', 'Market penetration'],
        weaknesses: ['Qualità percepita', 'Margin bassi']
      },
      {
        name: 'Mid-Range',
        priceRange: { 
          min: prices[Math.floor(prices.length * 0.33)], 
          max: prices[Math.floor(prices.length * 0.66)] 
        },
        marketShare: 0.4,
        characteristics: ['Bilanciamento prezzo-qualità'],
        keyPlayers: [],
        strengths: ['Versatilità', 'Ampia appeal'],
        weaknesses: ['Differenziazione limitata']
      },
      {
        name: 'Premium',
        priceRange: { 
          min: prices[Math.floor(prices.length * 0.66)], 
          max: prices[prices.length - 1] 
        },
        marketShare: 0.2,
        characteristics: ['Alta qualità', 'Brand premium'],
        keyPlayers: [],
        strengths: ['Margin alti', 'Brand loyalty'],
        weaknesses: ['Mercato limitato', 'Price sensitivity']
      }
    ]

    // Assign competitors to segments
    competitors.forEach(comp => {
      const price = parseFloat(comp.price.replace(/[€,]/g, '')) || 0
      for (const segment of segments) {
        if (price >= segment.priceRange.min && price <= segment.priceRange.max) {
          segment.keyPlayers.push(comp.brand)
          break
        }
      }
    })

    return segments
  }

  // Initialize from localStorage on construction
  init() {
    // Check if this is a new session
    const sessionFlag = sessionStorage.getItem('binodive_session_active')
    
    if (!sessionFlag) {
      // New session - clear everything and start fresh
      console.log('🧹 SessionTracker: New session - starting with clean tracking')
      this.clearSession()
      sessionStorage.setItem('binodive_session_active', 'true')
    } else {
      // Existing session - load previous data
      console.log('📝 SessionTracker: Continuing existing session')
      this.loadFromLocalStorage()
    }
  }

  // Get current session data for debugging
  getSessionData() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      events: this.events,
      sectionTimes: this.sectionTimes
    }
  }

  // Clear session data
  clearSession() {
    this.events = []
    this.sessionId = this.generateSessionId()
    this.startTime = new Date()
    this.sectionTimes = {}
    localStorage.removeItem('binodive_session_events')
    localStorage.removeItem('binodive_session_id')
  }
}

export const sessionTracker = new SessionTracker()

// Initialize on import
if (typeof window !== 'undefined') {
  sessionTracker.init()
}