'use client'

import { useRouter } from 'next/navigation'
import { FileUploader } from '@/components/upload/FileUploader'
import { AnalysisProvider, useAnalysis } from '@/hooks/useAnalysis'
import { sessionTracker } from '@/lib/sessionTracker'

function UploadContent() {
  const router = useRouter()
  const { 
    isUploading, 
    uploadProgress, 
    error, 
    uploadFiles 
  } = useAnalysis()

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

    // Redirect to dashboard after successful upload
    router.push('/')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Carica i tuoi file di analisi
          </h1>
          <p className="text-lg text-gray-600">
            Carica i file CSV per iniziare l&apos;analisi della concorrenza di mercato
          </p>
        </div>
        
        <FileUploader
          onFilesUploaded={handleFileUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={error}
        />
      </div>
    </div>
  )
}

export default function UploadPage() {
  return (
    <AnalysisProvider>
      <UploadContent />
    </AnalysisProvider>
  )
}