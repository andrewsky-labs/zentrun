import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { AgentsTable, AGENT } from '../sqlitePresenter/tables/agents'

export class AgentSQLitePresenter {
  private db!: Database.Database
  private agentsTable!: AgentsTable
  private dbPath: string
  private dbDir: string

  constructor(dbPath: string) {
    this.dbPath = dbPath
    // Ensure directory exists
    this.dbDir = path.dirname(dbPath)
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true })
    }
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.initTables()
  }

  private initTables() {
    this.agentsTable = new AgentsTable(this.db)
    this.agentsTable.createTable()
  }

  /**
   * Creates a dedicated SQLite database for an agent
   * @param slug The agent's slug
   * @returns The path to the agent's database
   */
  createAgentDatabase(slug: string): string {
    const agentDbPath = path.join(this.dbDir, `${slug}.db`)

    // Create the database if it doesn't exist
    if (!fs.existsSync(agentDbPath)) {
      const db = new Database(agentDbPath)
      db.pragma('journal_mode = WAL')
      db.close()
    }

    return agentDbPath
  }

  /**
   * Gets the path to an agent's dedicated database
   * @param slug The agent's slug
   * @returns The path to the agent's database
   */
  getAgentDatabasePath(slug: string): string {
    return path.join(this.dbDir, `${slug}.db`)
  }

  insert(agent: Omit<AGENT, 'id' | 'created_at'>): string {
    // Create a dedicated database for the agent
    if (agent.slug) {
      this.createAgentDatabase(agent.slug)
    }
    return this.agentsTable.insert(agent)
  }

  query(): AGENT[] {
    return this.agentsTable.list()
  }

  get(id: string): AGENT | null {
    return this.agentsTable.get(id)
  }

  update(id: string, data: Partial<Omit<AGENT, 'id' | 'created_at'>>): boolean {
    return this.agentsTable.update(id, data)
  }

  delete(id: string): boolean {
    return this.agentsTable.delete(id)
  }

  close() {
    this.db.close()
  }
}
