'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, FileText, Edit, Trash2 } from 'lucide-react'
import type { UserAnalysis } from '../../../../../shared/types/audit'

interface UserAnalysisInputProps {
  analyses: UserAnalysis[]
  onAnalysesUpdate: (analyses: UserAnalysis[]) => void
}

export const UserAnalysisInput: React.FC<UserAnalysisInputProps> = ({ 
  analyses, 
  onAnalysesUpdate 
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newAnalysis, setNewAnalysis] = useState<Partial<UserAnalysis>>({
    title: '',
    content: '',
    category: 'market_insight',
    priority: 'medium',
    tags: []
  })
  const [newTag, setNewTag] = useState('')

  const categories = [
    { value: 'market_insight', label: 'Market Insight' },
    { value: 'competitor_analysis', label: 'Analisi Competitor' },
    { value: 'keyword_strategy', label: 'Strategia Keyword' },
    { value: 'pricing_strategy', label: 'Strategia Prezzi' },
    { value: 'other', label: 'Altro' }
  ]

  const priorities = [
    { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: 'Bassa', color: 'bg-green-100 text-green-800' }
  ]

  const handleAddTag = () => {
    if (!newTag.trim() || !newAnalysis.tags) return
    
    setNewAnalysis(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()]
    }))
    setNewTag('')
  }

  const handleRemoveTag = (index: number) => {
    setNewAnalysis(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSave = () => {
    if (!newAnalysis.title || !newAnalysis.content) {
      alert('Compila almeno titolo e contenuto')
      return
    }

    const analysis: UserAnalysis = {
      id: editingId || Date.now().toString(),
      title: newAnalysis.title,
      content: newAnalysis.content,
      category: newAnalysis.category || 'other',
      priority: newAnalysis.priority || 'medium',
      tags: newAnalysis.tags || [],
      createdAt: editingId ? analyses.find(a => a.id === editingId)?.createdAt || new Date() : new Date()
    }

    if (editingId) {
      onAnalysesUpdate(analyses.map(a => a.id === editingId ? analysis : a))
      setEditingId(null)
    } else {
      onAnalysesUpdate([...analyses, analysis])
    }

    setNewAnalysis({
      title: '',
      content: '',
      category: 'market_insight',
      priority: 'medium',
      tags: []
    })
    setIsAdding(false)
  }

  const handleEdit = (analysis: UserAnalysis) => {
    setNewAnalysis(analysis)
    setEditingId(analysis.id)
    setIsAdding(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa analisi?')) {
      onAnalysesUpdate(analyses.filter(a => a.id !== id))
    }
  }

  const handleCancel = () => {
    setNewAnalysis({
      title: '',
      content: '',
      category: 'market_insight',
      priority: 'medium',
      tags: []
    })
    setEditingId(null)
    setIsAdding(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Le Tue Analisi Personali
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {isAdding && (
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Titolo *
                  </label>
                  <Input
                    value={newAnalysis.title}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Es: Gap di mercato nel segmento premium"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Categoria
                    </label>
                    <Select
                      value={newAnalysis.category}
                      onValueChange={(value: any) => setNewAnalysis(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Priorità
                    </label>
                    <Select
                      value={newAnalysis.priority}
                      onValueChange={(value: any) => setNewAnalysis(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(pri => (
                          <SelectItem key={pri.value} value={pri.value}>
                            {pri.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contenuto *
                </label>
                <Textarea
                  value={newAnalysis.content}
                  onChange={(e) => setNewAnalysis(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Descrivi la tua analisi, insight o considerazione strategica..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tag
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Aggiungi tag..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newAnalysis.tags?.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  {editingId ? 'Aggiorna' : 'Salva'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Analyses */}
        <div className="space-y-3">
          {analyses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nessuna analisi personale aggiunta. Le tue analisi aiuteranno l'AI a generare un audit più personalizzato.
            </p>
          ) : (
            analyses.map(analysis => (
              <Card key={analysis.id} className="border border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{analysis.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={priorities.find(p => p.value === analysis.priority)?.color}
                      >
                        {priorities.find(p => p.value === analysis.priority)?.label}
                      </Badge>
                      <Badge variant="secondary">
                        {categories.find(c => c.value === analysis.category)?.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                    {analysis.content}
                  </p>
                  
                  {analysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {analysis.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {analysis.createdAt.toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(analysis)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(analysis.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}