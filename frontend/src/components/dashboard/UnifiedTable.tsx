'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { KeywordFilters, SortField, SortDirection } from './KeywordFilters'
import type { AnalysisData } from '@/types/analysis'

interface UnifiedTableProps {
  data: AnalysisData
  onKeywordUpdate: (deleted: string[], restored: string[]) => void
  isUpdating?: boolean
}

export const UnifiedTable: React.FC<UnifiedTableProps> = ({ 
  data, 
  onKeywordUpdate, 
  isUpdating = false 
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [showDeleted, setShowDeleted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('keywordPhrase')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showBrandOnly, setShowBrandOnly] = useState(false)

  const filteredKeywords = useMemo(() => {
    const filtered = data.keywordList.filter(kw => {
      // Filtra eliminate
      if (!showDeleted && kw.isDeleted) return false
      
      // Filtra per brand se richiesto
      if (showBrandOnly && !kw.isBrand) return false
      
      // Filtra per search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesKeyword = kw.keywordPhrase.toLowerCase().includes(searchLower)
        const matchesBrand = kw.brandWord?.toLowerCase().includes(searchLower) || false
        if (!matchesKeyword && !matchesBrand) return false
      }
      
      return true
    })

    // Ordinamento
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
  }, [data.keywordList, showDeleted, showBrandOnly, searchTerm, sortField, sortDirection])

  const getStrengthBadgeColor = (level: string) => {
    switch (level) {
      case 'Molto Forte': return 'bg-red-500'
      case 'Forte': return 'bg-yellow-500'  
      case 'Medio': return 'bg-blue-500'
      case 'Debole': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const handleBulkDelete = () => {
    const keywordsToDelete = Array.from(selectedKeywords)
    onKeywordUpdate(keywordsToDelete, [])
    setSelectedKeywords(new Set())
  }

  const handleBulkRestore = () => {
    const keywordsToRestore = Array.from(selectedKeywords)
    onKeywordUpdate([], keywordsToRestore)
    setSelectedKeywords(new Set())
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeywords(new Set(filteredKeywords.map(kw => kw.keywordPhrase)))
    } else {
      setSelectedKeywords(new Set())
    }
  }

  const handleKeywordSelect = (keywordPhrase: string, checked: boolean) => {
    const newSelected = new Set(selectedKeywords)
    if (checked) {
      newSelected.add(keywordPhrase)
    } else {
      newSelected.delete(keywordPhrase)
    }
    setSelectedKeywords(newSelected)
  }

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field)
    setSortDirection(direction)
  }

  const selectedCount = selectedKeywords.size
  const allSelected = selectedCount === filteredKeywords.length && filteredKeywords.length > 0

  return (
    <div className="w-full space-y-4">
      {/* Filtri */}
      <KeywordFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        showBrandOnly={showBrandOnly}
        onBrandFilterChange={setShowBrandOnly}
        showDeleted={showDeleted}
        onDeletedFilterChange={setShowDeleted}
        totalKeywords={data.keywordList.filter(kw => !kw.isDeleted).length}
        filteredKeywords={filteredKeywords.length}
      />

      <Card className="w-full">
        <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Analisi Completa</span>
          <div className="flex gap-2">
            {selectedCount > 0 && (
              <>
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
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Nascondi Eliminate
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Mostra Eliminate
                </>
              )}
            </Button>
          </div>
        </CardTitle>
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
                  Totale ({data.competitorAnalysis.length})
                </TableHead>
                {data.competitorAnalysis.map((competitor) => (
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
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-medium">{comp.brand}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">% Forza</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">
                  {data.competitorAnalysis.length > 0 
                    ? (data.competitorAnalysis.reduce((sum, c) => sum + c.strengthPercentage, 0) / data.competitorAnalysis.length).toFixed(1) + '%'
                    : '0%'
                  }
                </TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-semibold">
                    {comp.strengthPercentage.toFixed(2)}%
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Forza</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">
                  <div className="flex justify-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-red-500 text-white min-w-[24px] h-6 rounded-full">
                            {data.strengthSummary.moltoForte}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Molto Forte</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-yellow-500 text-white min-w-[24px] h-6 rounded-full">
                            {data.strengthSummary.forte}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Forte</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center">
                    <Badge className={`${getStrengthBadgeColor(comp.strengthLevel)} text-white text-xs`}>
                      {comp.strengthLevel}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Seller Country</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">-</TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center">{comp.sellerCountry}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">N.Variazioni</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">
                  {data.competitorAnalysis.length > 0 
                    ? Math.round(data.competitorAnalysis.reduce((sum, c) => sum + c.variations, 0) / data.competitorAnalysis.length)
                    : 0
                  }
                </TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-semibold">{comp.variations}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Rating</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">
                  {data.competitorAnalysis.length > 0 
                    ? (data.competitorAnalysis.reduce((sum, c) => sum + c.rating, 0) / data.competitorAnalysis.length).toFixed(1)
                    : '0.0'
                  }
                </TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-semibold">{comp.rating}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Listing Age (mesi)</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">
                  {data.competitorAnalysis.length > 0 
                    ? Math.round(data.competitorAnalysis.reduce((sum, c) => sum + c.listingAgeMonths, 0) / data.competitorAnalysis.length)
                    : 0
                  }
                </TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-semibold">{comp.listingAgeMonths}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Price</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">-</TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-semibold">{comp.price}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Sales</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">
                  {data.competitorAnalysis.length > 0 
                    ? data.competitorAnalysis.reduce((sum, c) => sum + c.sales, 0).toLocaleString()
                    : '0'
                  }
                </TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-semibold">{comp.sales.toLocaleString()}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Revenue</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">-</TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-semibold">{comp.revenue}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">Categoria</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">-</TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center">{comp.category}</TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-slate-50">
                <TableCell className="font-semibold text-gray-700">ASIN</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold bg-blue-50 text-blue-700">
                  {data.competitorAnalysis.length}
                </TableCell>
                {data.competitorAnalysis.map((comp) => (
                  <TableCell key={comp.asin} className="text-center font-mono text-xs">{comp.asin}</TableCell>
                ))}
              </TableRow>
            </TableHeader>

            {/* TBODY - Master Keyword List */}
            <TableBody>
              {/* Keywords Header */}
              <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                <TableCell className="sticky left-0 bg-gray-100 border-r-2 border-slate-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={isUpdating}
                    />
                    <span>Keyword Phrase</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-semibold">SV Totale</TableCell>
                <TableCell className="text-center font-semibold">Is_Brand</TableCell>
                <TableCell className="text-center font-semibold">Brand_Word</TableCell>
                <TableCell className="text-center font-semibold min-w-[150px]">Rilevanza</TableCell>
                {data.competitorAnalysis.map((_, index) => (
                  <TableCell key={index} className="text-center font-semibold text-xs">Ranking</TableCell>
                ))}
              </TableRow>

              {/* Keyword Rows */}
              {filteredKeywords.map((keyword, index) => (
                <TableRow 
                  key={keyword.keywordPhrase}
                  className={`hover:bg-gray-50 ${keyword.isDeleted ? 'opacity-50 bg-red-50' : 'bg-white'} ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <TableCell className="sticky left-0 bg-inherit border-r-2 border-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedKeywords.has(keyword.keywordPhrase)}
                        onCheckedChange={(checked) => handleKeywordSelect(keyword.keywordPhrase, !!checked)}
                        disabled={isUpdating}
                      />
                      <span className={keyword.isDeleted ? 'line-through' : ''}>
                        {keyword.keywordPhrase}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {keyword.searchVolume.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {keyword.isBrand ? 
                      <span className="text-green-500 font-bold text-lg">✔</span> : 
                      <span className="text-red-500 font-bold text-lg">✘</span>
                    }
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {keyword.brandWord || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={keyword.relevance} className="w-20" />
                      <span className="font-semibold text-xs">
                        {keyword.relevance}%
                      </span>
                    </div>
                  </TableCell>
                  {data.competitorAnalysis.map((comp) => (
                    <TableCell key={comp.asin} className="text-center text-sm">
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