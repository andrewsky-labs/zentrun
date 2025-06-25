import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface ACTIVITY {
  id: string
  type: string // 'add', 'edit', 'remove', 'move', etc.
  action: string // Descriptive action text
  entity_type: string // 'agent', 'team', 'organization', 'zent', etc.
  entity_id: string
  entity_name: string
  organization?: string
  team?: string
  agent?: string
  user?: number
  by?: string
  created_at?: string
}

export class ActivityTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'activities')
  }

  getCreateTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        entity_name TEXT NOT NULL,
        organization TEXT,
        team TEXT,
        agent TEXT,
        user INTEGER,
        by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
      CREATE INDEX IF NOT EXISTS idx_activities_organization ON activities(organization);
      CREATE INDEX IF NOT EXISTS idx_activities_team ON activities(team);
      CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
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

  insert(activity: Omit<ACTIVITY, 'id' | 'created_at'>): string {
    const id = nanoid()
    console.log("activity inesert", activity);
    this.db.prepare(
      `INSERT INTO activities (id, type, action, entity_type, entity_id, entity_name, organization, team, agent, user, by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      activity.type,
      activity.action,
      activity.entity_type,
      activity.entity_id,
      activity.entity_name,
      activity.organization,
      activity.team,
      activity.agent,
      activity.user,
      activity.by
    )
    return id
  }

  list(): ACTIVITY[] {
    return this.db.prepare(`SELECT * FROM activities ORDER BY created_at DESC`).all() as ACTIVITY[]
  }

  get(id: string): ACTIVITY | null {
    return this.db.prepare(`SELECT * FROM activities WHERE id = ?`).get(id) as ACTIVITY || null
  }

  getByentity_id(entity_id: string): ACTIVITY[] {
    return this.db.prepare(`SELECT * FROM activities WHERE entity_id = ? ORDER BY created_at DESC`).all(entity_id) as ACTIVITY[]
  }

  getByorganization(organization: string): ACTIVITY[] {
    return this.db.prepare(`SELECT * FROM activities WHERE organization = ? ORDER BY created_at DESC`).all(organization) as ACTIVITY[]
  }

  getByteam(team: string): ACTIVITY[] {
    return this.db.prepare(`SELECT * FROM activities WHERE team = ? ORDER BY created_at DESC`).all(team) as ACTIVITY[]
  }

  getByType(type: string): ACTIVITY[] {
    return this.db.prepare(`SELECT * FROM activities WHERE type = ? ORDER BY created_at DESC`).all(type) as ACTIVITY[]
  }

  update(id: string, data: Record<string, any>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const setClause = keys.map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE activities SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...data, id });
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM activities WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }
}
