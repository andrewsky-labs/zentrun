import { ref, computed } from 'vue'
import {usePresenter} from "../composables/usePresenter";

const orgP = usePresenter('organizationSQLitePresenter')

export const organizationStore = {
  organizations: ref([]),
  organizationUsers: ref([]),

  // Organization list를 가져오는 action
  async loadOrganizations() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const queryTotal = await orgP.query()
      const orgs = queryTotal.filter((x) => x.user === user.id)
      // Parse JSON data field
      const parsedOrgs = orgs.map(org => {
        let data = {}
        if (org.data) {
          try {
            data = JSON.parse(org.data)
          } catch (e) {
            console.error('Failed to parse organization data:', e)
          }
        }

        return {
          ...org,
          data: data
        }
      })
      this.organizations.value = parsedOrgs
      return parsedOrgs
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  },

  // Organization 추가
  async addOrganization(organization) {
    try {
      // Prepare data if present
      let data = {}
      if (organization.data) {
        data = { ...organization.data }
      }

      // Stringify JSON data field
      const orgToSave = {
        ...organization,
        data: organization.data ? JSON.stringify(data) : null,
        is_public: organization.is_public ? 1 : 0
      }
      const result = await orgP.insert(orgToSave)
      await this.loadOrganizations()
      return result
    } catch (error) {
      console.error('Failed to add organization:', error)
    }
  },

  // Organization 업데이트
  async updateOrganization(id, organization) {
    try {
      // Get existing organization to preserve data that's not being updated
      const existingOrg = await orgP.get(id)
      let existingData = {}
      if (existingOrg && existingOrg.data) {
        try {
          existingData = JSON.parse(existingOrg.data)
        } catch (e) {
          console.error('Failed to parse existing organization data:', e)
        }
      }

      // Define the keys from the ORGANIZATION interface
      const organizationKeys = [
        'id', 'name', 'slug', 'description', 'seat_pool_limit',
        'billingCustomer', 'subscription', 'is_public', 'user',
        'by', 'created_at', 'thumbnail', 'cover_image_url',
        'bio', 'mode', 'data'
      ];

      // Filter the organization object to only include keys from the ORGANIZATION interface
      const orgToUpdate = Object.keys(organization)
        .filter(key => organizationKeys.includes(key))
        .reduce((obj, key) => {
          obj[key] = organization[key];
          return obj;
        }, {});

      // Handle data field if it exists
      if (organization.data !== null && organization.data !== undefined) {
        orgToUpdate.data = JSON.stringify(organization.data)
      }

      // Convert boolean is_public to number (0 or 1)
      if ('is_public' in organization) {
        orgToUpdate.is_public = organization.is_public ? 1 : 0;
      }

      const result = await orgP.update(id, orgToUpdate)
      await this.loadOrganizations()
      return result
    } catch (error) {
      console.error('Failed to update organization:', error)
    }
  },

  // Organization 삭제
  async deleteOrganization(id: string) {
    try {
      const result = await orgP.delete(id)
      await this.loadOrganizations()
      return result
    } catch (error) {
      console.error('Failed to delete organization:', error)
    }
  },

  // // Organization을 id로 찾기
  // getOrganizationById: computed(() => {
  //   return (id: string) => {
  //     return this.organizations.value.find(org => org.id === id)
  //   }
  // }),

  // Organization을 slug로 찾기
  getOrganizationBySlug(slug: string) {
    if (!this.organizations.value || this.organizations.value.length === 0) {
      this.loadOrganizations()
    }
    return this.organizations.value.find(org => org.slug === slug)
  },

  // Organization이름으로 찾기
  getOrganizationByName(name: string) {
    if (!this.organizations.value || this.organizations.value.length === 0) {
      this.loadOrganizations()
    }
    return this.organizations.value.find(org => org.name === name)
  },

  // Organization이름으로 중복 확인
  isOrganizationNameUnique(name: string) {
    if (!this.organizations.value || this.organizations.value.length === 0) {
      this.loadOrganizations()
    }
    return !this.organizations.value.some(org => org.name === name)
  },

  /**
   * Sync organizations with server data
   * - Update existing organizations with matching slugs
   * - Add new organizations that don't exist locally
   * - Remove organizations that exist locally but not in server data
   * @param serverOrganizations Array of organizations from the server
   */
  async syncOrganizations(serverOrganizations: any[]) {
    try {
      console.log('Syncing organizations:', serverOrganizations);

      // Load current organizations from local database
      const localOrgs = await this.loadOrganizations();

      // Track which local organizations are still present in server data
      const localOrgsToKeep = new Set<string>();

      // Process each server organization
      for (const serverOrg of serverOrganizations) {
        serverOrg.user = JSON.parse(localStorage.getItem('user') || '{}').id;

        if (!serverOrg.slug) {
          console.warn('Server organization missing slug, skipping:', serverOrg);
          continue;
        }

        // Find matching local organization by slug
        if (!this.organizations) {
          await this.loadOrganizations()
        }
        const localOrg = this.organizations.value.find(org => org.slug === serverOrg.slug);
        if (localOrg) {
          // Organization exists locally - update it
          console.log(`Updating existing organization: ${serverOrg.slug}`);
          localOrgsToKeep.add(localOrg.id);
          await this.updateOrganization(localOrg.id, serverOrg);
        } else {
          // New organization - add it
          console.log(`Adding new organization: ${serverOrg.slug}`);
          await this.addOrganization(serverOrg);
        }
      }

      // // Remove local organizations that are not in server data
      // for (const localOrg of localOrgs) {
      //   if (localOrg.slug && !localOrgsToKeep.has(localOrg.id) &&
      //       serverOrganizations.some(serverOrg => serverOrg.slug === localOrg.slug) === false) {
      //     console.log(`Removing organization no longer in server data: ${localOrg.slug}`);
      //     await this.deleteOrganization(localOrg.id);
      //   }
      // }

      // Reload organizations to ensure consistency
      await this.loadOrganizations();

      return true;
    } catch (error) {
      console.error('Failed to sync organizations:', error);
      return false;
    }
  },

  // Organization Users methods

  // Load all organization users
  async loadOrganizationUsers() {
    try {
      const users = await orgP.queryUsers();
      this.organizationUsers.value = users;
      return users;
    } catch (error) {
      console.error('Failed to load organization users:', error);
      return [];
    }
  },

  // Load users for a specific organization
  async loadOrganizationUsersByOrganization(organizationId: string) {
    try {
      const users = await orgP.getUsersByOrganization(organizationId);
      return users;
    } catch (error) {
      console.error(`Failed to load users for organization ${organizationId}:`, error);
      return [];
    }
  },

  // Add a new organization user
  async addOrganizationUser(user: any) {
    try {
      // Prepare data if present
      let data = null;
      if (user.data) {
        data = typeof user.data === 'string' ? user.data : JSON.stringify(user.data);
      }

      const userToSave = {
        ...user,
        data
      };

      const result = await orgP.insertUser(userToSave);
      await this.loadOrganizationUsers();
      return result;
    } catch (error) {
      console.error('Failed to add organization user:', error);
      return null;
    }
  },

  // Update an organization user
  async updateOrganizationUser(id: string, user: any) {
    try {
      // Prepare data if present
      if (user.data && typeof user.data !== 'string') {
        user.data = JSON.stringify(user.data);
      }

      const result = await orgP.updateUser(id, user);
      await this.loadOrganizationUsers();
      return result;
    } catch (error) {
      console.error('Failed to update organization user:', error);
      return false;
    }
  },

  // Update a user's role
  async updateOrganizationUserRole(id: string, role: string) {
    try {
      const result = await orgP.updateUserRole(id, role);
      await this.loadOrganizationUsers();
      return result;
    } catch (error) {
      console.error('Failed to update organization user role:', error);
      return false;
    }
  },

  // Mark a user as joined
  async markOrganizationUserAsJoined(id: string) {
    try {
      const result = await orgP.markUserAsJoined(id);
      await this.loadOrganizationUsers();
      return result;
    } catch (error) {
      console.error('Failed to mark organization user as joined:', error);
      return false;
    }
  },

  // Mark a user as removed
  async markOrganizationUserAsRemoved(id: string) {
    try {
      const result = await orgP.markUserAsRemoved(id);
      await this.loadOrganizationUsers();
      return result;
    } catch (error) {
      console.error('Failed to mark organization user as removed:', error);
      return false;
    }
  },

  // Delete an organization user
  async deleteOrganizationUser(id: string) {
    try {
      const result = await orgP.deleteUser(id);
      await this.loadOrganizationUsers();
      return result;
    } catch (error) {
      console.error('Failed to delete organization user:', error);
      return false;
    }
  }
}
