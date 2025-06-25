import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface AUTOMATION {
  id: string
  name: string
  prompt: string
  schedule: string // Cron expression
  frequency: string // Human-readable frequency
  status: string // 'active' or 'inactive'
  lastRun?: string
  nextRun?: string
  organization?: string
  agent?: string
  team?: string
  tool_calls?: string
  created_at?: string
  updated_at?: string
  by?: string
  user?: number
}

export class AutomationTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'automations')
  }

  getCreateTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS automations (
        id TEXT PRIMARY KEY,
        name TEXT,
        prompt TEXT,
        schedule TEXT,
        frequency TEXT,
        status TEXT,
        lastRun TEXT,
        nextRun TEXT,
        organization TEXT,
        agent TEXT,
        team TEXT,
        tool_calls TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        by TEXT,
        user INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_automations_organization ON automations(organization);
      CREATE INDEX IF NOT EXISTS idx_automations_agent ON automations(agent);
      CREATE INDEX IF NOT EXISTS idx_automations_team ON automations(team);
      CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
    `
  }

  getMigrationSQL(_version: number): string | null {
    return null
  }

  getLatestVersion(): number {
    return 0
  }

  createTable(): void {
    if (!this.tableExists()) {
      this.db.exec(this.getCreateTableSQL())
    }
  }

  insert(automation: Omit<AUTOMATION, 'id' | 'created_at' | 'updated_at'>): string {
    const id = automation.id || nanoid()
    const now = new Date().toISOString()

    this.db.prepare(
      `INSERT INTO automations (
        id, name, prompt, schedule, frequency, status, lastRun, nextRun,
        organization, agent, team, tool_calls, created_at, updated_at, by, user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      automation.name,
      automation.prompt,
      automation.schedule,
      automation.frequency,
      automation.status || 'active',
      automation.lastRun,
      automation.nextRun,
      automation.organization,
      automation.agent,
      automation.team,
      automation.tool_calls,
      now,
      now,
      automation.by,
      automation.user
    )
    return id
  }

  list(): AUTOMATION[] {
    return this.db.prepare(`SELECT * FROM automations ORDER BY created_at DESC`).all() as AUTOMATION[]
  }

  get(id: string): AUTOMATION | null {
    return this.db.prepare(`SELECT * FROM automations WHERE id = ?`).get(id) as AUTOMATION || null
  }

  getActive(): AUTOMATION[] {
    return this.db.prepare(`SELECT * FROM automations WHERE status = 'active' ORDER BY created_at DESC`).all() as AUTOMATION[]
  }

  getByOrganization(organization: string): AUTOMATION[] {
    return this.db.prepare(`SELECT * FROM automations WHERE organization = ? ORDER BY created_at DESC`).all(organization) as AUTOMATION[]
  }

  getByTeam(team: string): AUTOMATION[] {
    return this.db.prepare(`SELECT * FROM automations WHERE team = ? ORDER BY created_at DESC`).all(team) as AUTOMATION[]
  }

  getByAgent(agent: string): AUTOMATION[] {
    return this.db.prepare(`SELECT * FROM automations WHERE agent = ? ORDER BY created_at DESC`).all(agent) as AUTOMATION[]
  }

  update(id: string, data: Partial<Omit<AUTOMATION, 'id' | 'created_at'>>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    // Add updated_at timestamp
    const updateData = { ...data, updated_at: new Date().toISOString() };

    const setClause = Object.keys(updateData).map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE automations SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...updateData, id });
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM automations WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }
}
