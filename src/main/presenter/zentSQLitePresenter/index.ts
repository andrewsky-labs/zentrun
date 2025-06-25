import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { ZentsTable, ZENT } from '../sqlitePresenter/tables/zents'
import {TEAM} from "../sqlitePresenter/tables/teams";

export class ZentSQLitePresenter {
  private db!: Database.Database
  private zentsTable!: ZentsTable
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
    this.zentsTable = new ZentsTable(this.db)
    this.zentsTable.createTable()
  }

  insert(zent: Omit<ZENT, 'id' | 'created_at'>): string {
    return this.zentsTable.insert(zent)
  }

  query(): ZENT[] {
    return this.zentsTable.list()
  }

  get(id: string): ZENT | null {
    return this.zentsTable.get(id)
  }

  update(id: string, data: Partial<Omit<ZENT, 'id' | 'created_at'>>): boolean {
    return this.zentsTable.update(id, data)
  }

  delete(id: string): boolean {
    return this.zentsTable.delete(id)
  }

  getByAgent(agentSlug: string): ZENT[] {
    return this.zentsTable.getByAgent(agentSlug)
  }

  close() {
    this.db.close()
  }
}
