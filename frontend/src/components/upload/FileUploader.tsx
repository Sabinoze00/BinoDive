'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadState {
  keywordAnalysis: File | null
  businessData: File | null
  productData: File | null
}

interface FileUploaderProps {
  onFilesUploaded: (files: FileUploadState) => void
  isUploading?: boolean
  uploadProgress?: number
  error?: string | null
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
  isUploading = false,
  uploadProgress = 0,
  error = null
}) => {
  const [files, setFiles] = useState<FileUploadState>({
    keywordAnalysis: null,
    businessData: null,
    productData: null
  })
  const [dragActive, setDragActive] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent, fileType: keyof FileUploadState) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(fileType)
    } else if (e.type === 'dragleave') {
      setDragActive(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, fileType: keyof FileUploadState) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(null)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setFiles(prev => ({ ...prev, [fileType]: file }))
      }
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, fileType: keyof FileUploadState) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFiles(prev => ({ ...prev, [fileType]: file }))
    }
  }, [])

  const handleUpload = useCallback(() => {
    if (files.keywordAnalysis && files.businessData && files.productData) {
      onFilesUploaded(files)
    }
  }, [files, onFilesUploaded])

  const canUpload = files.keywordAnalysis && files.businessData && files.productData && !isUploading

  const FileDropZone = ({ 
    fileType, 
    title, 
    description, 
    file 
  }: { 
    fileType: keyof FileUploadState
    title: string
    description: string
    file: File | null
  }) => (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        dragActive === fileType ? "border-blue-500 bg-blue-50" : "border-gray-300",
        file ? "border-green-500 bg-green-50" : "hover:border-gray-400"
      )}
      onDragEnter={(e) => handleDrag(e, fileType)}
      onDragLeave={(e) => handleDrag(e, fileType)}
      onDragOver={(e) => handleDrag(e, fileType)}
      onDrop={(e) => handleDrop(e, fileType)}
    >
      <input
        type="file"
        id={`file-${fileType}`}
        accept=".csv"
        onChange={(e) => handleFileChange(e, fileType)}
        className="hidden"
      />
      
      <div className="flex flex-col items-center space-y-2">
        {file ? (
          <>
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-green-700">{file.name}</p>
            <p className="text-xs text-green-600">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </>
        )}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(`file-${fileType}`)?.click()}
        >
          <FileText className="w-4 h-4 mr-2" />
          {file ? 'Change File' : 'Browse CSV'}
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload CSV Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FileDropZone
            fileType="keywordAnalysis"
            title="Keyword Analysis File"
            description="keyword_analysis...DATA.csv"
            file={files.keywordAnalysis}
          />
          
          <FileDropZone
            fileType="businessData"
            title="Business Data File"
            description="Helium_10_Xray..."
            file={files.businessData}
          />
          
          <FileDropZone
            fileType="productData"
            title="Product Data File"
            description="KeepaExport..."
            file={files.productData}
          />
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing files...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleUpload}
            disabled={!canUpload}
            size="lg"
            className="w-full md:w-auto"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Analyze Files ({Object.values(files).filter(Boolean).length}/3)
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Required files: Keyword Analysis, Business Data, and Product Data (CSV format)</p>
          <p>Max file size: 50MB per file</p>
        </div>
      </CardContent>
    </Card>
  )
}