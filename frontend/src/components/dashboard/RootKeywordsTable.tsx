'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Trash2, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import type { RootKeyword } from '@/types/analysis'

type SortField = 'rootWord' | 'totalSV' | 'averageRelevance' | 'totalCount'
type SortDirection = 'asc' | 'desc'

interface RootKeywordsTableProps {
  rootKeywords: RootKeyword[]
  onRootKeywordUpdate: (deleted: string[], restored: string[]) => void
  isUpdating?: boolean
}

export const RootKeywordsTable: React.FC<RootKeywordsTableProps> = ({ 
  rootKeywords, 
  onRootKeywordUpdate, 
  isUpdating = false 
}) => {
  const [selectedRootKeywords, setSelectedRootKeywords] = useState<Set<string>>(new Set())
  const [showDeleted, setShowDeleted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('totalSV')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredRootKeywords = useMemo(() => {
    let filtered = rootKeywords.filter(rk => {
      if (!showDeleted && rk.isDeleted) return false
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!rk.rootWord.toLowerCase().includes(searchLower)) return false
      }
      return true
    })

    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortField) {
        case 'rootWord':
          aValue = a.rootWord
          bValue = b.rootWord
          break
        case 'totalSV':
          aValue = a.totalSV
          bValue = b.totalSV
          break
        case 'averageRelevance':
          aValue = a.averageRelevance
          bValue = b.averageRelevance
          break
        case 'totalCount':
          aValue = a.totalCount
          bValue = b.totalCount
          break
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [rootKeywords, showDeleted, searchTerm, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="w-4 h-4 opacity-50" />
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  const handleBulkDelete = async () => {
    const rootWordsToDelete = Array.from(selectedRootKeywords)
    await onRootKeywordUpdate(rootWordsToDelete, [])
    setSelectedRootKeywords(new Set())
  }

  const handleBulkRestore = async () => {
    const rootWordsToRestore = Array.from(selectedRootKeywords)
    await onRootKeywordUpdate([], rootWordsToRestore)
    setSelectedRootKeywords(new Set())
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRootKeywords(new Set(filteredRootKeywords.map(rk => rk.rootWord)))
    } else {
      setSelectedRootKeywords(new Set())
    }
  }

  const selectedCount = selectedRootKeywords.size
  const allSelected = selectedCount === filteredRootKeywords.length && filteredRootKeywords.length > 0
  const hasDeleted = selectedRootKeywords.size > 0 && Array.from(selectedRootKeywords).some(rw => 
    rootKeywords.find(r => r.rootWord === rw)?.isDeleted
  )
  const hasActive = selectedRootKeywords.size > 0 && Array.from(selectedRootKeywords).some(rw => 
    !rootKeywords.find(r => r.rootWord === rw)?.isDeleted
  )

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Cerca root keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Bulk Actions */}
            {hasActive && (
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Elimina ({selectedCount})
                </Button>
              </div>
            )}

            {hasDeleted && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkRestore}
                  disabled={isUpdating}
                  className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                >
                  <RotateCcw className="w-4 h-4" />
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
              {filteredRootKeywords.length} di {rootKeywords.filter(rk => !rk.isDeleted).length} root keywords
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Root Keywords Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Root Keywords</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[70vh]">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={isUpdating}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort('rootWord')}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <span>Root Word</span>
                      {getSortIcon('rootWord')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    <button
                      onClick={() => handleSort('totalSV')}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                    >
                      <span>SV Totale</span>
                      {getSortIcon('totalSV')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    <button
                      onClick={() => handleSort('averageRelevance')}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                    >
                      <span>Rilevanza Media</span>
                      {getSortIcon('averageRelevance')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    <button
                      onClick={() => handleSort('totalCount')}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                    >
                      <span>Totale KW</span>
                      {getSortIcon('totalCount')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center font-semibold">Brand KW</TableHead>
                  <TableHead className="text-center font-semibold">Non-Brand KW</TableHead>
                  <TableHead className="text-center font-semibold">% Brand</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRootKeywords.map((rootKeyword, index) => (
                  <TableRow 
                    key={rootKeyword.rootWord}
                    className={`hover:bg-blue-50 ${
                      rootKeyword.isDeleted ? 'opacity-50 bg-red-50' : ''
                    } ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedRootKeywords.has(rootKeyword.rootWord)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedRootKeywords)
                          if (checked) {
                            newSelected.add(rootKeyword.rootWord)
                          } else {
                            newSelected.delete(rootKeyword.rootWord)
                          }
                          setSelectedRootKeywords(newSelected)
                        }}
                        disabled={isUpdating}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={rootKeyword.isDeleted ? 'line-through text-gray-400' : ''}>
                        {rootKeyword.rootWord}
                      </span>
                    </TableCell>
                    <TableCell className="text-center hover:bg-blue-100">
                      {rootKeyword.totalSV.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {rootKeyword.averageRelevance}%
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {rootKeyword.totalCount}
                    </TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">
                      {rootKeyword.brandCount}
                    </TableCell>
                    <TableCell className="text-center text-blue-600 font-semibold">
                      {rootKeyword.nonBrandCount}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        rootKeyword.brandPercentage > 50 
                          ? 'bg-green-100 text-green-800' 
                          : rootKeyword.brandPercentage > 25
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rootKeyword.brandPercentage}%
                      </span>
                    </TableCell>
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