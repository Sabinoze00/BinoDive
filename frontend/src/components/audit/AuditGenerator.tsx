'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ProductInput } from './ProductInput'
import { UserAnalysisInput } from './UserAnalysisInput'
import { AuditReportViewer } from './AuditReportViewer'
import { FileText, Loader2, Brain, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { auditGenerator } from '@/lib/auditGenerator'
import { sessionTracker } from '@/lib/sessionTracker'
import type { UserProduct, UserAnalysis, AuditReport } from '@/types/audit'
import type { AnalysisData } from '@/types/analysis'

interface AuditGeneratorProps {
  analysisData: AnalysisData
  isVisible: boolean
  onClose: () => void
}

export const AuditGeneratorComponent: React.FC<AuditGeneratorProps> = ({ 
  analysisData, 
  isVisible, 
  onClose 
}) => {
  const [userProduct, setUserProduct] = useState<UserProduct | undefined>()
  const [userAnalyses, setUserAnalyses] = useState<UserAnalysis[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input')
  const [savedReports, setSavedReports] = useState<AuditReport[]>([])

  React.useEffect(() => {
    if (isVisible) {
      // Load saved reports
      setSavedReports(auditGenerator.getSavedReports())
    }
  }, [isVisible])

  const handleProductSave = (product: UserProduct) => {
    setUserProduct(product)
    sessionTracker.trackProductAdd(product)
    setError(null)
  }

  const handleAnalysesUpdate = (analyses: UserAnalysis[]) => {
    // Track new analyses
    const newAnalyses = analyses.filter(a => 
      !userAnalyses.find(existing => existing.id === a.id)
    )
    newAnalyses.forEach(analysis => {
      sessionTracker.trackAnalysisAdd(analysis)
    })
    
    setUserAnalyses(analyses)
    setError(null)
  }

  const handleGenerateAudit = async () => {
    if (!analysisData) {
      setError('Dati di analisi non disponibili')
      return
    }

    setIsGenerating(true)
    setError(null)
    setStep('generating')

    try {
      // Generate audit data from session
      const auditData = sessionTracker.generateAuditData(
        analysisData,
        userProduct,
        userAnalyses
      )

      console.log('Generated audit data:', auditData)

      // Generate audit report
      const report = await auditGenerator.generateAudit(auditData)

      console.log('Generated audit report:', report)

      setCurrentReport(report)
      setSavedReports(auditGenerator.getSavedReports())
      setStep('result')

    } catch (err) {
      console.error('Audit generation failed:', err)
      setError(err instanceof Error ? err.message : 'Errore durante la generazione dell\'audit')
      setStep('input')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewReport = (report: AuditReport) => {
    setCurrentReport(report)
    setStep('result')
  }

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo report?')) {
      auditGenerator.deleteReport(reportId)
      setSavedReports(auditGenerator.getSavedReports())
      if (currentReport?.id === reportId) {
        setCurrentReport(null)
        setStep('input')
      }
    }
  }

  const handleBackToInput = () => {
    setStep('input')
    setCurrentReport(null)
    setError(null)
  }

  const canGenerate = Boolean(analysisData && (userProduct || userAnalyses.length > 0))

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="w-6 h-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  AI Audit Generator
                </h2>
                <p className="text-gray-600">
                  Genera un audit dettagliato del mercato con analisi AI
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Come Funziona l&apos;Audit AI
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>Prodotto (opzionale):</strong> Aggiungi il tuo prodotto per un&apos;analisi personalizzata</li>
                        <li>• <strong>Analisi Personali (opzionale):</strong> Condividi i tuoi insights per un audit più preciso</li>
                        <li>• <strong>Tracking Automatico:</strong> L&apos;AI analizza anche il tuo comportamento nella sessione</li>
                        <li>• <strong>Export PDF:</strong> Salva l&apos;audit generato in formato professionale</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Input */}
              <ProductInput 
                onProductSave={handleProductSave}
                initialProduct={userProduct}
              />

              {/* User Analysis Input */}
              <UserAnalysisInput 
                analyses={userAnalyses}
                onAnalysesUpdate={handleAnalysesUpdate}
              />

              {/* Saved Reports */}
              {savedReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Report Salvati ({savedReports.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {savedReports.map(report => (
                        <div key={report.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{report.brandName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">
                                {report.generatedAt.toLocaleDateString()} {report.generatedAt.toLocaleTimeString()}
                              </span>
                              <Badge variant={
                                report.confidence > 0.8 ? 'default' : 
                                report.confidence > 0.6 ? 'secondary' : 
                                'outline'
                              }>
                                Confidenza: {Math.round(report.confidence * 100)}%
                              </Badge>
                              <Badge variant="outline">
                                {report.dataQuality}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Visualizza
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <Brain className="w-6 h-6 text-white absolute top-3 left-3" />
              </div>
              <h3 className="text-xl font-semibold">Generazione Audit in Corso...</h3>
              <p className="text-gray-600 text-center max-w-md">
                L&apos;AI sta analizzando i tuoi dati e generando un audit dettagliato. 
                Questo processo può richiedere alcuni secondi.
              </p>
              <div className="mt-8 space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Raccolta dati sessione completata
                </div>
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                  Generazione audit con AI...
                </div>
              </div>
            </div>
          )}

          {step === 'result' && currentReport && (
            <AuditReportViewer 
              report={currentReport}
              onClose={handleBackToInput}
            />
          )}
        </div>

        {/* Footer */}
        {step === 'input' && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1 ${userProduct ? 'text-green-500' : 'text-gray-400'}`} />
                  Prodotto: {userProduct ? 'Configurato' : 'Opzionale'}
                </div>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1 ${userAnalyses.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                  Analisi: {userAnalyses.length} elementi
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  Dati sessione: Raccolti automaticamente
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  Powered by DeepSeek AI
                </span>
                <Button
                  onClick={handleGenerateAudit}
                  disabled={!canGenerate || isGenerating}
                  className="flex items-center"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Genera Audit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}