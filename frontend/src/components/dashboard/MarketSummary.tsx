'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Building2, Target, Trash2 } from 'lucide-react'
import type { MarketSummary } from '@/types/analysis'

interface MarketSummaryProps {
  data: MarketSummary
}

export const MarketSummaryCard: React.FC<MarketSummaryProps> = ({ data }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Riepilogo del Mercato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200 hover:bg-gray-100">
            <Target className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-600 mb-1">SV TOTALE MERCATO</p>
            <p className="text-lg font-bold text-gray-800">
              {(data.totalMarketSV || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200 hover:bg-gray-100">
            <Target className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-600 mb-1">SV BRAND</p>
            <p className="text-lg font-bold text-gray-800">
              {(data.brandSV || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200 hover:bg-gray-100">
            <Building2 className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-600 mb-1">N. BRAND UNICI</p>
            <p className="text-lg font-bold text-gray-800">
              {data.uniqueBrands}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200 hover:bg-gray-100">
            <BarChart3 className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-600 mb-1">TOTAL KEYWORDS</p>
            <p className="text-lg font-bold text-gray-800">
              {data.totalKeywords}
            </p>
          </div>
          
          {data.deletedKeywords > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200 hover:bg-gray-100">
              <Trash2 className="w-4 h-4 text-gray-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-600 mb-1">KEYWORDS ELIMINATE</p>
              <p className="text-lg font-bold text-gray-800">
                {data.deletedKeywords}
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200 hover:bg-gray-100">
            <Building2 className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-600 mb-1">REVENUE TOTALE</p>
            <p className="text-lg font-bold text-gray-800">
              €{(data.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        {data.deletedKeywords > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Il SV Totale Mercato è calcolato solo sulle keyword attive (non eliminate). 
              Sono state eliminate {data.deletedKeywords} keyword dall&apos;analisi.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}