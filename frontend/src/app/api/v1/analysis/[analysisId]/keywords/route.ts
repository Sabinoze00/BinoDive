import { NextRequest, NextResponse } from 'next/server'
import { ServerDataProcessor } from '@/lib/serverDataProcessor'
import { ApiResponse, KeywordUpdateResponse } from '@/types/analysis'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params

    if (!analysisId) {
      return NextResponse.json({
        success: false,
        error: 'Analysis ID is required'
      } as ApiResponse<null>, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { deleted = [], restored = [] } = body

    if (!Array.isArray(deleted) || !Array.isArray(restored)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format. Expected arrays for deleted and restored keywords.'
      } as ApiResponse<null>, { status: 400 })
    }

    // Update keywords
    const updatedData = ServerDataProcessor.updateKeywords(analysisId, deleted, restored)

    if (!updatedData) {
      return NextResponse.json({
        success: false,
        error: 'Analysis not found'
      } as ApiResponse<null>, { status: 404 })
    }

    // Return success response with updated data
    return NextResponse.json({
      success: true,
      data: {
        success: true,
        recalculated: true,
        newMarketSV: updatedData.marketSummary.totalMarketSV,
        affectedCompetitors: updatedData.competitorAnalysis.map(c => c.asin)
      } as KeywordUpdateResponse
    } as ApiResponse<KeywordUpdateResponse>, { status: 200 })

  } catch (error) {
    console.error('Update keywords error:', error)
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
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}