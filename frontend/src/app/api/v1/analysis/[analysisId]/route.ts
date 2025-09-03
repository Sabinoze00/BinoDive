import { NextRequest, NextResponse } from 'next/server'
import { ServerDataProcessor } from '@/lib/serverDataProcessor'
import { ApiResponse, AnalysisData } from '@/types/analysis'

export async function GET(
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

    // Get analysis data
    const analysisData = ServerDataProcessor.getAnalysisData(analysisId)

    if (!analysisData) {
      return NextResponse.json({
        success: false,
        error: 'Analysis not found'
      } as ApiResponse<null>, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: analysisData
    } as ApiResponse<AnalysisData>, { status: 200 })

  } catch (error) {
    console.error('Get analysis error:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}