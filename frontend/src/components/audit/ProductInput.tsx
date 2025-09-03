'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Package } from 'lucide-react'
import type { UserProduct } from '../../../../../shared/types/audit'

interface ProductInputProps {
  onProductSave: (product: UserProduct) => void
  initialProduct?: UserProduct
}

export const ProductInput: React.FC<ProductInputProps> = ({ 
  onProductSave, 
  initialProduct 
}) => {
  const [product, setProduct] = useState<UserProduct>(initialProduct || {
    name: '',
    brand: '',
    asin: '',
    price: 0,
    category: '',
    features: [],
    targetKeywords: [],
    uniqueSellingPoints: [],
  })
  
  const [newFeature, setNewFeature] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [newUSP, setNewUSP] = useState('')

  const handleAddItem = (type: 'features' | 'targetKeywords' | 'uniqueSellingPoints', value: string, setter: (value: string) => void) => {
    if (!value.trim()) return
    
    setProduct(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }))
    setter('')
  }

  const handleRemoveItem = (type: 'features' | 'targetKeywords' | 'uniqueSellingPoints', index: number) => {
    setProduct(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    if (!product.name || !product.brand || product.price <= 0) {
      alert('Compila almeno nome, brand e prezzo')
      return
    }
    onProductSave(product)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Il Tuo Prodotto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nome Prodotto *
            </label>
            <Input
              value={product.name}
              onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Es: Probiotici Premium per Cani"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Brand *
            </label>
            <Input
              value={product.brand}
              onChange={(e) => setProduct(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="Es: IntegroPet"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              ASIN (opzionale)
            </label>
            <Input
              value={product.asin || ''}
              onChange={(e) => setProduct(prev => ({ ...prev, asin: e.target.value }))}
              placeholder="B0XXXXXXXX"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Prezzo (€) *
            </label>
            <Input
              type="number"
              value={product.price}
              onChange={(e) => setProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              placeholder="34.99"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Categoria
          </label>
          <Input
            value={product.category}
            onChange={(e) => setProduct(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Es: Integratori per Animali"
          />
        </div>

        {/* Features */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Caratteristiche Principali
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Aggiungi caratteristica..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem('features', newFeature, setNewFeature)}
            />
            <Button
              onClick={() => handleAddItem('features', newFeature, setNewFeature)}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {feature}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleRemoveItem('features', index)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Target Keywords */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Keyword Target
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Aggiungi keyword..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem('targetKeywords', newKeyword, setNewKeyword)}
            />
            <Button
              onClick={() => handleAddItem('targetKeywords', newKeyword, setNewKeyword)}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.targetKeywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {keyword}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleRemoveItem('targetKeywords', index)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Unique Selling Points */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Punti di Forza Unici
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newUSP}
              onChange={(e) => setNewUSP(e.target.value)}
              placeholder="Aggiungi punto di forza..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem('uniqueSellingPoints', newUSP, setNewUSP)}
            />
            <Button
              onClick={() => handleAddItem('uniqueSellingPoints', newUSP, setNewUSP)}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.uniqueSellingPoints.map((usp, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                {usp}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleRemoveItem('uniqueSellingPoints', index)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Performance Data (Optional) */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Performance Attuale (Opzionale)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Fatturato Mensile (€)
              </label>
              <Input
                type="number"
                value={product.currentPerformance?.monthlyRevenue || ''}
                onChange={(e) => setProduct(prev => ({ 
                  ...prev, 
                  currentPerformance: {
                    ...prev.currentPerformance,
                    monthlyRevenue: parseFloat(e.target.value) || undefined
                  }
                }))}
                placeholder="5000"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Vendite Mensili
              </label>
              <Input
                type="number"
                value={product.currentPerformance?.monthlySales || ''}
                onChange={(e) => setProduct(prev => ({ 
                  ...prev, 
                  currentPerformance: {
                    ...prev.currentPerformance,
                    monthlySales: parseInt(e.target.value) || undefined
                  }
                }))}
                placeholder="150"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Conversion Rate (%)
              </label>
              <Input
                type="number"
                value={product.currentPerformance?.conversionRate || ''}
                onChange={(e) => setProduct(prev => ({ 
                  ...prev, 
                  currentPerformance: {
                    ...prev.currentPerformance,
                    conversionRate: parseFloat(e.target.value) || undefined
                  }
                }))}
                placeholder="3.5"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Salva Prodotto
        </Button>
      </CardContent>
    </Card>
  )
}