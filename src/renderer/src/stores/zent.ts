import { ref, computed } from 'vue'
import {usePresenter} from "../composables/usePresenter";

const zentP = usePresenter('zentSQLitePresenter')
interface ZENT {
  id: string
  name: string
  slug: string
  organization?: string
  agent?: string
  description?: string
  created_at?: string
}

export const zentStore = {
  zents: ref([]),

  // Zent list를 가져오는 action
  async loadZents() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const zentsTotal = await zentP.query()
      const zents = zentsTotal.filter((x) => x.user === user.id)
      // Parse JSON fields
      const parsedZents = zents.map(zent => {
        return {
          ...zent,
          categories: zent.categories ? JSON.parse(zent.categories) : [],
          tags: zent.tags ? JSON.parse(zent.tags) : [],
          data: zent.data ? JSON.parse(zent.data) : {},
          tool_calls: zent.tool_calls ? JSON.parse(zent.tool_calls) : []
        }
      })
      this.zents.value = parsedZents
      return parsedZents
    } catch (error) {
      console.error('Failed to load zents:', error)
    }
  },

  // Zent 추가
  async addZent(zent) {
    try {
      // Stringify JSON fields
      const zentToSave = {
        ...zent,
        categories: zent.categories ? (Array.isArray(zent.categories) ? JSON.stringify(zent.categories) : zent.categories) : null,
        tags: zent.tags ? (Array.isArray(zent.tags) ? JSON.stringify(zent.tags) : zent.tags) : null,
        tool_calls: zent.tool_calls ? (Array.isArray(zent.tool_calls) ? JSON.stringify(zent.tool_calls) : zent.tool_calls) : null,
        data: zent.data ? (typeof zent.data !== 'string') ? JSON.stringify(zent.data) : zent.data : null,
        is_public: zent.is_public ? 1 : 0
      }
      const result = await zentP.insert(zentToSave)
      await this.loadZents()
      return result
    } catch (error) {
      console.error('Failed to add zent:', error)
    }
  },

  // Zent 업데이트
  async updateZent(id: string, zent) {
    try {
      console.log("updateZent", zent)

      // Define the keys from the ZENT interface
      const zentKeys = [
        'id', 'name', 'slug', 'prompt', 'categories', 'tags',
        'tool_calls', 'created_at', 'user', 'by', 'agent',
        'organization', 'team', 'data', 'is_public'
      ];

      // Filter the zent object to only include keys from the ZENT interface
      const zentToUpdate = Object.keys(zent)
        .filter(key => zentKeys.includes(key))
        .reduce((obj, key) => {
          obj[key] = zent[key];
          return obj;
        }, {});

      // Handle JSON fields
      if (zent.categories) {
        zentToUpdate.categories = Array.isArray(zent.categories) ? JSON.stringify(zent.categories) : zent.categories;
      }

      if (zent.tags) {
        zentToUpdate.tags = Array.isArray(zent.tags) ? JSON.stringify(zent.tags) : zent.tags;
      }

      if (zent.tool_calls) {
        zentToUpdate.tool_calls = Array.isArray(zent.tool_calls) ? JSON.stringify(zent.tool_calls) : zent.tool_calls;
      }

      if (zent.data) {
        zentToUpdate.data = (typeof zent.data !== 'string') ? JSON.stringify(zent.data) : zent.data;
      }

      // Convert boolean is_public to number (0 or 1)
      if ('is_public' in zent) {
        zentToUpdate.is_public = zent.is_public ? 1 : 0;
      }

      console.log("updateZent", zentToUpdate)
      const result = await zentP.update(id, zentToUpdate)
      await this.loadZents()
      return result
    } catch (error) {
      console.error('Failed to update zent:', error)
    }
  },

  // Zent 삭제
  async deleteZent(id: string) {
    try {
      const result = await zentP.delete(id)
      await this.loadZents()
      return result
    } catch (error) {
      console.error('Failed to delete zent:', error)
    }
  },

  // Zent 삭제
  async getZentById(id: string) {
      return this.zents.value.find(zent => zent.id === id)
  },

  async getZentBySlug(slug: string) {
      return this.zents.value.find(zent => zent.slug === slug)
  },

  // Zent을 id로 찾기
  // getZentById: computed(() => {
  //   return (id: string) => {
  //     return this.zents.value.find(zent => zent.id === id)
  //   }
  // }),

  // Zent을 name으로 찾기
  getZentByName(name: string) {
      return this.zents.value.find(zent => zent.name === name)
    },

  // Organization에 속한 Zent들 찾기
  getZentsByOrganization (orgSlug: string) {
      return this.zents.value.filter(zent => zent.organization === orgSlug)
    },

  // Agent에 속한 Zent들 찾기
  getZentsByAgent (agentSlug: string) {
      return this.zents.value.filter(zent => zent.agent === agentSlug)
    },

  // Standalone Zent들 찾기
  getStandaloneZents () {
      return this.zents.value.filter(zent =>
        !zent.organization &&
        !zent.agent
      )
    },

  /**
   * Sync zents with server data
   * - Update existing zents with matching slugs
   * - Add new zents that don't exist locally
   * - Remove zents that exist locally but not in server data
   * @param serverZents Array of zents from the server
   */
  async syncZents(serverZents: any[]) {
    try {
      console.log('Syncing zents:', serverZents);

      // Load current zents from local database
      const localZents = await this.loadZents();

      // Track which local zents are still present in server data
      const localZentsToKeep = new Set<string>();

      // Process each server zent
      for (const serverZent of serverZents) {
        if (!serverZent.slug) {
          console.warn('Server zent missing slug, skipping:', serverZent);
          continue;
        }

        // Find matching local zent by slug
        const localZent = await this.getZentBySlug(serverZent.slug);

        if (localZent) {
          // Zent exists locally - update it
          console.log(`Updating existing zent: ${serverZent.slug}`);
          localZentsToKeep.add(localZent.id);
          await this.updateZent(localZent.id, serverZent);
        } else {
          // New zent - add it
          console.log(`Adding new zent: ${serverZent.slug}`);
          await this.addZent(serverZent);
        }
      }

      // // Remove local zents that are not in server data
      // for (const localZent of localZents) {
      //   if (localZent.slug && !localZentsToKeep.has(localZent.id) &&
      //       serverZents.some(serverZent => serverZent.slug === localZent.slug) === false) {
      //     console.log(`Removing zent no longer in server data: ${localZent.slug}`);
      //     await this.deleteZent(localZent.id);
      //   }
      // }

      // Reload zents to ensure consistency
      await this.loadZents();

      return true;
    } catch (error) {
      console.error('Failed to sync zents:', error);
      return false;
    }
  }
}
