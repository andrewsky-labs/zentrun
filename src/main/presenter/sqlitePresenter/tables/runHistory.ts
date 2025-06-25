import { Database } from 'better-sqlite3-multiple-ciphers'
import { BaseTable } from './baseTable'
import { nanoid } from 'nanoid'

export interface RUN_HISTORY {
  id: string
  type?: string
  slug?: string
  run_slug?: string
  prompt?: string
  tool_calls?: string // JSON string
  data?: string // JSON string
  status?: string
  status_description?: string
  user?: number
  by?: string
  zent?: string
  zent_name?: string
  agent?: string
  agent_name?: string
  team?: string
  organization?: string
  created_at?: string
}

export class RunHistoryTable extends BaseTable {
  constructor(db: Database.Database) {
    super(db, 'run_history')
  }

  getCreateTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS run_history (
        id TEXT PRIMARY KEY,
        type TEXT,
        slug TEXT,
        run_slug TEXT,
        prompt TEXT,
        tool_calls TEXT,
        data TEXT,
        status TEXT,
        status_description TEXT,
        user INTEGER,
        by TEXT,
        zent TEXT,
        zent_name TEXT,
        agent TEXT,
        agent_name TEXT,
        team TEXT,
        organization TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_run_history_slug ON run_history(slug);
      CREATE INDEX idx_run_history_run_slug ON run_history(run_slug);
      CREATE INDEX idx_run_history_type ON run_history(type);
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

  insert(runHistory: Omit<RUN_HISTORY, 'id' | 'created_at'>): string {
    const id = nanoid()
    console.log("runHistoryInsert", runHistory)
    this.db.prepare(
      `INSERT INTO run_history (id, type, slug, run_slug, prompt, tool_calls, data, status, status_description, user, by, zent, zent_name, agent, agent_name, team, organization)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      runHistory.type,
      runHistory.slug,
      runHistory.run_slug,
      runHistory.prompt,
      runHistory.tool_calls,
      runHistory.data,
      runHistory.status,
      runHistory.status_description,
      runHistory.user,
      runHistory.by,
      runHistory.zent,
      runHistory.zent_name,
      runHistory.agent,
      runHistory.agent_name,
      runHistory.team,
      runHistory.organization
    )
    return id
  }

  list(): RUN_HISTORY[] {
    return this.db.prepare(`SELECT * FROM run_history ORDER BY created_at DESC`).all() as RUN_HISTORY[]
  }

  get(id: string): RUN_HISTORY | null {
    return this.db.prepare(`SELECT * FROM run_history WHERE id = ?`).get(id) as RUN_HISTORY || null
  }

  getBySlug(slug: string): RUN_HISTORY[] {
    return this.db.prepare(`SELECT * FROM run_history WHERE slug = ? ORDER BY created_at DESC`).all(slug) as RUN_HISTORY[]
  }

  getByRunSlug(runSlug: string): RUN_HISTORY[] {
    return this.db.prepare(`SELECT * FROM run_history WHERE run_slug = ? ORDER BY created_at DESC`).all(runSlug) as RUN_HISTORY[]
  }

  getByType(type: string): RUN_HISTORY[] {
    return this.db.prepare(`SELECT * FROM run_history WHERE type = ? ORDER BY created_at DESC`).all(type) as RUN_HISTORY[]
  }

  update(id: string, data: Record<string, any>): boolean {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const setClause = keys.map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE run_history SET ${setClause} WHERE id = @id`);

    const result = stmt.run({ ...data, id });
    return !!result.changes;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM run_history WHERE id = ?`);
    const result = stmt.run(id);
    return !!result.changes;
  }

  deleteBySlug(slug: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM run_history WHERE slug = ?`);
    const result = stmt.run(slug);
    return !!result.changes;
  }

  deleteByRunSlug(runSlug: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM run_history WHERE run_slug = ?`);
    const result = stmt.run(runSlug);
    return !!result.changes;
  }
}
