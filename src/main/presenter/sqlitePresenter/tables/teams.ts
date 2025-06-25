import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface TEAM {
  id: string
  name: string
  slug?: string
  description?: string
  organization?: string
  parentTeam?: string
  created_at?: string
  user?: number
  by?: string // JSON string
  is_public?: number
}

export class TeamsTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'teams')
  }

  createTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        description TEXT,
        organization TEXT,
        parentTeam TEXT,
        user INTEGER,
        by TEXT,
        is_public INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  insert(team: Omit<TEAM, 'id' | 'created_at'>): string {
    const id = nanoid()
    this.db.prepare(
      `INSERT INTO teams (id, name, slug, description, organization, parentTeam, user, by, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, team.name, team.slug, team.description, team.organization, team.parentTeam, team.user, team.by, team.is_public)
    return id
  }

  list(): TEAM[] {
    return this.db.prepare(`SELECT * FROM teams ORDER BY created_at DESC`).all() as TEAM[]
  }

  get(id: string): TEAM | null {
    return this.db.prepare(`SELECT * FROM teams WHERE id = ?`).get(id) as TEAM || null
  }

  update(id: string, data: Record<string, any>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const setClause = keys.map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE teams SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...data, id });
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM teams WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }
}
