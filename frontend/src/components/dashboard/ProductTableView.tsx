'use client'

import React, { useState, useMemo } from 'react'
import { ProcessedProduct, ProcessedKeyword } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Trash2, RotateCcw } from 'lucide-react'

interface ProductTableViewProps {
  products: ProcessedProduct[]
  keywords: ProcessedKeyword[]
  onProductUpdate: (deleted: string[], restored: string[]) => Promise<void>
  isUpdating: boolean
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  keywords,
  onProductUpdate,
  isUpdating
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  const { activeProducts, deletedProducts } = useMemo(() => {
    const active = products.filter(p => !p.isDeleted)
    const deleted = products.filter(p => p.isDeleted)
    return { activeProducts: active, deletedProducts: deleted }
  }, [products])

  // Helper function to find and highlight keywords in text
  const findMatchingKeywords = (text: string, productAsin: string): { 
    highlightedText: string, 
    matchedKeywords: { keyword: string, ranking: number, searchVolume: number }[] 
  } => {
    if (!text) return { highlightedText: '', matchedKeywords: [] }
    
    const activeKeywords = keywords.filter(kw => 
      !kw.isDeleted && 
      kw.rankings[productAsin] && 
      kw.rankings[productAsin] > 0
    ).sort((a, b) => b.keywordPhrase.length - a.keywordPhrase.length)

    let highlightedText = text
    const matchedKeywords: { keyword: string, ranking: number, searchVolume: number }[] = []

    activeKeywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw.keywordPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi')
      if (regex.test(text)) {
        matchedKeywords.push({
          keyword: kw.keywordPhrase,
          ranking: kw.rankings[productAsin],
          searchVolume: kw.searchVolume
        })
        
        highlightedText = highlightedText.replace(regex, `<mark class="bg-yellow-200 px-1 rounded text-xs">$1</mark>`)
      }
    })

    return { highlightedText, matchedKeywords }
  }

  // Get features from Keepa data
  const getProductFeatures = (product: ProcessedProduct): string[] => {
    const features = [
      product.feature1,
      product.feature2,
      product.feature3,
      product.feature4,
      product.feature5
    ].filter(feature => feature && feature.trim().length > 0)
    
    return features
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

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'Molto Forte': return 'bg-red-500'
      case 'Forte': return 'bg-yellow-500'
      case 'Medio': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                id="select-all-table"
                checked={selectedProducts.size === activeProducts.length && activeProducts.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={isUpdating || activeProducts.length === 0}
              />
              <label htmlFor="select-all-table" className="text-sm font-medium">
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
          <CardTitle>Prodotti Attivi - Vista Tabellare ({activeProducts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nessun prodotto attivo</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left w-12"></th>
                    <th className="px-3 py-3 text-left w-20">Img</th>
                    <th className="px-3 py-3 text-left w-32">ASIN</th>
                    <th className="px-3 py-3 text-left w-32">Brand</th>
                    <th className="px-3 py-3 text-left min-w-64">Titolo</th>
                    <th className="px-3 py-3 text-left min-w-64">Funzionalità 1</th>
                    <th className="px-3 py-3 text-left min-w-64">Funzionalità 2</th>
                    <th className="px-3 py-3 text-left min-w-64">Funzionalità 3</th>
                    <th className="px-3 py-3 text-left min-w-64">Funzionalità 4</th>
                    <th className="px-3 py-3 text-left min-w-64">Funzionalità 5</th>
                    <th className="px-3 py-3 text-left w-32">Forza</th>
                    <th className="px-3 py-3 text-left w-24">KW</th>
                    <th className="px-3 py-3 text-left w-24">Variazioni</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProducts.map((product, index) => {
                    const features = getProductFeatures(product)
                    const titleHighlight = findMatchingKeywords(product.title, product.asin)
                    
                    return (
                      <tr 
                        key={product.asin} 
                        className={`border-b hover:bg-gray-50 ${
                          selectedProducts.has(product.asin) ? 'bg-blue-50' : ''
                        } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selectedProducts.has(product.asin)}
                            onCheckedChange={(checked) => handleProductSelection(product.asin, !!checked)}
                            disabled={isUpdating}
                          />
                        </td>

                        {/* Image */}
                        <td className="px-3 py-3">
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-16 h-16 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.png'
                            }}
                          />
                        </td>

                        {/* ASIN */}
                        <td className="px-3 py-3">
                          <div className="space-y-2">
                            <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {product.asin}
                            </div>
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
                        </td>

                        {/* Brand */}
                        <td className="px-3 py-3">
                          <div className="font-medium truncate" title={product.brand}>
                            {product.brand}
                          </div>
                        </td>

                        {/* Title */}
                        <td className="px-3 py-3">
                          <div 
                            className="text-sm leading-tight"
                            dangerouslySetInnerHTML={{ __html: titleHighlight.highlightedText }}
                          />
                          {titleHighlight.matchedKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {titleHighlight.matchedKeywords.slice(0, 3).map((match, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {match.keyword} #{match.ranking}
                                </Badge>
                              ))}
                              {titleHighlight.matchedKeywords.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{titleHighlight.matchedKeywords.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Feature 1 */}
                        <td className="px-3 py-3">
                          {features[0] && (
                            <div>
                              <div 
                                className="text-xs text-gray-700 leading-tight"
                                dangerouslySetInnerHTML={{ 
                                  __html: findMatchingKeywords(features[0], product.asin).highlightedText 
                                }}
                              />
                              {findMatchingKeywords(features[0], product.asin).matchedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {findMatchingKeywords(features[0], product.asin).matchedKeywords.slice(0, 2).map((match, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {match.keyword} #{match.ranking}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Feature 2 */}
                        <td className="px-3 py-3">
                          {features[1] && (
                            <div>
                              <div 
                                className="text-xs text-gray-700 leading-tight"
                                dangerouslySetInnerHTML={{ 
                                  __html: findMatchingKeywords(features[1], product.asin).highlightedText 
                                }}
                              />
                              {findMatchingKeywords(features[1], product.asin).matchedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {findMatchingKeywords(features[1], product.asin).matchedKeywords.slice(0, 2).map((match, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {match.keyword} #{match.ranking}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Feature 3 */}
                        <td className="px-3 py-3">
                          {features[2] && (
                            <div>
                              <div 
                                className="text-xs text-gray-700 leading-tight"
                                dangerouslySetInnerHTML={{ 
                                  __html: findMatchingKeywords(features[2], product.asin).highlightedText 
                                }}
                              />
                              {findMatchingKeywords(features[2], product.asin).matchedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {findMatchingKeywords(features[2], product.asin).matchedKeywords.slice(0, 2).map((match, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {match.keyword} #{match.ranking}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Feature 4 */}
                        <td className="px-3 py-3">
                          {features[3] && (
                            <div>
                              <div 
                                className="text-xs text-gray-700 leading-tight"
                                dangerouslySetInnerHTML={{ 
                                  __html: findMatchingKeywords(features[3], product.asin).highlightedText 
                                }}
                              />
                              {findMatchingKeywords(features[3], product.asin).matchedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {findMatchingKeywords(features[3], product.asin).matchedKeywords.slice(0, 2).map((match, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {match.keyword} #{match.ranking}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Feature 5 */}
                        <td className="px-3 py-3">
                          {features[4] && (
                            <div>
                              <div 
                                className="text-xs text-gray-700 leading-tight"
                                dangerouslySetInnerHTML={{ 
                                  __html: findMatchingKeywords(features[4], product.asin).highlightedText 
                                }}
                              />
                              {findMatchingKeywords(features[4], product.asin).matchedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {findMatchingKeywords(features[4], product.asin).matchedKeywords.slice(0, 2).map((match, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {match.keyword} #{match.ranking}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Strength */}
                        <td className="px-3 py-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getStrengthColor(product.strengthLevel)}`}></div>
                            <div className="text-xs">
                              <div className="font-medium">{product.strengthLevel}</div>
                              <div className="text-gray-500">{product.strengthPercentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        </td>

                        {/* Keywords Count */}
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="text-xs">
                            {product.keywordCount}
                          </Badge>
                        </td>

                        {/* Variations */}
                        <td className="px-3 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {product.variationAsins.length}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-12 h-12 object-contain rounded grayscale"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.png'
                        }}
                      />
                      <div>
                        <div className="font-medium line-through">{product.title}</div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">ASIN:</span> {product.asin} |{' '}
                          <span className="font-medium">Brand:</span> {product.brand}
                        </div>
                      </div>
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}