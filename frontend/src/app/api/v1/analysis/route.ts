import { NextRequest, NextResponse } from 'next/server'
import { ServerDataProcessor } from '@/lib/serverDataProcessor'
import { ApiResponse, UploadFilesResponse } from '@/types/analysis'

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData()
    
    // Extract files
    const keywordFile = formData.get('keywordAnalysisFile') as File
    const businessFile = formData.get('businessDataFile') as File
    const productFile = formData.get('productDataFile') as File

    // Validate files
    if (!keywordFile || !businessFile || !productFile) {
      return NextResponse.json({
        success: false,
        error: 'All three CSV files are required: keywordAnalysisFile, businessDataFile, productDataFile'
      } as ApiResponse<null>, { status: 400 })
    }

    // Read file contents
    const [keywordContent, businessContent, productContent] = await Promise.all([
      keywordFile.text(),
      businessFile.text(),
      productFile.text()
    ])

    // Process files
    const analysisId = await ServerDataProcessor.processFiles(
      keywordContent,
      businessContent, 
      productContent
    )

    // Get analysis data for summary
    const analysisData = await ServerDataProcessor.getAnalysisData(analysisId)

    if (!analysisData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process analysis data'
      } as ApiResponse<null>, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        summary: {
          totalKeywords: analysisData.keywordList.length,
          totalCompetitors: analysisData.competitorAnalysis.length,
          totalMarketSV: analysisData.marketSummary.totalMarketSV
        }
      } as UploadFilesResponse
    } as ApiResponse<UploadFilesResponse>, { status: 200 })

  } catch (error) {
    console.error('Upload files error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse<null>, { status: 500 })
  }
}

// Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}