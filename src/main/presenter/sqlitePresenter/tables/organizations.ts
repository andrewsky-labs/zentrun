import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface ORGANIZATION {
  id: string
  name: string
  slug?: string
  description?: string
  seat_pool_limit?: number
  billingCustomer?: string
  subscription?: string
  is_public?: number
  user?: number
  by?: string
  created_at?: string
  thumbnail?: string
  cover_image_url?: string
  bio?: string
  mode?: string
  data?: string // JSON string
}

export class OrganizationsTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'organizations')
  }

  createTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        description TEXT,
        seat_pool_limit INTEGER,
        billingCustomer TEXT,
        subscription TEXT,
        is_public INTEGER DEFAULT 0,
        user INTEGER,
        by TEXT,
        thumbnail TEXT,
        cover_image_url TEXT,
        bio TEXT,
        mode TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  insert(organization: Omit<ORGANIZATION, 'id' | 'created_at'>): string {
    const id = nanoid()
    this.db.prepare(
      `INSERT INTO organizations (id, name, slug, description, seat_pool_limit, billingCustomer, subscription, is_public, user, by, thumbnail, cover_image_url, bio, mode, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, organization.name, organization.slug, organization.description, organization.seat_pool_limit, organization.billingCustomer, organization.subscription, organization.is_public, organization.user, organization.by, organization.thumbnail, organization.cover_image_url, organization.bio, organization.mode, organization.data)
    return id
  }

  list(): ORGANIZATION[] {
    return this.db.prepare(`SELECT * FROM organizations ORDER BY created_at DESC`).all() as ORGANIZATION[]
  }

  get(id: string): ORGANIZATION | null {
    return this.db.prepare(`SELECT * FROM organizations WHERE id = ?`).get(id) as ORGANIZATION || null
  }

  update(id: string, data: Record<string, any>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const setClause = keys.map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE organizations SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...data, id });
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM organizations WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }

}
