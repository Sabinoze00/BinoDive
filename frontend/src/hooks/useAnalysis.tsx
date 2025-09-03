'use client'

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react'
import { AnalysisData } from '@/types/analysis'
import { apiClient } from '@/lib/api'

interface AnalysisState {
  analysisId: string | null
  data: AnalysisData | null
  isLoading: boolean
  isUploading: boolean
  isUpdating: boolean
  uploadProgress: number
  error: string | null
}

type AnalysisAction =
  | { type: 'UPLOAD_START' }
  | { type: 'UPLOAD_PROGRESS'; payload: number }
  | { type: 'UPLOAD_SUCCESS'; payload: { analysisId: string } }
  | { type: 'UPLOAD_ERROR'; payload: string }
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: AnalysisData }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'UPDATE_START' }
  | { type: 'UPDATE_SUCCESS'; payload: AnalysisData }
  | { type: 'UPDATE_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' }

interface AnalysisContextType extends AnalysisState {
  uploadFiles: (files: { keywordAnalysis: File; businessData: File; productData: File }) => Promise<void>
  loadAnalysis: (analysisId: string) => Promise<void>
  updateKeywords: (deleted: string[], restored: string[]) => Promise<void>
  updateRootKeywords: (deleted: string[], restored: string[]) => Promise<void>
  updateCompetitors: (deleted: string[], restored: string[]) => Promise<void>
  updateProducts: (deleted: string[], restored: string[]) => Promise<void>
  clearError: () => void
  reset: () => void
}

// Load analysisId from localStorage if available
const getInitialAnalysisId = (): string | null => {
  if (typeof window !== 'undefined') {
    // Check if this is a new session (browser refresh or new tab)
    const sessionFlag = sessionStorage.getItem('binodive_session_active')
    
    if (!sessionFlag) {
      // New session - clear old data and tracking
      console.log('🔄 New session detected - clearing previous data and tracking')
      localStorage.removeItem('binodive_analysisId')
      localStorage.removeItem('binodive_session_events')
      localStorage.removeItem('binodive_session_id')
      localStorage.removeItem('binodive_audit_reports')
      
      // Mark session as active
      sessionStorage.setItem('binodive_session_active', 'true')
      return null
    }
    
    return localStorage.getItem('binodive_analysisId')
  }
  return null
}

const initialState: AnalysisState = {
  analysisId: getInitialAnalysisId(),
  data: null,
  isLoading: false,
  isUploading: false,
  isUpdating: false,
  uploadProgress: 0,
  error: null
}

