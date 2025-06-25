import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { TeamsTable, TEAM } from '../sqlitePresenter/tables/teams'

export class TeamSQLitePresenter {
  private db!: Database.Database
  private teamsTable!: TeamsTable
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
    this.teamsTable = new TeamsTable(this.db)
    this.teamsTable.createTable()
  }

  insert(team: Omit<TEAM, 'id' | 'created_at'>): string {
    return this.teamsTable.insert(team)
  }

  query(): TEAM[] {
    return this.teamsTable.list()
  }

  get(id: string): TEAM | null {
    return this.teamsTable.get(id)
  }

  update(id: string, data: Partial<Omit<TEAM, 'id' | 'created_at'>>): boolean {
    return this.teamsTable.update(id, data)
  }

  delete(id: string): boolean {
    return this.teamsTable.delete(id)
  }

  close() {
    this.db.close()
  }
}
