'use client'

import { FileUploader } from '@/components/upload/FileUploader'

export default function UploadPage() {
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
        
        <FileUploader />
      </div>
    </div>
  )
}