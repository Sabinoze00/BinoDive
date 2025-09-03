'use client'

import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { FileUploader } from '@/components/upload/FileUploader'
import { MarketSummaryCard } from '@/components/dashboard/MarketSummary'
import { ImprovedUnifiedTable } from '@/components/dashboard/ImprovedUnifiedTable'
import { RootKeywordsTable } from '@/components/dashboard/RootKeywordsTable'
import { ProductsTable } from '@/components/dashboard/ProductsTable'
import { ProductDetailsTable } from '@/components/dashboard/ProductDetailsTable'
import { ProductTableView } from '@/components/dashboard/ProductTableView'
import { MarketAnalysis } from '@/components/dashboard/MarketAnalysis'
import { AuditGeneratorComponent } from '@/components/audit/AuditGenerator'
import { AnalysisProvider, useAnalysis } from '@/hooks/useAnalysis'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, ChevronUp, ChevronDown, Brain, RotateCcw } from 'lucide-react'
import { sessionTracker } from '@/lib/sessionTracker'

function DashboardContent() {
  const { 
    data, 
    isLoading, 
    isUploading, 
    isUpdating,
    uploadProgress, 
    error, 
    uploadFiles, 
    updateKeywords,
    updateRootKeywords,
    updateCompetitors,
    updateProducts,
    clearError 
  } = useAnalysis()

  const [activeTab, setActiveTab] = useState<'mlk' | 'root' | 'products' | 'market'>('mlk')
  const [uploadSectionMinimized, setUploadSectionMinimized] = useState(false)
  const [productViewMode, setProductViewMode] = useState<'cards' | 'detail' | 'table'>('table')
  const [showAuditGenerator, setShowAuditGenerator] = useState(false)

  // Manual session reset
  const handleNewSession = () => {
    if (confirm('Vuoi iniziare una nuova sessione? Tutti i dati attuali e il tracking saranno persi.')) {
      console.log('🔄 Manual session reset triggered')
      
      // Clear all data
      localStorage.removeItem('binodive_analysisId')
      localStorage.removeItem('binodive_session_events')
      localStorage.removeItem('binodive_session_id')
      localStorage.removeItem('binodive_audit_reports')
      sessionStorage.removeItem('binodive_session_active')
      
      // Clear session tracker
      sessionTracker.clearSession()
      
      // Reload page to start fresh
      window.location.reload()
    }
  }

  const handleFileUpload = async (files: {
    keywordAnalysis: File | null
    businessData: File | null
    productData: File | null
  }) => {
    if (!files.keywordAnalysis || !files.businessData || !files.productData) {
      return
    }

    // Track file upload
    const startTime = Date.now()
    await uploadFiles({
      keywordAnalysis: files.keywordAnalysis,
      businessData: files.businessData,
      productData: files.productData
    })
    
    // Track upload completion
    const processingTime = Date.now() - startTime
    sessionTracker.trackUpload(
      ['keywordAnalysis', 'businessData', 'productData'],
      3,
      processingTime
    )
  }

  const handleKeywordUpdate = async (deleted: string[], restored: string[]) => {
    // Track deletions and restorations
    if (deleted.length > 0) {
      sessionTracker.trackDelete('keywords', deleted)
    }
    if (restored.length > 0) {
      sessionTracker.trackRestore('keywords', restored)
    }
    await updateKeywords(deleted, restored)
  }

  const handleRootKeywordUpdate = async (deleted: string[], restored: string[]) => {
    // Track deletions and restorations
    if (deleted.length > 0) {
      sessionTracker.trackDelete('keywords', deleted)
    }
    if (restored.length > 0) {
      sessionTracker.trackRestore('keywords', restored)
    }
    await updateRootKeywords(deleted, restored)
  }

  const handleProductUpdate = async (deleted: string[], restored: string[]) => {
    // Track deletions and restorations
    if (deleted.length > 0) {
      sessionTracker.trackDelete('products', deleted)
    }
    if (restored.length > 0) {
      sessionTracker.trackRestore('products', restored)
    }
    await updateProducts(deleted, restored)
  }

  // Auto-minimize upload section after successful upload
  React.useEffect(() => {
    if (data && !isLoading && !error) {
      setUploadSectionMinimized(true)
    }
  }, [data, isLoading, error])

  // Track tab changes
  const handleTabChange = (newTab: 'mlk' | 'root' | 'products' | 'market') => {
    const tabNames = {
      'mlk': 'keywords',
      'root': 'root_keywords', 
      'products': 'products',
      'market': 'market_analysis'
    }
    
    sessionTracker.trackViewChange(tabNames[activeTab], tabNames[newTab])
    setActiveTab(newTab)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={clearError}
                className="text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Caricamento analisi in corso...
            </AlertDescription>
          </Alert>
        )}

        {/* File Uploader - Minimizable */}
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload Files</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewSession}
                  className="p-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                  title="Inizia una nuova sessione pulita"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadSectionMinimized(!uploadSectionMinimized)}
                  className="p-2"
                >
                  {uploadSectionMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {!uploadSectionMinimized && (
              <div className="mt-2">
                <FileUploader
                  onFilesUploaded={handleFileUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  error={error}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        {data && !isLoading && !error && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Analisi completata con successo! {data.keywordList.length} keyword e {data.competitorAnalysis.length} competitor processati.
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard Content */}
        {data && (
          <>
            <MarketSummaryCard data={data.marketSummary} />
            
            {/* Audit Generator Button */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="w-6 h-6 text-purple-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-purple-900">
                        Genera Audit Professionale con AI
                      </h3>
                      <p className="text-sm text-purple-700">
                        Ottieni un&apos;analisi dettagliata e raccomandazioni strategiche basate sui tuoi dati
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowAuditGenerator(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Genera Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabs */}
            <Card>
              <CardContent className="p-0">
                <div className="flex border-b">
                  <button
                    onClick={() => handleTabChange('mlk')}
                    className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                      activeTab === 'mlk' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    MLK Analysis
                  </button>
                  <button
                    onClick={() => handleTabChange('root')}
                    className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                      activeTab === 'root' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Root Keywords
                  </button>
                  <button
                    onClick={() => handleTabChange('products')}
                    className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                      activeTab === 'products' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Products
                  </button>
                  <button
                    onClick={() => handleTabChange('market')}
                    className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                      activeTab === 'market' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Analisi Mercato
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Tab Content */}
            {activeTab === 'mlk' && (
              <ImprovedUnifiedTable 
                data={data}
                onKeywordUpdate={handleKeywordUpdate}
                onCompetitorUpdate={updateCompetitors}
                isUpdating={isUpdating}
              />
            )}

            {activeTab === 'root' && (
              <RootKeywordsTable 
                rootKeywords={data.rootKeywords || []}
                onRootKeywordUpdate={handleRootKeywordUpdate}
                isUpdating={isUpdating}
              />
            )}

            {activeTab === 'products' && (
              <div className="space-y-4">
                {/* View Mode Toggle */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Visualizzazione Prodotti</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={productViewMode === 'cards' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setProductViewMode('cards')}
                        >
                          Cards
                        </Button>
                        <Button
                          variant={productViewMode === 'detail' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setProductViewMode('detail')}
                        >
                          Dettaglio Espandibile
                        </Button>
                        <Button
                          variant={productViewMode === 'table' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setProductViewMode('table')}
                        >
                          Tabellare Colonne
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Products Content */}
                {productViewMode === 'cards' && (
                  <ProductsTable 
                    products={data.productList || []}
                    onProductUpdate={handleProductUpdate}
                    isUpdating={isUpdating}
                  />
                )}
                
                {productViewMode === 'detail' && (
                  <ProductDetailsTable
                    products={data.productList || []}
                    keywords={data.keywordList || []}
                    onProductUpdate={handleProductUpdate}
                    isUpdating={isUpdating}
                  />
                )}

                {productViewMode === 'table' && (
                  <ProductTableView
                    products={data.productList || []}
                    keywords={data.keywordList || []}
                    onProductUpdate={handleProductUpdate}
                    isUpdating={isUpdating}
                  />
                )}
              </div>
            )}

            {activeTab === 'market' && (
              <MarketAnalysis data={data} />
            )}
          </>
        )}

        {/* Getting Started Guide */}
        {!data && !isLoading && !isUploading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Benvenuto in BinoDive
              </h3>
              <p className="text-gray-600">
                Per iniziare l&apos;analisi dei competitor Amazon, carica i tre file CSV richiesti:
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• File di analisi keyword (keyword_analysis...DATA.csv)</li>
                <li>• File di dati business (Helium_10_Xray...)</li>
                <li>• File di dati prodotto (KeepaExport...)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Audit Generator Modal */}
        {data && (
          <AuditGeneratorComponent
            analysisData={data}
            isVisible={showAuditGenerator}
            onClose={() => setShowAuditGenerator(false)}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default function HomePage() {
  return (
    <AnalysisProvider>
      <DashboardContent />
    </AnalysisProvider>
  )
}
