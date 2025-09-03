'use client'

import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { BarChart3, FileUp, Settings, HelpCircle } from 'lucide-react'

const menuItems = [
  {
    title: "Master Keyword List (MKL)",
    url: "/",
    icon: BarChart3,
    isActive: true
  },
  {
    title: "File Upload",
    url: "/upload",
    icon: FileUp
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  },
  {
    title: "Help",
    url: "/help",
    icon: HelpCircle
  }
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>BinoDive Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={item.isActive}
                  >
                    <a href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">
          <p>BinoDive v1.0</p>
          <p>Amazon Analytics Platform</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}