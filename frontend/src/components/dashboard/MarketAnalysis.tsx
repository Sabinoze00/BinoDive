'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Building2, 
  DollarSign, 
  Flag,
  ChevronUp,
  ChevronDown,
  Search
} from 'lucide-react'
import type { AnalysisData } from '@/types/analysis'

interface MarketAnalysisProps {
  data: AnalysisData
}

interface ClusterData {
  label: string
  range: string
  count: number
  totalSales: number
  totalRevenue: number
  avgAOV: number
  avgImages: number
  salesPercentage: number
  revenuePercentage: number
  brands: string[]
}

export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ data }) => {
  const activeCompetitors = data.competitorAnalysis.filter(comp => !comp.isDeleted)
  
  // State for sorting and filtering
  const [brandSort, setBrandSort] = useState<{key: string, direction: 'asc' | 'desc'}>({key: 'revenue', direction: 'desc'})
  const [countrySort, setCountrySort] = useState<{key: string, direction: 'asc' | 'desc'}>({key: 'revenue', direction: 'desc'})
  const [brandFilter, setBrandFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  
  // Helper function for European number parsing
  const parseEuropeanNumber = (value: string): number => {
    if (!value || typeof value !== 'string') return 0
    
    const cleaned = value.trim()
    
    if (cleaned.includes(',')) {
      // Format: "24.779,36" -> "24779.36"
      const parts = cleaned.split(',')
      const integerPart = parts[0].replace(/\./g, '')
      const decimalPart = parts[1] || ''
      return parseFloat(integerPart + '.' + decimalPart) || 0
    } else {
      // Format: "1.487" (could be 1487 or 1.487)
      const parts = cleaned.split('.')
      if (parts.length === 2 && parts[1].length > 2) {
        // This is likely "1.487" = 1487
        return parseInt(cleaned.replace(/\./g, '')) || 0
      } else if (parts.length > 2) {
        // Multiple dots: "1.234.567" = 1234567
        return parseInt(cleaned.replace(/\./g, '')) || 0
      } else {
        // Simple number or decimal: "1.5" = 1.5
        return parseFloat(cleaned) || 0
      }
    }
  }
  
  // Helper function for better number formatting
  const formatNumber = (value: number): string => {
    if (value === 0) return '0'
    if (value < 1000) return value.toFixed(0)
    return value.toLocaleString('it-IT')
  }
  
  // Analisi Fulfillment
  const fulfillmentAnalysis = useMemo(() => {
    // Debug: Log competitor fulfillment data
    console.log('Fulfillment Classification Debug:', activeCompetitors.map(c => ({
      asin: c.asin,
      brand: c.brand,
      fulfillment: c.fulfillment,
      category: c.category,
      sellerCountry: c.sellerCountry
    })))
    
    // Classify based on Fulfillment column: FBA, MFN, AMZ
    const fbaCount = activeCompetitors.filter(c => 
      c.fulfillment === 'FBA'
    ).length
    
    const mfnCount = activeCompetitors.filter(c => 
      c.fulfillment === 'MFN'
    ).length
    
    const amzCount = activeCompetitors.filter(c => 
      c.fulfillment === 'AMZ'
    ).length
    
    // MFN = Merchant Fulfilled (equivalent to FBM)
    // const fbmCount = mfnCount // Unused variable
    const totalSales = activeCompetitors.reduce((sum, c) => sum + c.sales, 0)
    const totalRevenue = activeCompetitors.reduce((sum, c) => {
      return sum + parseEuropeanNumber(c.revenue)
    }, 0)
    
    // Calculate sales and revenue by fulfillment type
    // FBA + AMZ (Amazon handled) vs MFN (Merchant)
    const amazonFulfilledSales = activeCompetitors
      .filter(c => c.fulfillment === 'FBA' || c.fulfillment === 'AMZ')
      .reduce((sum, c) => sum + c.sales, 0)
    
    const amazonFulfilledRevenue = activeCompetitors
      .filter(c => c.fulfillment === 'FBA' || c.fulfillment === 'AMZ')
      .reduce((sum, c) => {
        return sum + parseEuropeanNumber(c.revenue)
      }, 0)
    
    const merchantSales = activeCompetitors
      .filter(c => c.fulfillment === 'MFN')
      .reduce((sum, c) => sum + c.sales, 0)
    
    const merchantRevenue = activeCompetitors
      .filter(c => c.fulfillment === 'MFN')
      .reduce((sum, c) => {
        return sum + parseEuropeanNumber(c.revenue)
      }, 0)

    return {
      fba: {
        count: fbaCount + amzCount, // Both FBA and AMZ are Amazon-fulfilled
        sales: amazonFulfilledSales,
        salesPercent: totalSales > 0 ? (amazonFulfilledSales / totalSales) * 100 : 0,
        revenue: amazonFulfilledRevenue,
        revenuePercent: totalRevenue > 0 ? (amazonFulfilledRevenue / totalRevenue) * 100 : 0,
        avgImages: 0 // Placeholder
      },
      fbm: {
        count: mfnCount,
        sales: merchantSales,
        salesPercent: totalSales > 0 ? (merchantSales / totalSales) * 100 : 0,
        revenue: merchantRevenue,
        revenuePercent: totalRevenue > 0 ? (merchantRevenue / totalRevenue) * 100 : 0,
        avgImages: 0 // Placeholder
      },
      // Additional breakdown for debugging
      debug: {
        fbaOnly: fbaCount,
        amzOnly: amzCount,
        mfnOnly: mfnCount,
        total: activeCompetitors.length
      }
    }
  }, [activeCompetitors])

  // Analisi per Brand - Enhanced with sorting and filtering
  const brandAnalysis = useMemo(() => {
    const brandMap = new Map<string, {
      asins: string[]
      sales: number
      revenue: number
      avgImages: number
    }>()

    activeCompetitors.forEach(comp => {
      if (!brandMap.has(comp.brand)) {
        brandMap.set(comp.brand, {
          asins: [],
          sales: 0,
          revenue: 0,
          avgImages: 0
        })
      }
      
      const brandData = brandMap.get(comp.brand)!
      brandData.asins.push(comp.asin)
      brandData.sales += comp.sales
      brandData.revenue += parseEuropeanNumber(comp.revenue)
    })

    const totalSales = activeCompetitors.reduce((sum, c) => sum + c.sales, 0)
    const totalRevenue = activeCompetitors.reduce((sum, c) => {
      return sum + parseEuropeanNumber(c.revenue)
    }, 0)

    let results = Array.from(brandMap.entries())
      .map(([brand, data]) => ({
        brand,
        asinCount: data.asins.length,
        sales: data.sales,
        salesPercent: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
        revenue: data.revenue,
        revenuePercent: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        avgRevenue: data.revenue / data.asins.length,
        avgImages: data.avgImages
      }))
    
    // Apply filter
    if (brandFilter) {
      results = results.filter(item => 
        item.brand.toLowerCase().includes(brandFilter.toLowerCase())
      )
    }
    
    // Apply sorting
    results.sort((a, b) => {
      const aVal = a[brandSort.key as keyof typeof a] as number
      const bVal = b[brandSort.key as keyof typeof b] as number
      return brandSort.direction === 'desc' ? bVal - aVal : aVal - bVal
    })
    
    return results.slice(0, 15) // Top 15 brands
  }, [activeCompetitors, brandSort, brandFilter])

  // Analisi per Nazione - Enhanced with sorting and filtering
  const countryAnalysis = useMemo(() => {
    const countryMap = new Map<string, {
      asins: string[]
      sales: number
      revenue: number
    }>()

    activeCompetitors.forEach(comp => {
      const country = comp.sellerCountry || 'Unknown'
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          asins: [],
          sales: 0,
          revenue: 0
        })
      }
      
      const countryData = countryMap.get(country)!
      countryData.asins.push(comp.asin)
      countryData.sales += comp.sales
      countryData.revenue += parseEuropeanNumber(comp.revenue)
    })

    const totalSales = activeCompetitors.reduce((sum, c) => sum + c.sales, 0)
    const totalRevenue = activeCompetitors.reduce((sum, c) => {
      return sum + parseEuropeanNumber(c.revenue)
    }, 0)

    let results = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        asinCount: data.asins.length,
        sales: data.sales,
        salesPercent: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
        revenue: data.revenue,
        revenuePercent: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        avgRevenue: data.revenue / data.asins.length
      }))
    
    // Apply filter
    if (countryFilter) {
      results = results.filter(item => 
        item.country.toLowerCase().includes(countryFilter.toLowerCase())
      )
    }
    
    // Apply sorting
    results.sort((a, b) => {
      const aVal = a[countrySort.key as keyof typeof a] as number
      const bVal = b[countrySort.key as keyof typeof b] as number
      return countrySort.direction === 'desc' ? bVal - aVal : aVal - bVal
    })
    
    return results
  }, [activeCompetitors, countrySort, countryFilter])
  
  // Helper functions for sorting
  const handleBrandSort = (key: string) => {
    setBrandSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }
  
  const handleCountrySort = (key: string) => {
    setCountrySort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }
  
  const SortButton = ({ sortKey, currentSort, onSort }: {
    sortKey: string
    currentSort: {key: string, direction: 'asc' | 'desc'}
    onSort: (key: string) => void
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(sortKey)}
      className="h-6 px-2 text-xs"
    >
      {currentSort.key === sortKey ? (
        currentSort.direction === 'desc' ? 
          <ChevronDown className="w-3 h-3" /> : 
          <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronUp className="w-3 h-3 opacity-30" />
      )}
    </Button>
  )

  // Clustering Prezzi (5 fasce) - Force price-based clustering
  const priceClusterAnalysis = useMemo(() => {
    // Debug: Log all competitor data to understand price source
    console.log('Price Clustering Debug - All competitor data:', activeCompetitors.map(comp => ({
      asin: comp.asin,
      brand: comp.brand,
      priceRaw: comp.price,
      priceType: typeof comp.price,
      isEmpty: comp.price === '' || comp.price === null || comp.price === undefined,
      priceParsed: parseEuropeanNumber(comp.price || ''),
      revenueRaw: comp.revenue,
      sales: comp.sales,
      // For debugging: show original price field
      originalPrice: comp.price || 'N/A'
    })))
    
    // For now, use AOV as price proxy since price data is empty
    // TODO: Fix data source to get actual prices
    const prices = activeCompetitors
      .map(comp => comp.sales > 0 ? parseEuropeanNumber(comp.revenue) / comp.sales : 0)
      .filter(p => p > 0)
      .sort((a, b) => a - b)

    console.log('Using AOV as price proxy for clustering:', prices)

    if (prices.length === 0) {
      console.log('No valid price data found for clustering')
      return []
    }

    const minPrice = prices[0]
    const maxPrice = prices[prices.length - 1]
    const range = maxPrice - minPrice
    const clusterSize = range / 5

    console.log('Price clustering params:', { minPrice, maxPrice, range, clusterSize })

    const clusters: ClusterData[] = []
    
    for (let i = 0; i < 5; i++) {
      const clusterMin = minPrice + (i * clusterSize)
      const clusterMax = i === 4 ? maxPrice : minPrice + ((i + 1) * clusterSize)
      
      const competitorsInCluster = activeCompetitors.filter(comp => {
        // Using AOV as price proxy until real price data is available
        const value = comp.sales > 0 ? parseEuropeanNumber(comp.revenue) / comp.sales : 0
        return value >= clusterMin && value <= clusterMax && value > 0
      })

      console.log(`Cluster ${i + 1} (${clusterMin.toFixed(2)} - ${clusterMax.toFixed(2)}):`, competitorsInCluster.length, 'competitors')

      const totalSales = activeCompetitors.reduce((sum, c) => sum + c.sales, 0)
      const totalRevenue = activeCompetitors.reduce((sum, c) => {
        const revenue = parseEuropeanNumber(c.revenue)
        return sum + revenue
      }, 0)

      const clusterSales = competitorsInCluster.reduce((sum, c) => sum + c.sales, 0)
      const clusterRevenue = competitorsInCluster.reduce((sum, c) => {
        const revenue = parseEuropeanNumber(c.revenue)
        return sum + revenue
      }, 0)

      clusters.push({
        label: `Fascia ${i + 1}`,
        range: `€${clusterMin.toFixed(2)} - €${clusterMax.toFixed(2)}`,
        count: competitorsInCluster.length,
        totalSales: clusterSales,
        totalRevenue: clusterRevenue,
        avgAOV: clusterSales > 0 ? clusterRevenue / clusterSales : 0,
        avgImages: 0, // Placeholder
        salesPercentage: totalSales > 0 ? (clusterSales / totalSales) * 100 : 0,
        revenuePercentage: totalRevenue > 0 ? (clusterRevenue / totalRevenue) * 100 : 0,
        brands: [...new Set(competitorsInCluster.map(c => c.brand))].slice(0, 3)
      })
    }

    const filteredClusters = clusters.filter(c => c.count > 0)
    console.log('Final clusters:', filteredClusters)
    return filteredClusters
  }, [activeCompetitors])

  return (
    <div className="space-y-6">
      {/* Fulfillment Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <Package className="w-4 h-4 mr-2" />
            Analisi Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amazon Fulfilled (FBA+AMZ)</span>
                <Badge variant="default" className="text-xs">{fulfillmentAnalysis.fba.count} ASIN</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Sales</span>
                  <span className="font-medium">{(fulfillmentAnalysis.fba.sales || 0).toLocaleString()} ({fulfillmentAnalysis.fba.salesPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={fulfillmentAnalysis.fba.salesPercent} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Revenue</span>
                  <span className="font-medium">€{(fulfillmentAnalysis.fba.revenue || 0).toLocaleString()} ({fulfillmentAnalysis.fba.revenuePercent.toFixed(1)}%)</span>
                </div>
                <Progress value={fulfillmentAnalysis.fba.revenuePercent} className="h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Merchant (MFN)</span>
                <Badge variant="secondary" className="text-xs">{fulfillmentAnalysis.fbm.count} ASIN</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Sales</span>
                  <span className="font-medium">{(fulfillmentAnalysis.fbm.sales || 0).toLocaleString()} ({fulfillmentAnalysis.fbm.salesPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={fulfillmentAnalysis.fbm.salesPercent} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Revenue</span>
                  <span className="font-medium">€{(fulfillmentAnalysis.fbm.revenue || 0).toLocaleString()} ({fulfillmentAnalysis.fbm.revenuePercent.toFixed(1)}%)</span>
                </div>
                <Progress value={fulfillmentAnalysis.fbm.revenuePercent} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base">
              <Building2 className="w-4 h-4 mr-2" />
              Top 15 Brand per Revenue
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  placeholder="Filtra brand..."
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="pl-7 h-7 w-32 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Compact sortable headers */}
          <div className="grid grid-cols-5 gap-2 pb-2 mb-2 border-b text-xs font-medium text-gray-600">
            <div>Brand</div>
            <div className="flex items-center justify-center">
              Sales
              <SortButton sortKey="sales" currentSort={brandSort} onSort={handleBrandSort} />
            </div>
            <div className="flex items-center justify-center">
              Revenue
              <SortButton sortKey="revenue" currentSort={brandSort} onSort={handleBrandSort} />
            </div>
            <div className="flex items-center justify-center">
              Avg Rev
              <SortButton sortKey="avgRevenue" currentSort={brandSort} onSort={handleBrandSort} />
            </div>
            <div className="flex items-center justify-center">
              ASINs
              <SortButton sortKey="asinCount" currentSort={brandSort} onSort={handleBrandSort} />
            </div>
          </div>
          
          {/* Compact data rows */}
          <div className="space-y-1">
            {brandAnalysis.map((brand, index) => (
              <div key={brand.brand} className="grid grid-cols-5 gap-2 py-1 text-xs hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">#{index + 1}</Badge>
                  <div className="truncate font-medium" title={brand.brand}>
                    {brand.brand.length > 12 ? brand.brand.substring(0, 12) + '...' : brand.brand}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{(brand.sales || 0).toLocaleString()}</div>
                  <div className="text-gray-500">({brand.salesPercent.toFixed(1)}%)</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">€{(brand.revenue || 0).toLocaleString()}</div>
                  <div className="text-gray-500">({brand.revenuePercent.toFixed(1)}%)</div>
                </div>
                <div className="text-center font-medium">
                  €{formatNumber(brand.avgRevenue)}
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">{brand.asinCount}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Country Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base">
              <Flag className="w-4 h-4 mr-2" />
              Analisi per Nazione
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  placeholder="Filtra paese..."
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="pl-7 h-7 w-32 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Compact sortable headers */}
          <div className="grid grid-cols-5 gap-2 pb-2 mb-2 border-b text-xs font-medium text-gray-600">
            <div>Paese</div>
            <div className="flex items-center justify-center">
              Sales
              <SortButton sortKey="sales" currentSort={countrySort} onSort={handleCountrySort} />
            </div>
            <div className="flex items-center justify-center">
              Revenue
              <SortButton sortKey="revenue" currentSort={countrySort} onSort={handleCountrySort} />
            </div>
            <div className="flex items-center justify-center">
              Avg Rev
              <SortButton sortKey="avgRevenue" currentSort={countrySort} onSort={handleCountrySort} />
            </div>
            <div className="flex items-center justify-center">
              ASINs
              <SortButton sortKey="asinCount" currentSort={countrySort} onSort={handleCountrySort} />
            </div>
          </div>
          
          {/* Compact data rows */}
          <div className="space-y-1">
            {countryAnalysis.map((country, index) => (
              <div key={country.country} className="grid grid-cols-5 gap-2 py-1 text-xs hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">#{index + 1}</Badge>
                  <div className="truncate font-medium" title={country.country}>
                    {country.country}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{(country.sales || 0).toLocaleString()}</div>
                  <div className="text-gray-500">({country.salesPercent.toFixed(1)}%)</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">€{(country.revenue || 0).toLocaleString()}</div>
                  <div className="text-gray-500">({country.revenuePercent.toFixed(1)}%)</div>
                </div>
                <div className="text-center font-medium">
                  €{formatNumber(country.avgRevenue)}
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">{country.asinCount}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Cluster Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <DollarSign className="w-4 h-4 mr-2" />
            Clustering Prezzi (5 Fasce)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {priceClusterAnalysis.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun dato di prezzo valido trovato per il clustering</p>
            </div>
          ) : (
            <div className="space-y-2">
              {priceClusterAnalysis.map((cluster) => (
                <div key={cluster.label} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{cluster.label}</h4>
                      <p className="text-xs text-gray-500">{cluster.range}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{cluster.count} ASIN</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="font-medium">{(cluster.totalSales || 0).toLocaleString()}</div>
                      <div className="text-gray-500">Sales ({cluster.salesPercentage.toFixed(1)}%)</div>
                    </div>
                    <div>
                      <div className="font-medium">€{(cluster.totalRevenue || 0).toLocaleString()}</div>
                      <div className="text-gray-500">Revenue ({cluster.revenuePercentage.toFixed(1)}%)</div>
                    </div>
                    <div>
                      <div className="font-medium">€{cluster.avgAOV.toFixed(2)}</div>
                      <div className="text-gray-500">AOV Medio</div>
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {cluster.brands.map(brand => (
                          <Badge key={brand} variant="outline" className="text-xs px-1 py-0">
                            {brand.length > 8 ? brand.substring(0, 8) + '...' : brand}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-gray-500">Top Brands</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Revenue Share</span>
                      <span>{cluster.revenuePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={cluster.revenuePercentage} className="h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}