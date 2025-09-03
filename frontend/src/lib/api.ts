import { AnalysisData, ApiResponse, UploadFilesResponse, KeywordUpdateResponse, ProductUpdateResponse } from '@/types/analysis'

class AnalysisApiClient {
  private baseUrl: string
  private fallbackUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
    this.fallbackUrl = 'http://localhost:3001/api/v1'
  }

  private async fetchWithFallback(url: string, options?: RequestInit): Promise<Response> {
    try {
      // First try with proxy
      return await fetch(url, options)
    } catch (error) {
      console.warn('Proxy failed, trying direct connection:', error)
      // Fallback to direct connection
      const fallbackUrl = url.replace(this.baseUrl, this.fallbackUrl)
      return await fetch(fallbackUrl, options)
    }
  }

  async uploadFiles(files: {
    keywordAnalysis: File,
    businessData: File,
    productData: File
  }): Promise<UploadFilesResponse> {
    const formData = new FormData()
    formData.append('keywordAnalysisFile', files.keywordAnalysis)
    formData.append('businessDataFile', files.businessData)
    formData.append('productDataFile', files.productData)

    const response = await this.fetchWithFallback(`${this.baseUrl}/analysis`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      let errorMessage = `Upload failed: ${response.statusText}`
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch (e) {
        // If can't parse JSON, use the status text
      }
      throw new Error(errorMessage)
    }

    const result: ApiResponse<UploadFilesResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Upload failed')
    }

    return result.data
  }

  async getAnalysis(analysisId: string): Promise<AnalysisData> {
    const response = await this.fetchWithFallback(`${this.baseUrl}/analysis/${analysisId}`)
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch analysis: ${response.statusText}`
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch (e) {
        // If can't parse JSON, use the status text
      }
      throw new Error(errorMessage)
    }

    const result: ApiResponse<AnalysisData> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch analysis')
    }

    return result.data
  }

  async updateKeywords(
    analysisId: string, 
    update: { deleted: string[], restored: string[] }
  ): Promise<KeywordUpdateResponse> {
    const response = await this.fetchWithFallback(`${this.baseUrl}/analysis/${analysisId}/keywords`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deletedKeywords: update.deleted,
        restoredKeywords: update.restored
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update keywords: ${response.statusText}`)
    }

    const result: ApiResponse<KeywordUpdateResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update keywords')
    }

    return result.data
  }

  async updateRootKeywords(
    analysisId: string, 
    update: { deleted: string[], restored: string[] }
  ): Promise<KeywordUpdateResponse> {
    const response = await this.fetchWithFallback(`${this.baseUrl}/analysis/${analysisId}/root-keywords`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deletedRootWords: update.deleted,
        restoredRootWords: update.restored
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update root keywords: ${response.statusText}`)
    }

    const result: ApiResponse<KeywordUpdateResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update root keywords')
    }

    return result.data
  }

  async updateCompetitors(
    analysisId: string, 
    update: { deleted: string[], restored: string[] }
  ): Promise<KeywordUpdateResponse> {
    const response = await this.fetchWithFallback(`${this.baseUrl}/analysis/${analysisId}/competitors`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deletedCompetitors: update.deleted,
        restoredCompetitors: update.restored
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update competitors: ${response.statusText}`)
    }

    const result: ApiResponse<KeywordUpdateResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update competitors')
    }

    return result.data
  }

  async updateProducts(
    analysisId: string, 
    update: { deleted: string[], restored: string[] }
  ): Promise<ProductUpdateResponse> {
    const response = await this.fetchWithFallback(`${this.baseUrl}/analysis/${analysisId}/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deletedProducts: update.deleted,
        restoredProducts: update.restored
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update products: ${response.statusText}`)
    }

    const result: ApiResponse<ProductUpdateResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update products')
    }

    return result.data
  }
}

export const apiClient = new AnalysisApiClient()