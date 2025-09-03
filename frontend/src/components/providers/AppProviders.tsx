'use client'

import { AnalysisProvider } from '@/hooks/useAnalysis'
import { ReactNode } from 'react'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AnalysisProvider>
      {children}
    </AnalysisProvider>
  )
}