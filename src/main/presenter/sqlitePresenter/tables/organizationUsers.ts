import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface ORGANIZATION_USER {
  id: string
  user: number
  organization: string
  role: string
  status: string
  data: string // JSON string
  invited_at: string
  joined_at: string
  removed_at: string
  created_at: string
  updated_at: string
}

export class OrganizationUsersTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'organization_users')
  }

  createTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS organization_users (
        id TEXT PRIMARY KEY,
        user INTEGER,
        organization TEXT,
        role TEXT,
        status TEXT DEFAULT 'pending',
        data TEXT,
        invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        joined_at DATETIME,
        removed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  insert(organizationUser: Omit<ORGANIZATION_USER, 'id' | 'created_at' | 'updated_at' | 'invited_at'>): string {
    const id = nanoid()
    const now = new Date().toISOString()

    this.db.prepare(
      `INSERT INTO organization_users (
        id, user, organization, role, status, data, invited_at, joined_at, removed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      organizationUser.user,
      organizationUser.organization,
      organizationUser.role,
      organizationUser.status || 'pending',
      organizationUser.data,
      now,
      organizationUser.joined_at,
      organizationUser.removed_at
    )

    return id
  }

  list(): ORGANIZATION_USER[] {
    return this.db.prepare(`SELECT * FROM organization_users ORDER BY created_at DESC`).all() as ORGANIZATION_USER[]
  }

  getByOrganization(organizationId: string): ORGANIZATION_USER[] {
    return this.db.prepare(
      `SELECT * FROM organization_users WHERE organization = ? AND removed_at IS NULL ORDER BY created_at DESC`
    ).all(organizationId) as ORGANIZATION_USER[]
  }

  get(id: string): ORGANIZATION_USER | null {
    return this.db.prepare(`SELECT * FROM organization_users WHERE id = ?`).get(id) as ORGANIZATION_USER || null
  }

  update(id: string, data: Record<string, any>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    // Add updated_at to the data
    data.updated_at = new Date().toISOString();

    const setClause = keys.map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE organization_users SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...data, id });
    return !!result.changes;
  }

  updateRole(id: string, role: string): boolean {
    const stmt = this.db.prepare(
      `UPDATE organization_users SET role = ?, updated_at = ? WHERE id = ?`
    );
    const result = stmt.run(role, new Date().toISOString(), id);
    return !!result.changes;
  }

  updateStatus(id: string, status: string): boolean {
    const stmt = this.db.prepare(
      `UPDATE organization_users SET status = ?, updated_at = ? WHERE id = ?`
    );
    const result = stmt.run(status, new Date().toISOString(), id);
    return !!result.changes;
  }

  markAsJoined(id: string): boolean {
    const stmt = this.db.prepare(
      `UPDATE organization_users SET status = 'active', joined_at = ?, updated_at = ? WHERE id = ?`
    );
    const now = new Date().toISOString();
    const result = stmt.run(now, now, id);
    return !!result.changes;
  }

  markAsRemoved(id: string): boolean {
    const stmt = this.db.prepare(
      `UPDATE organization_users SET status = 'removed', removed_at = ?, updated_at = ? WHERE id = ?`
    );
    const now = new Date().toISOString();
    const result = stmt.run(now, now, id);
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM organization_users WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }

  deleteByOrganization(organizationId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM organization_users WHERE organization = ?`);
    const result = stmt.run(organizationId);
    return !!result.changes;
  }
}
