'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon, Calculator } from 'lucide-react'

export const CalculationInfo: React.FC = () => {
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Spiegazione dei Calcoli
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Come vengono calcolate le metriche in BinoDive:</strong>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">📊 SV Totale Mercato</h4>
            <p className="text-sm text-gray-600">
              Somma del Search Volume di tutte le keyword <strong>attive</strong> (non eliminate).
              Si aggiorna automaticamente quando elimini/ripristini keyword.
            </p>
            <code className="block bg-gray-100 p-2 text-xs rounded">
              SV Totale = Σ(Search Volume keyword attive)
            </code>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-lg">💪 % Rilevanza Competitor</h4>
            <p className="text-sm text-gray-600">
              Per ogni competitor, calcola la percentuale di keyword dove il prodotto è posizionato Top 30.
            </p>
            <code className="block bg-gray-100 p-2 text-xs rounded">
              % Rilevanza = (Numero keyword Top 30) / (Totale keyword attive) × 100
            </code>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-lg">🏆 Livelli di Forza</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span><strong>Molto Forte:</strong> ≥80%</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                <span><strong>Forte:</strong> ≥65%</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <span><strong>Medio:</strong> ≥30%</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
                <span><strong>Debole:</strong> &lt;30%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-lg">🔍 Rilevanza</h4>
            <p className="text-sm text-gray-600">
              La rilevanza viene impostata a <strong>0%</strong> per le keyword brand,
              altrimenti mantiene il valore originale dal file CSV.
            </p>
            <code className="block bg-gray-100 p-2 text-xs rounded">
              Rilevanza = isBrand ? 0 : valore_originale
            </code>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-lg">🏪 Brand Keywords</h4>
            <p className="text-sm text-gray-600">
              Una keyword è considerata &quot;brand&quot; se:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside ml-2">
              <li>Is_Brand = &quot;true&quot; o &quot;1&quot; nel CSV, oppure</li>
              <li>Ha un valore nella colonna Brand_Word</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-lg">📈 Aggiornamenti Dinamici</h4>
            <p className="text-sm text-gray-600">
              Quando elimini/ripristini keyword, vengono ricalcolati automaticamente:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside ml-2">
              <li>SV Totale Mercato</li>
              <li>% Forza di ogni competitor</li>
              <li>Livelli di forza</li>
              <li>Summary totali</li>
            </ul>
          </div>
        </div>

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Nota:</strong> Solo le keyword in posizione 1-30 contribuiscono al calcolo della forza del competitor.
            Posizioni superiori al 30 vengono ignorate nel calcolo.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}