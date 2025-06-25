import Database from 'better-sqlite3-multiple-ciphers'
import { IGenericSQLitePresenter } from '@shared/presenter'
import fs from 'fs'
import path from 'path'

export class GenericSQLitePresenter implements IGenericSQLitePresenter {
  private activeConnections: Map<string, Database.Database> = new Map()

  /**
   * Execute a SQL query on a SQLite database
   * @param dbPath Path to the SQLite database
   * @param query SQL query to execute
   * @param params Optional parameters for the query
   * @returns Promise resolving to an array of query results
   */
  async executeQuery(dbPath: string, query: string, params: any[] = []): Promise<any[]> {
    try {
      // Get or create a database connection
      let db = this.activeConnections.get(dbPath)

      if (!db) {
        // Ensure the directory exists
        const dbDir = path.dirname(dbPath)
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true })
        }

        // Create a new database connection
        db = new Database(dbPath)
        db.pragma('journal_mode = WAL')

        // Store the connection for future use
        this.activeConnections.set(dbPath, db)
      }

      // Execute the query
      const statement = db.prepare(query)

      // Determine if this is a SELECT query or a modification query
      const isSelectQuery = query.trim().toLowerCase().startsWith('select')

      if (isSelectQuery) {
        // For SELECT queries, return all rows
        return statement.all(...params)
      } else {
        // For modification queries (INSERT, UPDATE, DELETE), run and return affected rows
        const result = statement.run(...params)
        return [{
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid
        }]
      }
    } catch (error) {
      console.error('Error executing SQLite query:', error)
      throw error
    }
  }

  /**
   * Close all database connections
   */
  close(): void {
    for (const [dbPath, db] of this.activeConnections.entries()) {
      try {
        db.close()
        console.log(`Closed database connection: ${dbPath}`)
      } catch (error) {
        console.error(`Error closing database connection ${dbPath}:`, error)
      }
    }
    this.activeConnections.clear()
  }
}
