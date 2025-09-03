'use client'

import React from 'react'
import { AppSidebar } from './AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b p-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-xl font-semibold">Amazon Competitor & Keyword Dashboard</h1>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}