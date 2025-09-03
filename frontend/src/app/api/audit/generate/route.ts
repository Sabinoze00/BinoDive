import { NextRequest, NextResponse } from 'next/server'
import type { DeepSeekAuditRequest } from '@/types/audit'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body: DeepSeekAuditRequest = await request.json()
    
    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      )
    }

    // Get API key from environment
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not configured')
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      )
    }

    // Prepare request to DeepSeek
    const deepSeekRequest = {
      model: body.model || 'deepseek-chat',
      messages: body.messages,
      temperature: body.temperature || 0.3,
      max_tokens: body.max_tokens || 8000,
      stream: false
    }

    console.log('Calling DeepSeek API with request:', {
      ...deepSeekRequest,
      messages: deepSeekRequest.messages.map(m => ({
        ...m,
        content: m.content.substring(0, 100) + '...' // Log only first 100 chars
      }))
    })

    // Call DeepSeek API
    const deepSeekResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(deepSeekRequest)
    })

    if (!deepSeekResponse.ok) {
      const errorText = await deepSeekResponse.text()
      console.error('DeepSeek API error:', {
        status: deepSeekResponse.status,
        statusText: deepSeekResponse.statusText,
        body: errorText
      })
      
      return NextResponse.json(
        { error: `DeepSeek API error: ${deepSeekResponse.statusText}` },
        { status: deepSeekResponse.status }
      )
    }

    const deepSeekResult = await deepSeekResponse.json()
    
    // Validate DeepSeek response
    if (!deepSeekResult.choices || !deepSeekResult.choices[0] || !deepSeekResult.choices[0].message) {
      console.error('Invalid DeepSeek response structure:', deepSeekResult)
      return NextResponse.json(
        { error: 'Invalid response from DeepSeek API' },
        { status: 500 }
      )
    }

    const content = deepSeekResult.choices[0].message.content
    
    console.log('DeepSeek API success:', {
      usage: deepSeekResult.usage,
      contentLength: content?.length || 0
    })

    return NextResponse.json({
      success: true,
      content: content,
      usage: deepSeekResult.usage,
      model: deepSeekResult.model
    })

  } catch (error) {
    console.error('Audit generation error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}