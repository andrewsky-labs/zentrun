import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { OrganizationsTable, ORGANIZATION } from '../sqlitePresenter/tables/organizations'
import { OrganizationUsersTable, ORGANIZATION_USER } from '../sqlitePresenter/tables/organizationUsers'

export class OrganizationSQLitePresenter {
  private db!: Database.Database
  private organizationsTable!: OrganizationsTable
  private organizationUsersTable!: OrganizationUsersTable
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
    this.organizationsTable = new OrganizationsTable(this.db)
    this.organizationsTable.createTable()

    this.organizationUsersTable = new OrganizationUsersTable(this.db)
    this.organizationUsersTable.createTable()
  }

  insert(organization: Omit<ORGANIZATION, 'id' | 'created_at'>): string {
    return this.organizationsTable.insert(organization)
  }

  query(): ORGANIZATION[] {
    return this.organizationsTable.list()
  }

  get(id: string): ORGANIZATION | null {
    return this.organizationsTable.get(id)
  }

  update(id: string, data: Partial<Omit<ORGANIZATION, 'id' | 'created_at'>>): boolean {
    return this.organizationsTable.update(id, data)
  }

  delete(id: string): boolean {
    return this.organizationsTable.delete(id)
  }

  close() {
    this.db.close()
  }

  // Organization Users methods

  // Add a new organization user
  insertUser(organizationUser: Omit<ORGANIZATION_USER, 'id' | 'created_at' | 'updated_at' | 'invited_at'>): string {
    return this.organizationUsersTable.insert(organizationUser)
  }

  // Get all organization users
  queryUsers(): ORGANIZATION_USER[] {
    return this.organizationUsersTable.list()
  }

  // Get users for a specific organization
  getUsersByOrganization(organizationId: string): ORGANIZATION_USER[] {
    return this.organizationUsersTable.getByOrganization(organizationId)
  }

  // Get a specific organization user
  getUser(id: string): ORGANIZATION_USER | null {
    return this.organizationUsersTable.get(id)
  }

  // Update an organization user
  updateUser(id: string, data: Partial<Omit<ORGANIZATION_USER, 'id' | 'created_at' | 'updated_at'>>): boolean {
    return this.organizationUsersTable.update(id, data)
  }

  // Update a user's role
  updateUserRole(id: string, role: string): boolean {
    return this.organizationUsersTable.updateRole(id, role)
  }

  // Update a user's status
  updateUserStatus(id: string, status: string): boolean {
    return this.organizationUsersTable.updateStatus(id, status)
  }

  // Mark a user as joined
  markUserAsJoined(id: string): boolean {
    return this.organizationUsersTable.markAsJoined(id)
  }

  // Mark a user as removed
  markUserAsRemoved(id: string): boolean {
    return this.organizationUsersTable.markAsRemoved(id)
  }

  // Delete an organization user
  deleteUser(id: string): boolean {
    return this.organizationUsersTable.delete(id)
  }

  // Delete all users for an organization
  deleteUsersByOrganization(organizationId: string): boolean {
    return this.organizationUsersTable.deleteByOrganization(organizationId)
  }
}
