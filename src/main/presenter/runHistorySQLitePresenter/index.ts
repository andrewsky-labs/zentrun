import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { RunHistoryTable, RUN_HISTORY } from '../sqlitePresenter/tables/runHistory'

export class RunHistorySQLitePresenter {
  private db!: Database.Database
  private runHistoryTable!: RunHistoryTable
  private dbPath: string

  constructor(dbPath: string) {
    this.dbPath = dbPath
    // Ensure directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.initTables()
  }

  private initTables() {
    this.runHistoryTable = new RunHistoryTable(this.db)
    this.runHistoryTable.createTable()
  }

  insert(runHistory: Omit<RUN_HISTORY, 'id' | 'created_at'>): string {
    return this.runHistoryTable.insert(runHistory)
  }

  query(): RUN_HISTORY[] {
    return this.runHistoryTable.list()
  }

  get(id: string): RUN_HISTORY | null {
    return this.runHistoryTable.get(id)
  }

  getBySlug(slug: string): RUN_HISTORY[] {
    return this.runHistoryTable.getBySlug(slug)
  }

  getByRunSlug(runSlug: string): RUN_HISTORY[] {
    return this.runHistoryTable.getByRunSlug(runSlug)
  }

  getByType(type: string): RUN_HISTORY[] {
    return this.runHistoryTable.getByType(type)
  }

  update(id: string, data: Partial<Omit<RUN_HISTORY, 'id' | 'created_at'>>): boolean {
    return this.runHistoryTable.update(id, data)
  }

  delete(id: string): boolean {
    return this.runHistoryTable.delete(id)
  }

  deleteBySlug(slug: string): boolean {
    return this.runHistoryTable.deleteBySlug(slug)
  }

  deleteByRunSlug(runSlug: string): boolean {
    return this.runHistoryTable.deleteByRunSlug(runSlug)
  }

  close() {
    this.db.close()
  }
}