function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'UPLOAD_START':
      return { ...state, isUploading: true, uploadProgress: 0, error: null }
    case 'UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.payload }
    case 'UPLOAD_SUCCESS':
      // Save analysisId to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('binodive_analysisId', action.payload.analysisId)
      }
      return { 
        ...state, 
        isUploading: false, 
        uploadProgress: 100, 
        analysisId: action.payload.analysisId,
        error: null 
      }
    case 'UPLOAD_ERROR':
      return { ...state, isUploading: false, uploadProgress: 0, error: action.payload }
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null }
    case 'LOAD_SUCCESS':
      return { ...state, isLoading: false, data: action.payload, error: null }
    case 'LOAD_ERROR':
      return { ...state, isLoading: false, error: action.payload }
    case 'UPDATE_START':
      return { ...state, isUpdating: true, error: null }
    case 'UPDATE_SUCCESS':
      return { ...state, isUpdating: false, data: action.payload, error: null }
    case 'UPDATE_ERROR':
      return { ...state, isUpdating: false, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'RESET':
      // Clear localStorage on reset
      if (typeof window !== 'undefined') {
        localStorage.removeItem('binodive_analysisId')
      }
      return { ...initialState, analysisId: null }
    default:
      return state
  }
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState)

  const loadAnalysis = useCallback(async (analysisId: string) => {
    dispatch({ type: 'LOAD_START' })
    
    try {
      const data = await apiClient.getAnalysis(analysisId)
      dispatch({ type: 'LOAD_SUCCESS', payload: data })
    } catch (error) {
      dispatch({ 
        type: 'LOAD_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load analysis' 
      })
    }
  }, [])

  // Auto-load analysis on mount if analysisId exists
  useEffect(() => {
    if (state.analysisId && !state.data && !state.isLoading) {
      loadAnalysis(state.analysisId).catch(() => {
        // If loading fails, clear the stored analysisId
        if (typeof window !== 'undefined') {
          localStorage.removeItem('binodive_analysisId')
        }
        dispatch({ type: 'RESET' })
      })
    }
  }, [state.analysisId, state.data, state.isLoading, loadAnalysis])

  const uploadFiles = useCallback(async (files: { 
    keywordAnalysis: File
    businessData: File
    productData: File 
  }) => {
    dispatch({ type: 'UPLOAD_START' })
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        dispatch({ type: 'UPLOAD_PROGRESS', payload: Math.min(state.uploadProgress + 10, 90) })
      }, 200)

      const response = await apiClient.uploadFiles(files)
      
      clearInterval(progressInterval)
      dispatch({ type: 'UPLOAD_SUCCESS', payload: { analysisId: response.analysisId } })
      
      // Auto-load the analysis data
      await loadAnalysis(response.analysisId)
      
    } catch (error) {
      dispatch({ 
        type: 'UPLOAD_ERROR', 
        payload: error instanceof Error ? error.message : 'Upload failed' 
      })
    }
  }, [state.uploadProgress, loadAnalysis])

  const updateKeywords = useCallback(async (deleted: string[], restored: string[]) => {
    if (!state.analysisId) {
      dispatch({ type: 'UPDATE_ERROR', payload: 'No analysis loaded' })
      return
    }

    dispatch({ type: 'UPDATE_START' })
    
    try {
      await apiClient.updateKeywords(state.analysisId, { deleted, restored })
      
      // Reload analysis data to get updated calculations
      const updatedData = await apiClient.getAnalysis(state.analysisId)
      dispatch({ type: 'UPDATE_SUCCESS', payload: updatedData })
      
    } catch (error) {
      dispatch({ 
        type: 'UPDATE_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update keywords' 
      })
    }
  }, [state.analysisId])

  const updateRootKeywords = useCallback(async (deleted: string[], restored: string[]) => {
    if (!state.analysisId) {
      dispatch({ type: 'UPDATE_ERROR', payload: 'No analysis loaded' })
      return
    }

    dispatch({ type: 'UPDATE_START' })
    
    try {
      await apiClient.updateRootKeywords(state.analysisId, { deleted, restored })
      
      // Reload analysis data to get updated calculations
      const updatedData = await apiClient.getAnalysis(state.analysisId)
      dispatch({ type: 'UPDATE_SUCCESS', payload: updatedData })
      
    } catch (error) {
      dispatch({ 
        type: 'UPDATE_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update root keywords' 
      })
    }
  }, [state.analysisId])

  const updateCompetitors = useCallback(async (deleted: string[], restored: string[]) => {
    if (!state.analysisId) {
      dispatch({ type: 'UPDATE_ERROR', payload: 'No analysis loaded' })
      return
    }

    dispatch({ type: 'UPDATE_START' })
    
    try {
      await apiClient.updateCompetitors(state.analysisId, { deleted, restored })
      
      // Reload analysis data to get updated calculations
      const updatedData = await apiClient.getAnalysis(state.analysisId)
      dispatch({ type: 'UPDATE_SUCCESS', payload: updatedData })
      
    } catch (error) {
      dispatch({ 
        type: 'UPDATE_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update competitors' 
      })
    }
  }, [state.analysisId])

  const updateProducts = useCallback(async (deleted: string[], restored: string[]) => {
    if (!state.analysisId) {
      dispatch({ type: 'UPDATE_ERROR', payload: 'No analysis loaded' })
      return
    }

    dispatch({ type: 'UPDATE_START' })
    
    try {
      await apiClient.updateProducts(state.analysisId, { deleted, restored })
      
      // Reload analysis data to get updated calculations
      const updatedData = await apiClient.getAnalysis(state.analysisId)
      dispatch({ type: 'UPDATE_SUCCESS', payload: updatedData })
      
    } catch (error) {
      dispatch({ 
        type: 'UPDATE_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update products' 
      })
    }
  }, [state.analysisId])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const contextValue: AnalysisContextType = {
    ...state,
    uploadFiles,
    loadAnalysis,
    updateKeywords,
    updateRootKeywords,
    updateCompetitors,
    updateProducts,
    clearError,
    reset
  }

  return (
    <AnalysisContext.Provider value={contextValue}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis(): AnalysisContextType {
  const context = useContext(AnalysisContext)
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider')
  }
  return context
}