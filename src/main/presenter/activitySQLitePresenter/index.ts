import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { ActivityTable, ACTIVITY } from '../sqlitePresenter/tables/activities'

export class ActivitySQLitePresenter {
  private db!: Database.Database
  private activityTable!: ActivityTable
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
    this.activityTable = new ActivityTable(this.db)
    this.activityTable.createTable()
  }

  insert(activity: Omit<ACTIVITY, 'id' | 'created_at'>): string {
    return this.activityTable.insert(activity)
  }

  query(): ACTIVITY[] {
    return this.activityTable.list()
  }

  get(id: string): ACTIVITY | null {
    return this.activityTable.get(id)
  }

  getByEntityId(entityId: string): ACTIVITY[] {
    return this.activityTable.getByEntityId(entityId)
  }

  getByOrganizationId(organizationId: string): ACTIVITY[] {
    return this.activityTable.getByOrganizationId(organizationId)
  }

  getByTeamId(teamId: string): ACTIVITY[] {
    return this.activityTable.getByTeamId(teamId)
  }

  getByType(type: string): ACTIVITY[] {
    return this.activityTable.getByType(type)
  }

  update(id: string, data: Partial<Omit<ACTIVITY, 'id' | 'created_at'>>): boolean {
    return this.activityTable.update(id, data)
  }

  delete(id: string): boolean {
    return this.activityTable.delete(id)
  }

  close() {
    this.db.close()
  }
}
