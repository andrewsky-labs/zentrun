import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface ZENT {
  id: string
  name: string
  slug: string
  prompt?: string
  description?: string
  categories?: string // JSON string
  tags?: string // JSON string
  tool_calls?: string // JSON string
  created_at?: string
  user?: number
  by?: string
  agent?: string
  organization?: string
  team?: string
  data?: string // JSON string
  is_public?: number
}

export class ZentsTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'zents')
  }

  createTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zents (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        prompt TEXT,
        description TEXT,
        categories TEXT,
        tags TEXT,
        tool_calls TEXT,
        user INTEGER,
        by TEXT,
        agent TEXT,
        organization TEXT,
        team TEXT,
        data TEXT,
        is_public INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  insert(zent: Omit<ZENT, 'id' | 'created_at'>): string {
    const id = nanoid()
    this.db.prepare(
      `INSERT INTO zents (id, name, slug, prompt, description, categories, tags, tool_calls, user, by, agent, organization, team, data, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, zent.name, zent.slug, zent.prompt, zent.description, zent.categories, zent.tags, zent.tool_calls, zent.user, zent.by, zent.agent, zent.organization, zent.team, zent.data, zent.is_public)
    return id
  }

  list(): ZENT[] {
    return this.db.prepare(`SELECT * FROM zents ORDER BY created_at DESC`).all() as ZENT[]
  }

  get(id: string): ZENT | null {
    return this.db.prepare(`SELECT * FROM zents WHERE id = ?`).get(id) as ZENT || null
  }

  update(id: string, data: Record<string, any>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const setClause = keys.map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE zents SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...data, id });
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM zents WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }

  getByAgent(agentSlug: string): ZENT[] {
    return this.db.prepare(`SELECT * FROM zents WHERE agent = ? ORDER BY created_at DESC`).all(agentSlug) as ZENT[];
  }
}
