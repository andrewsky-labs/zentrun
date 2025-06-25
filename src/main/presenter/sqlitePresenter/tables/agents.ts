import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface AGENT {
  id: string
  name: string
  slug: string
  prompt?: string
  description?: string
  categories?: string // JSON string
  tags?: string // JSON string
  zents?: string // JSON string
  data?: string // JSON string
  is_public?: number
  created_at?: string
  user?: number
  organization?: string
  team?: string
  by?: string
  thumbnail?: string
  cover_image_url?: string
  bio?: string
}

export class AgentsTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'agents')
  }

  createTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        prompt TEXT,
        description TEXT,
        categories TEXT,
        tags TEXT,
        zents TEXT,
        data TEXT,
        is_public INTEGER DEFAULT 0,
        user INTEGER,
        by TEXT,
        organization TEXT,
        team TEXT,
        thumbnail TEXT,
        cover_image_url TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  insert(agent: Omit<AGENT, 'id' | 'created_at'>): string {
    const id = nanoid()
    this.db.prepare(
      `INSERT INTO agents (id, name, slug, prompt, description, categories, tags, zents, data, is_public, user, by, organization, team, thumbnail, cover_image_url, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, agent.name, agent.slug, agent.prompt, agent.description, agent.categories, agent.tags, agent.zents, agent.data, agent.is_public, agent.user, agent.by, agent.organization, agent.team, agent.thumbnail, agent.cover_image_url, agent.bio)
    return id
  }

  list(): AGENT[] {
    return this.db.prepare(`SELECT * FROM agents ORDER BY created_at DESC`).all() as AGENT[]
  }

  get(id: string): AGENT | null {
    return this.db.prepare(`SELECT * FROM agents WHERE id = ?`).get(id) as AGENT || null
  }

  getBySlug(slug: string): AGENT | null {
    return this.db.prepare(`SELECT * FROM agents WHERE slug = ?`).get(slug) as AGENT || null
  }

  update(id: string, data: Record<string, any>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const setClause = keys.map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE agents SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...data, id });
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM agents WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }

}
