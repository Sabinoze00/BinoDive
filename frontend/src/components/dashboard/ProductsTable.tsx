'use client'

import React, { useState, useMemo } from 'react'
import { ProcessedProduct } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Trash2, RotateCcw } from 'lucide-react'

interface ProductsTableProps {
  products: ProcessedProduct[]
  onProductUpdate: (deleted: string[], restored: string[]) => Promise<void>
  isUpdating: boolean
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onProductUpdate,
  isUpdating
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  const { activeProducts, deletedProducts } = useMemo(() => {
    const active = products.filter(p => !p.isDeleted)
    const deleted = products.filter(p => p.isDeleted)
    return { activeProducts: active, deletedProducts: deleted }
  }, [products])

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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
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

      {/* Active Products */}
      <Card>
        <CardHeader>
          <CardTitle>Prodotti Attivi ({activeProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nessun prodotto attivo</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeProducts.map((product) => (
                <div
                  key={product.asin}
                  className={`border rounded-lg p-4 space-y-3 transition-all ${
                    selectedProducts.has(product.asin) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedProducts.has(product.asin)}
                      onCheckedChange={(checked) => handleProductSelection(product.asin, !!checked)}
                      disabled={isUpdating}
                    />
                    <span className="text-xs text-gray-500">ASIN: {product.asin}</span>
                  </div>

                  {/* Product Image */}
                  <div className="flex justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-24 h-24 object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      {truncateText(product.title, 60)}
                    </h4>
                    <p className="text-xs text-gray-600">
                      <strong>Brand:</strong> {product.brand}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      ASIN: {product.asin}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 px-2 text-xs"
                        onClick={() => window.open(`https://keepa.com/#!product/8-${product.asin}`, '_blank')}
                      >
                        Keepa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 px-2 text-xs"
                        onClick={() => window.open(`https://www.amazon.it/dp/${product.asin}`, '_blank')}
                      >
                        Amazon
                      </Button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Forza:</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStrengthColor(product.strengthLevel)}`}></div>
                        <Badge variant="outline" className="text-xs">
                          {product.strengthLevel} ({product.strengthPercentage.toFixed(1)}%)
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs">Keywords:</span>
                      <Badge variant="secondary" className="text-xs">
                        {product.keywordCount} KW
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs">Variazioni:</span>
                      <span className="text-xs">{product.variationAsins.length}</span>
                    </div>
                  </div>

                  {/* Top Keywords */}
                  {product.matchingKeywords.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium">Top Keywords:</span>
                      <div className="flex flex-wrap gap-1">
                        {product.matchingKeywords.slice(0, 3).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {truncateText(keyword, 20)}
                          </Badge>
                        ))}
                        {product.matchingKeywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.matchingKeywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {deletedProducts.map((product) => (
                <div
                  key={product.asin}
                  className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50 opacity-75"
                >
                  {/* Restore Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ASIN: {product.asin}</span>
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

                  {/* Product Image */}
                  <div className="flex justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-24 h-24 object-contain rounded grayscale"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm line-through">
                      {truncateText(product.title, 60)}
                    </h4>
                    <p className="text-xs text-gray-600">
                      <strong>Brand:</strong> {product.brand}
                    </p>
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