'use client'

import React, { useState, useMemo } from 'react'
import { sessionTracker } from '@/lib/sessionTracker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Trash2, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import type { AnalysisData, ProcessedKeyword } from '@/types/analysis'

type SortField = 'keywordPhrase' | 'searchVolume' | 'relevance' | 'isBrand'
type SortDirection = 'asc' | 'desc'

interface ImprovedUnifiedTableProps {
  data: AnalysisData
  onKeywordUpdate: (deleted: string[], restored: string[]) => void
  onCompetitorUpdate?: (deleted: string[], restored: string[]) => void
  isUpdating?: boolean
}

export const ImprovedUnifiedTable: React.FC<ImprovedUnifiedTableProps> = ({ 
  data, 
  onKeywordUpdate,
  onCompetitorUpdate,
  isUpdating = false 
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [showDeleted, setShowDeleted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('keywordPhrase')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [editingBrandWord, setEditingBrandWord] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set())
  const [brandFilter, setBrandFilter] = useState<'all' | 'brand' | 'non-brand'>('all')
  
  // Filtri inline
  const [svFilter, setSvFilter] = useState<string>('')
  const [relevanceFilter, setRelevanceFilter] = useState<string>('')
  const [strengthFilter, setStrengthFilter] = useState<Set<'Molto Forte' | 'Forte' | 'Medio' | 'Debole'>>(new Set())
  const [revenueFilter, setRevenueFilter] = useState<string>('')

  // Helper function to parse European number format (same as backend)
  const parseEuropeanNumber = (value: string): number => {
    if (!value || typeof value !== 'string') return 0;
    
    const cleaned = value.trim();
    
    if (cleaned.includes(',')) {
      // Format: "24.779,36" -> "24779.36"
      const parts = cleaned.split(',');
      const integerPart = parts[0].replace(/[€\s\.]/g, ''); // Remove €, spaces, dots
      const decimalPart = parts[1] || '';
      return parseFloat(integerPart + '.' + decimalPart) || 0;
    } else {
      // Format: "1.487" (could be 1487 or 1.487)
      const cleanedNum = cleaned.replace(/[€\s]/g, ''); // Remove € and spaces
      const parts = cleanedNum.split('.');
      if (parts.length === 2 && parts[1].length > 2) {
        // This is likely "1.487" = 1487
        return parseInt(cleanedNum.replace(/\./g, '')) || 0;
      } else if (parts.length > 2) {
        // Multiple dots: "1.234.567" = 1234567
        return parseInt(cleanedNum.replace(/\./g, '')) || 0;
      } else {
        // Simple number or decimal: "1.5" = 1.5
        return parseFloat(cleanedNum) || 0;
      }
    }
  }

  const activeCompetitors = useMemo(() => {
    let filtered = data.competitorAnalysis.filter(comp => !comp.isDeleted)
    
    // Filtri per competitors
    if (strengthFilter.size > 0) {
      filtered = filtered.filter(comp => strengthFilter.has(comp.strengthLevel as 'Molto Forte' | 'Forte' | 'Medio' | 'Debole'))
      // Track filter application
      sessionTracker.trackFilter('strength', Array.from(strengthFilter), filtered.length)
    }
    if (revenueFilter) {
      const minRevenue = parseFloat(revenueFilter)
      if (!isNaN(minRevenue)) {
        const beforeFilterCount = filtered.length
        filtered = filtered.filter(comp => {
          const revenue = parseEuropeanNumber(comp.revenue)
          return revenue >= minRevenue
        })
        // Track filter application only if results changed
        if (filtered.length !== beforeFilterCount) {
          sessionTracker.trackFilter('revenue', minRevenue, filtered.length)
        }
      }
    }
    
    return filtered
  }, [data.competitorAnalysis, strengthFilter, revenueFilter])

  const filteredKeywords = useMemo(() => {
    let filtered = data.keywordList.filter(kw => {
      if (!showDeleted && kw.isDeleted) return false
      if (brandFilter === 'brand' && !kw.isBrand) return false
      if (brandFilter === 'non-brand' && kw.isBrand) return false
      
      // Filtri inline
      if (svFilter && kw.searchVolume < parseInt(svFilter)) return false
      if (relevanceFilter && kw.relevance < parseFloat(relevanceFilter)) return false
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesKeyword = kw.keywordPhrase.toLowerCase().includes(searchLower)
        const matchesBrand = kw.brandWord?.toLowerCase().includes(searchLower) || false
        if (!matchesKeyword && !matchesBrand) return false
      }
      return true
    })

    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''
      
      switch (sortField) {
        case 'keywordPhrase':
          aValue = a.keywordPhrase.toLowerCase()
          bValue = b.keywordPhrase.toLowerCase()
          break
        case 'searchVolume':
          aValue = a.searchVolume
          bValue = b.searchVolume
          break
        case 'relevance':
          aValue = a.relevance
          bValue = b.relevance
          break
        case 'isBrand':
          aValue = a.isBrand ? 1 : 0
          bValue = b.isBrand ? 1 : 0
          break
      }
      
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue as string)
        return sortDirection === 'asc' ? comparison : -comparison
      } else {
        const comparison = (aValue as number) - (bValue as number)
        return sortDirection === 'asc' ? comparison : -comparison
      }
    })

    return filtered
  }, [data.keywordList, showDeleted, searchTerm, sortField, sortDirection, brandFilter, svFilter, relevanceFilter])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="w-4 h-4 opacity-50" />
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  const handleBulkDelete = async () => {
    const keywordsToDelete = Array.from(selectedKeywords)
    await onKeywordUpdate(keywordsToDelete, [])
    setSelectedKeywords(new Set())
  }

  const handleBulkRestore = async () => {
    const keywordsToRestore = Array.from(selectedKeywords)
    await onKeywordUpdate([], keywordsToRestore)
    setSelectedKeywords(new Set())
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeywords(new Set(filteredKeywords.map(kw => kw.keywordPhrase)))
    } else {
      setSelectedKeywords(new Set())
    }
  }

  const getStrengthBadgeColor = (level: string) => {
    switch (level) {
      case 'Molto Forte': return 'bg-red-500'
      case 'Forte': return 'bg-yellow-500'  
      case 'Medio': return 'bg-blue-500'
      case 'Debole': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const handleBrandWordDoubleClick = (keywordPhrase: string, currentBrandWord: string | null) => {
    setEditingBrandWord(keywordPhrase)
    setEditingValue(currentBrandWord || '')
  }

  const handleBrandWordSave = async () => {
    if (!editingBrandWord) return
    
    // Find the keyword in data and update it
    const keyword = data.keywordList.find(kw => kw.keywordPhrase === editingBrandWord)
    if (!keyword) return
    
    // Update the keyword's brand word and is_brand status
    keyword.brandWord = editingValue.trim() || null
    keyword.isBrand = !!(editingValue.trim())
    
    // Reset editing state
    setEditingBrandWord(null)
    setEditingValue('')
    
    // Note: In a real implementation, you'd want to call an API to persist these changes
    // For now, we're just updating the local state
  }

  const handleBrandWordCancel = () => {
    setEditingBrandWord(null)
    setEditingValue('')
  }

  const handleCompetitorDelete = async () => {
    if (!onCompetitorUpdate) return
    
    const competitorsToDelete = Array.from(selectedCompetitors)
    await onCompetitorUpdate(competitorsToDelete, [])
    setSelectedCompetitors(new Set())
  }

  const handleCompetitorRestore = async () => {
    if (!onCompetitorUpdate) return
    
    const competitorsToRestore = Array.from(selectedCompetitors)
    await onCompetitorUpdate([], competitorsToRestore)
    setSelectedCompetitors(new Set())
  }

  const selectedCount = selectedKeywords.size
  const allSelected = selectedCount === filteredKeywords.length && filteredKeywords.length > 0

  return (
    <div className="w-full space-y-4">
      {/* Controlli Compatti */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Ricerca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtri Quick */}
            <div className="flex gap-2">
              <Button 
                variant={brandFilter === 'brand' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setBrandFilter(brandFilter === 'brand' ? 'all' : 'brand');
                }}
              >
                {brandFilter === 'brand' ? 'Mostra Tutte' : 'Filtra Brand'}
              </Button>
              <Button 
                variant={brandFilter === 'non-brand' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setBrandFilter(brandFilter === 'non-brand' ? 'all' : 'non-brand');
                }}
              >
                {brandFilter === 'non-brand' ? 'Mostra Tutte' : 'Filtra Non-Brand'}
              </Button>
            </div>

            {/* Controlli Azioni */}
            {selectedCount > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isUpdating}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Elimina ({selectedCount})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkRestore}
                  disabled={isUpdating}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Ripristina ({selectedCount})
                </Button>
              </div>
            )}

            <Button 
              variant={showDeleted ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted ? 'Nascondi Eliminate' : 'Mostra Eliminate'}
            </Button>

            <div className="text-sm text-gray-500">
              {filteredKeywords.length} di {data.keywordList.filter(kw => !kw.isDeleted).length} keyword
            </div>

            {/* Competitor Controls */}
            {selectedCompetitors.size > 0 && (
              <div className="flex gap-2 items-center border-l pl-4">
                <span className="text-sm font-medium text-gray-700">
                  Competitor selezionati: {selectedCompetitors.size}
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleCompetitorDelete}
                  disabled={isUpdating}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Elimina
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCompetitorRestore}
                  disabled={isUpdating}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Ripristina
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabella Unificata */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Analisi Completa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[80vh]">
            <Table className="min-w-full">
              {/* THEAD - Competitor Analysis */}
              <TableHeader>
                {/* Row 1: Images */}
                <TableRow className="bg-slate-50">
                  <TableHead rowSpan={13} className="sticky left-0 bg-slate-50 border-r-2 border-slate-300 min-w-[250px] align-top p-4">
                    <div className="font-semibold text-lg">Analisi Competitiva</div>
                  </TableHead>
                  <TableHead className="text-center font-semibold">Metrica</TableHead>
                  <TableHead className="text-center font-semibold">Filtro</TableHead>
                  <TableHead className="text-center font-semibold">Azione</TableHead>
                  <TableHead className="text-center font-bold text-blue-700 bg-blue-50 min-w-[80px]">
                    Totale ({activeCompetitors.length})
                  </TableHead>
                  {activeCompetitors.map((competitor) => (
                    <TableHead key={competitor.asin} className="text-center p-2 min-w-[120px]">
                      <div className="flex flex-col items-center space-y-2">
                        <img 
                          src={competitor.imageUrl || '/placeholder-product.png'} 
                          alt={competitor.brand}
                          className="w-16 h-16 object-contain rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-product.png'
                          }}
                        />
                        <Checkbox 
                          checked={selectedCompetitors.has(competitor.asin)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedCompetitors)
                            if (checked) {
                              newSelected.add(competitor.asin)
                            } else {
                              newSelected.delete(competitor.asin)
                            }
                            setSelectedCompetitors(newSelected)
                          }}
                          disabled={isUpdating}
                        />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
                
                {/* Metrics Rows */}
                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold text-gray-700">Brand</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-bold bg-blue-50 text-blue-700">
                    {data.marketSummary.uniqueBrands}
                  </TableCell>
                  {activeCompetitors.map((comp) => (
                    <TableCell key={comp.asin} className="text-center font-medium">{comp.brand}</TableCell>
                  ))}
                </TableRow>

                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold text-gray-700">% Forza</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-bold bg-blue-50 text-blue-700">
                    {activeCompetitors.length > 0 
                      ? (activeCompetitors.reduce((sum, c) => sum + c.strengthPercentage, 0) / activeCompetitors.length).toFixed(1) + '%'
                      : '0%'
                    }
                  </TableCell>
                  {activeCompetitors.map((comp) => (
                    <TableCell key={comp.asin} className="text-center font-semibold hover:bg-blue-50">
                      {comp.strengthPercentage.toFixed(2)}%
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold text-gray-700">Forza</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="p-2">
                    <div className="space-y-1">
                      {(['Molto Forte', 'Forte', 'Medio', 'Debole'] as const).map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            id={`strength-${level}`}
                            checked={strengthFilter.has(level)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(strengthFilter);
                              if (checked) {
                                newSet.add(level);
                              } else {
                                newSet.delete(level);
                              }
                              setStrengthFilter(newSet);
                            }}
                            className="h-4 w-4"
                          />
                          <label htmlFor={`strength-${level}`} className="text-sm cursor-pointer font-medium text-gray-700">
                            {level}
                          </label>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold bg-blue-50 text-blue-700">
                    <div className="flex justify-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-red-500 text-white min-w-[24px] h-6 rounded-full hover:bg-red-600">
                              {data.strengthSummary.moltoForte}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Molto Forte</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-yellow-500 text-white min-w-[24px] h-6 rounded-full hover:bg-yellow-600">
                              {data.strengthSummary.forte}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Forte</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-blue-500 text-white min-w-[24px] h-6 rounded-full hover:bg-blue-600">
                              {data.strengthSummary.medio}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Medio</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-gray-500 text-white min-w-[24px] h-6 rounded-full hover:bg-gray-600">
                              {data.strengthSummary.debole}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Debole</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  {activeCompetitors.map((comp) => (
                    <TableCell key={comp.asin} className="text-center">
                      <Badge className={`${getStrengthBadgeColor(comp.strengthLevel)} text-white text-xs hover:opacity-80`}>
                        {comp.strengthLevel}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Sales Row */}
                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold text-gray-700">Sales</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-bold bg-blue-50 text-blue-700">
                    {activeCompetitors.length > 0 
                      ? activeCompetitors.reduce((sum, c) => sum + c.sales, 0).toLocaleString()
                      : '0'
                    }
                  </TableCell>
                  {activeCompetitors.map((comp) => (
                    <TableCell key={comp.asin} className="text-center font-semibold hover:bg-blue-50">
                      {comp.sales.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Revenue Row */}
                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold text-gray-700">Revenue</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="p-2">
                    <Input
                      type="number"
                      placeholder="Min. €"
                      value={revenueFilter}
                      onChange={(e) => setRevenueFilter(e.target.value)}
                      className="h-8 text-sm w-full"
                      min="0"
                      step="1000"
                    />
                  </TableCell>
                  <TableCell className="font-bold bg-blue-50 text-blue-700">
                    €{data.marketSummary.totalRevenue.toLocaleString()}
                  </TableCell>
                  {activeCompetitors.map((comp) => (
                    <TableCell key={comp.asin} className="text-center font-semibold hover:bg-blue-50">
                      {comp.revenue}
                    </TableCell>
                  ))}
                </TableRow>

                {/* AOV Row */}
                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold text-gray-700">AOV (€)</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-bold bg-blue-50 text-blue-700">
                    €{activeCompetitors.length > 0 
                      ? (activeCompetitors.reduce((sum, c) => {
                          const revenue = parseEuropeanNumber(c.revenue)
                          return sum + revenue
                        }, 0) / activeCompetitors.reduce((sum, c) => sum + c.sales, 0)).toFixed(2)
                      : '0'
                    }
                  </TableCell>
                  {activeCompetitors.map((comp) => {
                    const revenue = parseEuropeanNumber(comp.revenue)
                    const aov = comp.sales > 0 ? (revenue / comp.sales) : 0
                    const isAnomalous = aov > 1000 || aov < 5 // Flag AOV anomali
                    
                    return (
                      <TableCell 
                        key={comp.asin} 
                        className={`text-center font-semibold hover:bg-blue-50 ${
                          isAnomalous ? 'bg-red-50 text-red-700' : ''
                        }`}
                        title={isAnomalous ? `AOV anomalo: ${aov.toFixed(2)}€ (Sales: ${comp.sales}, Revenue: €${revenue.toLocaleString()})` : ''}
                      >
                        €{aov.toFixed(2)}
                        {isAnomalous && <span className="ml-1 text-red-500">⚠</span>}
                      </TableCell>
                    )
                  })}
                </TableRow>

                {/* ASIN Row */}
                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold text-gray-700">ASIN</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-bold bg-blue-50 text-blue-700">
                    {activeCompetitors.length}
                  </TableCell>
                  {activeCompetitors.map((comp) => (
                    <TableCell key={comp.asin} className="text-center font-mono text-xs">{comp.asin}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              {/* TBODY - Master Keyword List */}
              <TableBody>
                {/* Keywords Header with Sorting */}
                <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                  <TableCell className="sticky left-0 bg-gray-100 border-r-2 border-slate-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={isUpdating}
                      />
                      <button
                        onClick={() => handleSort('keywordPhrase')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        <span>Keyword Phrase</span>
                        {getSortIcon('keywordPhrase')}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    <button
                      onClick={() => handleSort('searchVolume')}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                    >
                      <span>SV Totale</span>
                      {getSortIcon('searchVolume')}
                    </button>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    <button
                      onClick={() => handleSort('isBrand')}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                    >
                      <span>Is_Brand</span>
                      {getSortIcon('isBrand')}
                    </button>
                  </TableCell>
                  <TableCell className="text-center font-semibold">Brand_Word</TableCell>
                  <TableCell className="text-center font-semibold min-w-[150px]">
                    <button
                      onClick={() => handleSort('relevance')}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                    >
                      <span>Rilevanza</span>
                      {getSortIcon('relevance')}
                    </button>
                  </TableCell>
                  {activeCompetitors.map((_, index) => (
                    <TableCell key={index} className="text-center font-semibold text-xs">Ranking</TableCell>
                  ))}
                </TableRow>

                {/* Filtri Row */}
                <TableRow className="bg-blue-50 border-b-2 border-blue-200">
                  <TableCell className="sticky left-0 bg-blue-50 border-r-2 border-slate-300">
                    <div className="text-xs font-medium text-blue-700">Filtri</div>
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      type="number"
                      placeholder="SV >"
                      value={svFilter}
                      onChange={(e) => setSvFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="text-xs">-</div>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="text-xs">-</div>
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      type="number"
                      placeholder="Rile >"
                      value={relevanceFilter}
                      onChange={(e) => setRelevanceFilter(e.target.value)}
                      className="h-7 text-xs"
                      step="0.1"
                    />
                  </TableCell>
                  {activeCompetitors.map((_, index) => (
                    <TableCell key={index} className="p-2">
                      <div className="text-xs">-</div>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Keyword Rows */}
                {filteredKeywords.map((keyword, index) => (
                  <TableRow 
                    key={keyword.keywordPhrase}
                    className={`hover:bg-blue-50 ${
                      keyword.isDeleted ? 'opacity-50 bg-red-50' : ''
                    } ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <TableCell className="sticky left-0 bg-inherit border-r-2 border-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={selectedKeywords.has(keyword.keywordPhrase)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedKeywords)
                            if (checked) {
                              newSelected.add(keyword.keywordPhrase)
                            } else {
                              newSelected.delete(keyword.keywordPhrase)
                            }
                            setSelectedKeywords(newSelected)
                          }}
                          disabled={isUpdating}
                        />
                        <span className={keyword.isDeleted ? 'line-through' : ''}>
                          {keyword.keywordPhrase}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center hover:bg-blue-100">
                      {keyword.searchVolume.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {keyword.isBrand ? 
                        <span className="text-green-500 font-bold text-lg">✔</span> : 
                        <span className="text-red-500 font-bold text-lg">✘</span>
                      }
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {editingBrandWord === keyword.keywordPhrase ? (
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleBrandWordSave()
                              if (e.key === 'Escape') handleBrandWordCancel()
                            }}
                            className="w-16 h-6 text-xs text-center"
                            placeholder="Brand"
                            autoFocus
                          />
                          <button
                            onClick={handleBrandWordSave}
                            className="text-green-600 hover:text-green-800 text-xs p-1"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleBrandWordCancel}
                            className="text-red-600 hover:text-red-800 text-xs p-1"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <span
                          onDoubleClick={() => handleBrandWordDoubleClick(keyword.keywordPhrase, keyword.brandWord)}
                          className="cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded inline-block"
                          title="Doppio click per modificare"
                        >
                          {keyword.brandWord || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={keyword.relevance} className="w-20" />
                        <span className="font-semibold text-xs">
                          {keyword.relevance}%
                        </span>
                      </div>
                    </TableCell>
                    {activeCompetitors.map((comp) => (
                      <TableCell key={comp.asin} className="text-center text-sm hover:bg-blue-100">
                        {keyword.rankings[comp.asin] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}