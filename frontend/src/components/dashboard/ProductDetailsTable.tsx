'use client'

import React, { useState, useMemo } from 'react'
import { ProcessedProduct, ProcessedKeyword } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Trash2, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'

interface ProductDetailsTableProps {
  products: ProcessedProduct[]
  keywords: ProcessedKeyword[]
  onProductUpdate: (deleted: string[], restored: string[]) => Promise<void>
  isUpdating: boolean
}

export const ProductDetailsTable: React.FC<ProductDetailsTableProps> = ({
  products,
  keywords,
  onProductUpdate,
  isUpdating
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  const { activeProducts, deletedProducts } = useMemo(() => {
    const active = products.filter(p => !p.isDeleted)
    const deleted = products.filter(p => p.isDeleted)
    return { activeProducts: active, deletedProducts: deleted }
  }, [products])

  // Helper function to highlight keywords in text
  const highlightKeywords = (text: string, productAsin: string, keywords: ProcessedKeyword[]): React.ReactElement => {
    if (!text) return <span>{text}</span>
    
    const relevantKeywords = keywords.filter(kw => 
      !kw.isDeleted && 
      kw.rankings[productAsin] && 
      kw.rankings[productAsin] > 0
    ).sort((a, b) => b.keywordPhrase.length - a.keywordPhrase.length) // Sort by length desc to match longer phrases first

    let highlightedText = text
    const keywordMatches: { keyword: string, ranking: number, searchVolume: number }[] = []

    relevantKeywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw.keywordPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi')
      if (regex.test(text)) {
        keywordMatches.push({
          keyword: kw.keywordPhrase,
          ranking: kw.rankings[productAsin],
          searchVolume: kw.searchVolume
        })
        
        highlightedText = highlightedText.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`)
      }
    })

    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
        {keywordMatches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {keywordMatches.map((match, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {match.keyword} #{match.ranking} ({(match.searchVolume || 0).toLocaleString()} SV)
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleProductSelection = (asin: string, checked: boolean) => {
    const newSelection = new Set(selectedProducts)
    if (checked) {
      newSelection.add(asin)
    } else {
      newSelection.delete(asin)
    }
    setSelectedProducts(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(activeProducts.map(p => p.asin)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) return
    
    await onProductUpdate(Array.from(selectedProducts), [])
    setSelectedProducts(new Set())
  }

  const handleRestoreProduct = async (asin: string) => {
    await onProductUpdate([], [asin])
  }

  const toggleProductExpansion = (asin: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(asin)) {
      newExpanded.delete(asin)
    } else {
      newExpanded.add(asin)
    }
    setExpandedProducts(newExpanded)
  }

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'Molto Forte': return 'bg-red-500'
      case 'Forte': return 'bg-yellow-500'
      case 'Medio': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const extractBulletPoints = (description: string): string[] => {
    if (!description) return []
    
    // Try to extract bullet points from various formats
    const bulletPatterns = [
      /•\s*(.*?)(?=•|\n|$)/g,  // • bullet points
      /-\s*(.*?)(?=-|\n|$)/g,  // - bullet points  
      /\*\s*(.*?)(?=\*|\n|$)/g, // * bullet points
      /\d+\.\s*(.*?)(?=\d+\.|\n|$)/g, // 1. numbered points
    ]
    
    for (const pattern of bulletPatterns) {
      const matches = [...description.matchAll(pattern)]
      if (matches.length > 0) {
        return matches.map(match => match[1].trim()).filter(point => point.length > 10)
      }
    }
    
    // If no bullet points found, split by sentences
    return description.split(/[.!?]/).filter(sentence => sentence.trim().length > 20).slice(0, 5)
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                id="select-all"
                checked={selectedProducts.size === activeProducts.length && activeProducts.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={isUpdating || activeProducts.length === 0}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Seleziona tutti ({activeProducts.length} prodotti)
              </label>
            </div>
            
            {selectedProducts.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedProducts.size} selezionati
                </span>
                <Button
                  onClick={handleDeleteSelected}
                  disabled={isUpdating}
                  variant="destructive"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prodotti Attivi - Dettaglio ({activeProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nessun prodotto attivo</p>
          ) : (
            <div className="space-y-4">
              {activeProducts.map((product) => {
                const isExpanded = expandedProducts.has(product.asin)
                // Note: description field not available in current data structure
                const bulletPoints: string[] = []
                
                return (
                  <div
                    key={product.asin}
                    className={`border rounded-lg transition-all ${
                      selectedProducts.has(product.asin) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Product Header */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start space-x-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedProducts.has(product.asin)}
                          onCheckedChange={(checked) => handleProductSelection(product.asin, !!checked)}
                          disabled={isUpdating}
                          className="mt-1"
                        />

                        {/* Product Image */}
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-20 h-20 object-contain rounded flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-image.png'
                          }}
                        />

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {highlightKeywords(product.title, product.asin, keywords)}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProductExpansion(product.asin)}
                              className="p-1"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">ASIN:</span>
                              <p className="text-gray-600 mb-2">{product.asin}</p>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(`https://keepa.com/#!product/8-${product.asin}`, '_blank')}
                                >
                                  Keepa
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(`https://www.amazon.it/dp/${product.asin}`, '_blank')}
                                >
                                  Amazon
                                </Button>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Brand:</span>
                              <p className="text-gray-600">{product.brand}</p>
                            </div>
                            <div>
                              <span className="font-medium">Keywords:</span>
                              <p className="text-gray-600">{product.keywordCount} KW</p>
                            </div>
                            <div>
                              <span className="font-medium">Forza:</span>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${getStrengthColor(product.strengthLevel)}`}></div>
                                <Badge variant="outline" className="text-xs">
                                  {product.strengthLevel} ({product.strengthPercentage.toFixed(1)}%)
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t pt-4 space-y-4">
                          {/* Product description not available in current data structure */}
                          <div>
                            <h4 className="font-medium mb-2">Informazioni Prodotto:</h4>
                            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                              Descrizione non disponibile nei dati attuali
                            </div>
                          </div>

                          {/* Bullet Points */}
                          {bulletPoints.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Punti Salienti:</h4>
                              <ul className="space-y-2">
                                {bulletPoints.map((point, idx) => (
                                  <li key={idx} className="flex items-start space-x-2 text-sm">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <div className="flex-1">
                                      {highlightKeywords(point, product.asin, keywords)}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* All Keywords Table */}
                          {product.matchingKeywords.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Tutte le Keywords ({product.matchingKeywords.length}):</h4>
                              <div className="max-h-64 overflow-y-auto">
                                <table className="w-full text-xs border border-gray-200">
                                  <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Keyword</th>
                                      <th className="px-3 py-2 text-left">Posizione</th>
                                      <th className="px-3 py-2 text-left">Search Volume</th>
                                      <th className="px-3 py-2 text-left">Rilevanza</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {keywords.filter(kw => 
                                      !kw.isDeleted && 
                                      kw.rankings[product.asin] && 
                                      kw.rankings[product.asin] > 0
                                    ).map((kw, idx) => (
                                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium">{kw.keywordPhrase}</td>
                                        <td className="px-3 py-2">
                                          <Badge 
                                            variant={kw.rankings[product.asin] <= 10 ? "default" : "secondary"}
                                            className="text-xs"
                                          >
                                            #{kw.rankings[product.asin]}
                                          </Badge>
                                        </td>
                                        <td className="px-3 py-2">{(kw.searchVolume || 0).toLocaleString()}</td>
                                        <td className="px-3 py-2">{kw.relevance}%</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Variations */}
                          {product.variationAsins.length > 1 && (
                            <div>
                              <h4 className="font-medium mb-2">Variazioni ({product.variationAsins.length}):</h4>
                              <div className="flex flex-wrap gap-2">
                                {product.variationAsins.map((asin, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {asin}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deleted Products */}
      {deletedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Prodotti Eliminati ({deletedProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deletedProducts.map((product) => (
                <div
                  key={product.asin}
                  className="border border-red-200 rounded-lg p-4 bg-red-50 opacity-75"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-16 h-16 object-contain rounded grayscale flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg line-through mb-2">{product.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">ASIN:</span> {product.asin} |{' '}
                          <span className="font-medium">Brand:</span> {product.brand}
                        </div>
                        <Button
                          onClick={() => handleRestoreProduct(product.asin)}
                          disabled={isUpdating}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Ripristina</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}