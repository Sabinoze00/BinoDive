import type { AuditDataInput, AuditReport, DeepSeekAuditRequest, AuditGenerationConfig } from '@/types/audit'

class AuditGenerator {
  private config: AuditGenerationConfig = {
    aiProvider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.3,
    maxTokens: 8000,
    includeCharts: true,
    includeUserProduct: true,
    includeUserAnalyses: true,
    focusAreas: ['opportunities', 'competitive-analysis', 'roadmap']
  }

  async generateAudit(auditData: AuditDataInput): Promise<AuditReport> {
    try {
      // 1. Prepare AI prompt
      const prompt = this.buildAuditPrompt(auditData)
      
      // 2. Call DeepSeek API
      const auditContent = await this.callDeepSeekAPI(prompt)
      
      // 3. Structure the response
      const report = this.structureAuditReport(auditContent, auditData)
      
      // 4. Save to localStorage for persistence
      this.saveReportToStorage(report)
      
      return report
    } catch (error) {
      console.error('Audit generation failed:', error)
      throw new Error(`Failed to generate audit: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildAuditPrompt(data: AuditDataInput): string {
    const hasUserProduct = Boolean(data.userProduct)
    const hasUserAnalyses = data.userAnalyses.length > 0

    return `
# Amazon Market Analysis & Strategic Audit

Tu sei un esperto Amazon consultant con 10+ anni di esperienza. Analizza questi dati e genera un audit professionale dettagliato per ${data.brandName}.

## CONTESTO MERCATO
- **Periodo Analisi**: ${data.analysisDate.toLocaleDateString()}
- **Search Volume Totale**: ${data.marketSnapshot.totalSearchVolume.toLocaleString()} ricerche/mese  
- **Revenue Totale Mercato**: €${data.marketSnapshot.totalRevenue.toLocaleString()}
- **AOV Medio**: €${data.marketSnapshot.averageAOV.toFixed(2)}
- **Numero Competitor Attivi**: ${data.marketSnapshot.competitorCount}

### Top Competitor (Top 10)
${data.marketSnapshot.topCompetitors.map((comp, i) => `${i+1}. ${comp}`).join('\n')}

### Keywords Principali (Top 20)
${data.marketSnapshot.topKeywords.slice(0, 20).map((kw, i) => `${i+1}. ${kw}`).join('\n')}

## SEGMENTAZIONE COMPETITIVA
${data.competitorSegments.map(segment => `
**${segment.name}** (€${segment.priceRange.min}-${segment.priceRange.max})
- Market Share: ${(segment.marketShare * 100).toFixed(1)}%
- Players: ${segment.keyPlayers.slice(0, 5).join(', ')}
- Caratteristiche: ${segment.characteristics.join(', ')}
- Punti di Forza: ${segment.strengths.join(', ')}
- Debolezze: ${segment.weaknesses.join(', ')}
`).join('\n')}

${hasUserProduct ? `
## PRODOTTO ANALIZZATO
- **Nome**: ${data.userProduct!.name}
- **Brand**: ${data.userProduct!.brand}  
- **Prezzo**: €${data.userProduct!.price}
- **Categoria**: ${data.userProduct!.category}
- **Keywords Target**: ${data.userProduct!.targetKeywords.join(', ')}
- **USP**: ${data.userProduct!.uniqueSellingPoints.join(', ')}
- **Features**: ${data.userProduct!.features.join(', ')}
${data.userProduct!.currentPerformance ? `
- **Performance Attuale**:
  - Revenue Mensile: €${data.userProduct!.currentPerformance.monthlyRevenue?.toLocaleString() || 'N/A'}
  - Vendite Mensili: ${data.userProduct!.currentPerformance.monthlySales?.toLocaleString() || 'N/A'}
  - Conversion Rate: ${data.userProduct!.currentPerformance.conversionRate || 'N/A'}%
` : ''}
` : ''}

## OPPORTUNITÀ IDENTIFICATE

### Brand Defense
${data.opportunities.brandDefense.map(opp => `
- **${opp.targetBrand}**: ${opp.searchVolume.toLocaleString()} ricerche/mese
  - Conversioni Potenziali: ${Math.round(opp.estimatedConversion)}/mese
  - Revenue Potenziale: €${Math.round(opp.potentialRevenue)}/mese  
  - Confidenza: ${opp.confidence.toUpperCase()}
  - Rationale: ${opp.reasoning}
`).join('\n')}

### Brand Attack
${data.opportunities.brandAttack.map(opp => `
- **${opp.targetBrand}**: ${opp.searchVolume.toLocaleString()} ricerche/mese
  - Conversioni Potenziali: ${Math.round(opp.estimatedConversion)}/mese
  - Revenue Potenziale: €${Math.round(opp.potentialRevenue)}/mese
  - Confidenza: ${opp.confidence.toUpperCase()}
  - Rationale: ${opp.reasoning}
`).join('\n')}

## COMPORTAMENTO UTENTE (INSIGHTS ANALISI)
- **Tempo speso analizzando**:
  - Competitor: ${data.userBehavior.timeSpent.competitors} secondi
  - Keywords: ${data.userBehavior.timeSpent.keywords} secondi  
  - Products: ${data.userBehavior.timeSpent.products} secondi
- **Competitor più analizzati**: ${data.userBehavior.focusedCompetitors.join(', ')}
- **Filtri applicati**: ${data.userBehavior.appliedFilters.length} filtri
- **Items eliminati**: Keywords(${data.userBehavior.deletedItems.keywords.length}), Competitors(${data.userBehavior.deletedItems.competitors.length}), Products(${data.userBehavior.deletedItems.products.length})

${hasUserAnalyses ? `
## ANALISI PERSONALI DELL'UTENTE
${data.userAnalyses.map(analysis => `
**${analysis.title}** (${analysis.category.replace('_', ' ').toUpperCase()} - Priority: ${analysis.priority.toUpperCase()})
${analysis.content}
${analysis.tags.length > 0 ? `Tags: ${analysis.tags.join(', ')}` : ''}
`).join('\n\n')}
` : ''}

---

## RICHIESTA OUTPUT

Genera un audit professionale strutturato seguendo ESATTAMENTE questo formato:

# Audit Amazon - ${data.brandName}
*Analisi di Fattibilità e Strategia di Mercato*

## Executive Summary
[Paragrafo conciso con opportunità principali, raccomandazioni chiave e potenziali risultati quantificati]

## Analisi Mercato Amazon

### Dimensioni Mercato  
- Search Volume Totale: [numero] ricerche/mese
- Fatturato Analizzato: €[numero]/mese  
- AOV Medio Mercato: €[numero]

### Segmentazione Competitive
[Tabella o lista dei segmenti con caratteristiche, quota mercato, prezzi medi]

### Gap Mercato Identificati
[Lista numerata dei gap principali con dati quantitativi]

## Opportunità Brand Defense
[Per ogni opportunità: volume ricerche, proiezioni conservative revenue, vantaggi strategici]

## Opportunità Brand Attack  
[Target competitor vulnerabili, strategia di intercettazione, potenziale stimato]

## Posizionamento Competitivo
[Differenziazione vs competitor, vantaggio strategico, segmento target]

${hasUserProduct ? `## Analisi Prodotto Specifico
[Fit di mercato, positioning ottimale, pricing strategy, differenziazione]` : ''}

## Roadmap Implementazione
**Fase 1**: [Obiettivo e azioni immediate]
**Fase 2**: [Scaling strategy]  
**Fase 3**: [Long term optimization]

## Conclusioni
[Raccomandazioni finali actionable con metriche target]

---

**REQUIREMENTS CRITICI:**
- Usa SOLO dati forniti, no invenzioni
- Calcoli conservativi (conversion rate 1-3%)
- Focus su actionable insights
- Quantifica tutto (numeri concreti)
- Mantieni tone professionale da consultant
- Sii specifico su opportunità e strategie
`;
  }

  private async callDeepSeekAPI(prompt: string): Promise<string> {
    const request: DeepSeekAuditRequest = {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'Tu sei un Amazon marketing consultant esperto con specializzazione in analisi competitive e strategia di marketplace. Rispondi sempre con analisi dettagliate, dati concreti e raccomandazioni actionable.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    }

    const response = await fetch('/api/audit/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `API call failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.content || result.message || 'No content received'
  }

  private structureAuditReport(content: string, auditData: AuditDataInput): AuditReport {
    // Simple parsing - in a real implementation you might want more sophisticated parsing
    const sections = this.parseAuditContent(content)
    
    return {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: auditData.sessionId,
      brandName: auditData.brandName,
      generatedAt: new Date(),
      
      executiveSummary: {
        title: 'Executive Summary',
        content: sections.executiveSummary || 'Executive summary not found in generated content.'
      },
      
      marketAnalysis: {
        title: 'Market Analysis', 
        content: sections.marketAnalysis || 'Market analysis not found in generated content.'
      },
      
      opportunityAnalysis: {
        title: 'Opportunity Analysis',
        content: sections.opportunityAnalysis || 'Opportunity analysis not found in generated content.'
      },
      
      competitorIntelligence: {
        title: 'Competitive Intelligence',
        content: sections.competitorIntelligence || 'Competitor intelligence not found in generated content.'
      },
      
      userProductAnalysis: auditData.userProduct ? {
        title: 'Product Analysis',
        content: sections.productAnalysis || 'Product analysis not found in generated content.'
      } : undefined,
      
      userInsights: auditData.userAnalyses.length > 0 ? {
        title: 'User Insights Integration',
        content: sections.userInsights || 'User insights integration not found in generated content.'
      } : undefined,
      
      roadmap: {
        title: 'Implementation Roadmap',
        content: sections.roadmap || 'Implementation roadmap not found in generated content.'
      },
      
      conclusions: {
        title: 'Conclusions',
        content: sections.conclusions || 'Conclusions not found in generated content.'
      },
      
      confidence: this.calculateConfidence(auditData),
      dataQuality: this.assessDataQuality(auditData),
      recommendations: this.extractRecommendations(content),
      nextSteps: this.extractNextSteps(content),
      exportFormats: ['html', 'pdf']
    }
  }

  private parseAuditContent(content: string) {
    // Simple section parsing - could be enhanced with more sophisticated parsing
    const sections: Record<string, string> = {}
    
    // Try to extract major sections based on markdown headers
    const sectionPatterns = [
      { key: 'executiveSummary', pattern: /## Executive Summary\s*\n([\s\S]*?)(?=\n## |$)/i },
      { key: 'marketAnalysis', pattern: /## Analisi Mercato Amazon\s*\n([\s\S]*?)(?=\n## |$)/i },
      { key: 'opportunityAnalysis', pattern: /## Opportunit[àa].*?\n([\s\S]*?)(?=\n## |$)/i },
      { key: 'competitorIntelligence', pattern: /## Posizionamento Competitivo\s*\n([\s\S]*?)(?=\n## |$)/i },
      { key: 'productAnalysis', pattern: /## Analisi Prodotto.*?\n([\s\S]*?)(?=\n## |$)/i },
      { key: 'roadmap', pattern: /## Roadmap.*?\n([\s\S]*?)(?=\n## |$)/i },
      { key: 'conclusions', pattern: /## Conclusioni\s*\n([\s\S]*?)(?=\n## |$)/i }
    ]
    
    sectionPatterns.forEach(({ key, pattern }) => {
      const match = content.match(pattern)
      if (match && match[1]) {
        sections[key] = match[1].trim()
      }
    })
    
    // If no sections found, put everything in executive summary
    if (Object.keys(sections).length === 0) {
      sections.executiveSummary = content
    }
    
    return sections
  }

  private calculateConfidence(auditData: AuditDataInput): number {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on data quality
    if (auditData.marketSnapshot.totalSearchVolume > 10000) confidence += 0.1
    if (auditData.marketSnapshot.competitorCount > 5) confidence += 0.1  
    if (auditData.userProduct) confidence += 0.1
    if (auditData.userAnalyses.length > 0) confidence += 0.1
    if (auditData.opportunities.brandDefense.length > 0) confidence += 0.1
    if (auditData.userBehavior.timeSpent.competitors > 60) confidence += 0.1 // Spent time analyzing
    
    return Math.min(confidence, 1.0)
  }

  private assessDataQuality(auditData: AuditDataInput): 'high' | 'medium' | 'low' {
    const score = 
      (auditData.marketSnapshot.totalSearchVolume > 50000 ? 1 : 0) +
      (auditData.marketSnapshot.competitorCount > 10 ? 1 : 0) +
      (auditData.opportunities.brandDefense.length > 0 ? 1 : 0) +
      (auditData.opportunities.brandAttack.length > 0 ? 1 : 0) +
      (auditData.userProduct ? 1 : 0)
    
    if (score >= 4) return 'high'
    if (score >= 2) return 'medium'  
    return 'low'
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = []
    
    // Simple extraction of bullet points or numbered items
    const patterns = [
      /raccomandazione[:\s]*([^\n]+)/gi,
      /consiglio[:\s]*([^\n]+)/gi,
      /^[\s]*[-*]\s*([^\n]+)/gm,
      /^[\s]*\d+\.\s*([^\n]+)/gm
    ]
    
    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          recommendations.push(match[1].trim())
        }
      }
    })
    
    return [...new Set(recommendations)].slice(0, 10) // Remove duplicates, limit to 10
  }

  private extractNextSteps(content: string): string[] {
    const nextSteps: string[] = []
    
    // Look for roadmap or implementation steps
    const roadmapMatch = content.match(/roadmap.*?\n([\s\S]*?)(?=\n##|$)/i)
    if (roadmapMatch) {
      const roadmapText = roadmapMatch[1]
      const steps = roadmapText.match(/fase \d+[:\s]*([^\n]+)/gi)
      if (steps) {
        nextSteps.push(...steps.map(step => step.replace(/fase \d+[:\s]*/i, '').trim()))
      }
    }
    
    return nextSteps.slice(0, 5)
  }

  private saveReportToStorage(report: AuditReport) {
    try {
      const savedReports = JSON.parse(localStorage.getItem('binodive_audit_reports') || '[]')
      savedReports.unshift(report) // Add to beginning
      
      // Keep only last 10 reports
      const reportsToKeep = savedReports.slice(0, 10)
      localStorage.setItem('binodive_audit_reports', JSON.stringify(reportsToKeep))
    } catch (error) {
      console.warn('Failed to save audit report to localStorage:', error)
    }
  }

  // Get saved reports
  getSavedReports(): AuditReport[] {
    try {
      return JSON.parse(localStorage.getItem('binodive_audit_reports') || '[]')
    } catch {
      return []
    }
  }

  // Delete a saved report
  deleteReport(reportId: string) {
    try {
      const savedReports = this.getSavedReports()
      const filteredReports = savedReports.filter(r => r.id !== reportId)
      localStorage.setItem('binodive_audit_reports', JSON.stringify(filteredReports))
    } catch (error) {
      console.warn('Failed to delete audit report:', error)
    }
  }
}

export const auditGenerator = new AuditGenerator()