import { createClient } from '@libsql/client'
import type { AnalysisData } from '@/types/analysis'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

export class DatabaseService {
  static async initialize() {
    try {
      // Create analyses table
      await client.execute(`
        CREATE TABLE IF NOT EXISTS analyses (
          id TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          data TEXT NOT NULL
        )
      `)
      
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
    }
  }

  static async saveAnalysis(analysisId: string, data: AnalysisData): Promise<void> {
    try {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO analyses (id, data) VALUES (?, ?)',
        args: [analysisId, JSON.stringify(data)]
      })
    } catch (error) {
      console.error('Failed to save analysis:', error)
      throw new Error('Failed to save analysis to database')
    }
  }

  static async getAnalysis(analysisId: string): Promise<AnalysisData | null> {
    try {
      const result = await client.execute({
        sql: 'SELECT data FROM analyses WHERE id = ?',
        args: [analysisId]
      })

      if (result.rows.length === 0) {
        return null
      }

      const data = JSON.parse(result.rows[0].data as string) as AnalysisData
      return data
    } catch (error) {
      console.error('Failed to get analysis:', error)
      throw new Error('Failed to retrieve analysis from database')
    }
  }

  static async updateAnalysis(analysisId: string, data: AnalysisData): Promise<void> {
    try {
      const result = await client.execute({
        sql: 'UPDATE analyses SET data = ? WHERE id = ?',
        args: [JSON.stringify(data), analysisId]
      })

      if (result.rowsAffected === 0) {
        throw new Error('Analysis not found')
      }
    } catch (error) {
      console.error('Failed to update analysis:', error)
      throw new Error('Failed to update analysis in database')
    }
  }

  static async listAnalyses(): Promise<Array<{id: string, created_at: string}>> {
    try {
      const result = await client.execute(
        'SELECT id, created_at FROM analyses ORDER BY created_at DESC LIMIT 100'
      )

      return result.rows.map(row => ({
        id: row.id as string,
        created_at: row.created_at as string
      }))
    } catch (error) {
      console.error('Failed to list analyses:', error)
      throw new Error('Failed to retrieve analyses from database')
    }
  }
}

// Initialize database on module load
DatabaseService.initialize().catch(console.error)