'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Target,
  Users,
  DollarSign,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import type { AuditReport } from '@/types/audit'

interface AuditReportViewerProps {
  report: AuditReport
  onClose: () => void
}

export const AuditReportViewer: React.FC<AuditReportViewerProps> = ({ 
  report, 
  onClose 
}) => {
  const [activeSection, setActiveSection] = useState('executive')

  const sections = [
    { id: 'executive', label: 'Executive Summary', icon: TrendingUp },
    { id: 'market', label: 'Market Analysis', icon: Users },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'competitive', label: 'Competitive Intelligence', icon: AlertTriangle },
    ...(report.userProductAnalysis ? [{ id: 'product', label: 'Product Analysis', icon: FileText }] : []),
    ...(report.userInsights ? [{ id: 'insights', label: 'User Insights', icon: CheckCircle }] : []),
    { id: 'roadmap', label: 'Roadmap', icon: Calendar },
    { id: 'conclusions', label: 'Conclusions', icon: DollarSign }
  ]

  const currentSection = sections.find(s => s.id === activeSection)
  const sectionContent = getSectionContent(activeSection, report)

  const handleExportPDF = async () => {
    // TODO: Implement PDF export
    alert('Export PDF sarà disponibile presto!')
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Audit Amazon - ${report.brandName}`,
        text: 'Audit generato con BinoDive AI',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiato negli appunti!')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Indietro
          </Button>
          <div>
            <h2 className="text-xl font-bold">Audit Amazon - {report.brandName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                {report.generatedAt.toLocaleDateString()} alle {report.generatedAt.toLocaleTimeString()}
              </span>
              <Badge variant={
                report.confidence > 0.8 ? 'default' : 
                report.confidence > 0.6 ? 'secondary' : 
                'outline'
              }>
                Confidenza: {Math.round(report.confidence * 100)}%
              </Badge>
              <Badge variant="outline">
                Qualità: {report.dataQuality}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-1" />
            Condividi
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
          >
            <Download className="w-4 h-4 mr-1" />
            Esporta PDF
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sezioni</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map(section => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-none transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {section.label}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Raccomandazioni</div>
                <div className="font-semibold">{report.recommendations.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Prossimi Passi</div>
                <div className="font-semibold">{report.nextSteps.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Formati Export</div>
                <div className="flex gap-1 mt-1">
                  {report.exportFormats.map(format => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {currentSection && <currentSection.icon className="w-5 h-5 mr-2" />}
                {currentSection?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(sectionContent) }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Report generato con BinoDive AI • Powered by DeepSeek
          </div>
          <div>
            ID: {report.id.split('_')[1]}
          </div>
        </div>
      </div>
    </div>
  )
}

function getSectionContent(sectionId: string, report: AuditReport): string {
  switch (sectionId) {
    case 'executive':
      return report.executiveSummary.content
    case 'market':
      return report.marketAnalysis.content
    case 'opportunities':
      return report.opportunityAnalysis.content
    case 'competitive':
      return report.competitorIntelligence.content
    case 'product':
      return report.userProductAnalysis?.content || 'Contenuto non disponibile'
    case 'insights':
      return report.userInsights?.content || 'Contenuto non disponibile'
    case 'roadmap':
      return report.roadmap.content
    case 'conclusions':
      return report.conclusions.content
    default:
      return 'Sezione non trovata'
  }
}

function formatContent(content: string): string {
  // Convert markdown-like formatting to HTML
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-6 text-gray-900">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Lists
    .replace(/^[\s]*-\s+(.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li class="ml-4 mb-1 list-decimal">$1</li>')
    
    // Paragraphs (basic)
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>')
    
    // Line breaks
    .replace(/\n/g, '<br>')
    
    // Euro formatting
    .replace(/€(\d+(?:[\.,]\d+)*)/g, '<span class="font-mono font-medium text-green-600">€$1</span>')
    
    // Numbers formatting  
    .replace(/(\d+(?:[\.,]\d+)*)\s*(ricerche|vendite|keyword)/g, '<span class="font-mono font-medium text-blue-600">$1</span> $2')
}