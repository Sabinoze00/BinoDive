'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, ArrowUpDown } from 'lucide-react'

export type SortField = 'keywordPhrase' | 'searchVolume' | 'relevance' | 'isBrand'
export type SortDirection = 'asc' | 'desc'

interface KeywordFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  sortField: SortField
  sortDirection: SortDirection
  onSortChange: (field: SortField, direction: SortDirection) => void
  showBrandOnly: boolean
  onBrandFilterChange: (showBrandOnly: boolean) => void
  showDeleted: boolean
  onDeletedFilterChange: (showDeleted: boolean) => void
  totalKeywords: number
  filteredKeywords: number
}

export const KeywordFilters: React.FC<KeywordFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  showBrandOnly,
  onBrandFilterChange,
  showDeleted,
  onDeletedFilterChange,
  totalKeywords,
  filteredKeywords
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(localSearch)
  }

  const clearSearch = () => {
    setLocalSearch('')
    onSearchChange('')
  }

  const handleSortFieldChange = (field: SortField) => {
    if (field === sortField) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(field, 'asc')
    }
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtri e Ricerca Keyword
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cerca keyword (es. 'cani', 'integratori'...)"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <Button type="submit" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Ordina per:</span>
            <Select value={sortField} onValueChange={(value: SortField) => handleSortFieldChange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keywordPhrase">Keyword</SelectItem>
                <SelectItem value="searchVolume">Search Volume</SelectItem>
                <SelectItem value="relevance">Rilevanza</SelectItem>
                <SelectItem value="isBrand">Brand/Non-Brand</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-2">
            <Button
              variant={showBrandOnly ? "default" : "outline"}
              size="sm"
              onClick={() => onBrandFilterChange(!showBrandOnly)}
            >
              {showBrandOnly ? 'Mostra Tutte' : 'Solo Brand'}
            </Button>
          </div>

          {/* Deleted Filter */}
          <div className="flex items-center gap-2">
            <Button
              variant={showDeleted ? "secondary" : "outline"}
              size="sm"
              onClick={() => onDeletedFilterChange(!showDeleted)}
            >
              {showDeleted ? 'Nascondi Eliminate' : 'Mostra Eliminate'}
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
          <Badge variant="outline">
            {filteredKeywords} di {totalKeywords} keyword
          </Badge>
          {searchTerm && (
            <Badge variant="secondary">
              Filtro: &quot;{searchTerm}&quot;
            </Badge>
          )}
          {showBrandOnly && (
            <Badge variant="default">
              Solo Brand Keywords
            </Badge>
          )}
          {showDeleted && (
            <Badge variant="destructive">
              Include Eliminate
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}