import { ref, computed } from 'vue'
import {usePresenter} from "../composables/usePresenter";
const agentP = usePresenter('agentSQLitePresenter')

// interface AGENT {
//   id: string
//   name: string
//   organization?: string
//   description?: string
//   created_at?: string
// }

export const agentStore = {
  agents: ref([]),

  // Agent list를 가져오는 action
  async loadAgents() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const agentsTotal = await agentP.query()
      const agents = agentsTotal.filter((x) => x.user === user.id)
      // Parse JSON fields
      const parsedAgents = agents.map(agent => {
        let ragData = { entries: [] }
        let data = {}
        if (agent.data) {
          try {
            data = JSON.parse(agent.data)
            if (data.rag_data) {
              ragData = data.rag_data
            }
          } catch (e) {
            console.error('Failed to parse agent data:', e)
          }
        }

        return {
          ...agent,
          categories: agent.categories ? JSON.parse(agent.categories) : [],
          tags: agent.tags ? JSON.parse(agent.tags) : [],
          zents: agent.zents ? JSON.parse(agent.zents) : [],
          ragData: ragData,
          data: data
        }
      })
      this.agents.value = parsedAgents
      return parsedAgents
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  },

  // Agent 추가
  async addAgent(agent) {
    try {
      // Prepare RAG data if present
      console.log("addAgent", agent)

      let data = {}
      if (agent.data) {
        data = { ...agent.data }
      }

      // Stringify JSON fields
      const agentToSave = {
        ...agent,
        categories: agent.categories ? (Array.isArray(agent.categories) ? JSON.stringify(agent.categories) : agent.categories) : null,
        ragData: agent.ragData ? (typeof agent.ragData !== 'string' ? JSON.stringify(agent.ragData) : agent.ragData) : null,
        tags: agent.tags ? (Array.isArray(agent.tags) ? JSON.stringify(agent.tags) : agent.tags) : null,
        zents: agent.zents ? (Array.isArray(agent.zents) ? JSON.stringify(agent.zents) : agent.zents) : null,
        data: JSON.stringify(data),
        is_public: agent.is_public ? 1 : 0
      }
      console.log("agentToSave")
      console.log(agentToSave)
      const result = await agentP.insert(agentToSave)
      await this.loadAgents()
      return result
    } catch (error) {
      console.error('Failed to add agent:', error)
    }
  },

  // Agent 업데이트
  async updateAgent(id: string, agent) {
    try {
      // Get existing agent to preserve data that's not being updated
      const existingAgent = await agentP.get(id)
      let existingData = {}
      if (existingAgent && existingAgent.data) {
        try {
          existingData = JSON.parse(existingAgent.data)
        } catch (e) {
          console.error('Failed to parse existing agent data:', e)
        }
      }

      // Define the keys from the AGENT interface
      const agentKeys = [
        'id', 'name', 'slug', 'prompt', 'categories', 'tags', 'description',
        'zents', 'data', 'is_public', 'created_at', 'user',
        'organization', 'team', 'by', 'thumbnail', 'cover_image_url', 'bio'
      ];

      // Filter the agent object to only include keys from the AGENT interface
      const agentToUpdate = Object.keys(agent)
        .filter(key => agentKeys.includes(key))
        .reduce((obj, key) => {
          obj[key] = agent[key];
          return obj;
        }, {});

      // Handle JSON fields
      if (agent.categories) {
        agentToUpdate.categories = Array.isArray(agent.categories) ? JSON.stringify(agent.categories) : agent.categories;
      }

      if (agent.tags) {
        agentToUpdate.tags = Array.isArray(agent.tags) ? JSON.stringify(agent.tags) : agent.tags;
      }

      if (agent.zents) {
        agentToUpdate.zents = Array.isArray(agent.zents) ? JSON.stringify(agent.zents) : agent.zents;
      }

      if (agent.ragData) {
        agentToUpdate.ragData = typeof agent.ragData !== 'string' ? JSON.stringify(agent.ragData) : agent.ragData;
      }

      if (agent.data !== null && agent.data !== undefined) {
        agentToUpdate.data = JSON.stringify(agent.data);
      }

      // Convert boolean is_public to number (0 or 1)
      if ('is_public' in agent) {
        agentToUpdate.is_public = agent.is_public ? 1 : 0;
      }

      const result = await agentP.update(id, agentToUpdate)
      await this.loadAgents()
      return result
    } catch (error) {
      console.error('Failed to update agent:', error)
    }
  },

  // Agent 삭제
  async deleteAgent(id: string) {
    try {
      const result = await agentP.delete(id)
      await this.loadAgents()
      return result
    } catch (error) {
      console.error('Failed to delete agent:', error)
    }
  },

  // Agent을 id로 찾기
  getAgentBySlug (slug: string) {
      return this.agents.value.find(agent => agent.slug === slug)
    },

  // Agent을 name으로 찾기
  getAgentByName (name: string) {
      return this.agents.value.find(agent => agent.name === name)
    },

  // Agent이름으로 중복 확인
  isAgentNameUnique (name: string) {
      return !this.agents.value.some(agent => agent.name === name)
    },

  // Organization에 속한 Agent들 찾기
  getAgentsByOrganization (orgId: string) {
      return this.agents.value.filter(agent => agent.organization === orgId)
    },

  /**
   * Sync agents with server data
   * - Update existing agents with matching slugs
   * - Add new agents that don't exist locally
   * - Remove agents that exist locally but not in server data
   * @param serverAgents Array of agents from the server
   */
  async syncAgents(serverAgents: any[]) {
    try {
      console.log('Syncing agents:', serverAgents);

      // Load current agents from local database
      const localAgents = await this.loadAgents();

      // Track which local agents are still present in server data
      const localAgentsToKeep = new Set<string>();

      // Process each server agent
      for (const serverAgent of serverAgents) {
        if (!serverAgent.slug) {
          console.warn('Server agent missing slug, skipping:', serverAgent);
          continue;
        }

        // Find matching local agent by slug
        const localAgent = this.getAgentBySlug(serverAgent.slug);

        if (localAgent) {
          // Agent exists locally - update it
          console.log(`Updating existing agent: ${serverAgent.slug}`);
          localAgentsToKeep.add(localAgent.id);
          await this.updateAgent(localAgent.id, serverAgent);
        } else {
          // New agent - add it
          console.log(`Adding new agent: ${serverAgent.slug}`);
          await this.addAgent(serverAgent);
        }
      }

      // // Remove local agents that are not in server data
      // for (const localAgent of localAgents) {
      //   if (localAgent.slug && !localAgentsToKeep.has(localAgent.id) &&
      //       serverAgents.some(serverAgent => serverAgent.slug === localAgent.slug) === false) {
      //     console.log(`Removing agent no longer in server data: ${localAgent.slug}`);
      //     await this.deleteAgent(localAgent.id);
      //   }
      // }

      // Reload agents to ensure consistency
      await this.loadAgents();

      return true;
    } catch (error) {
      console.error('Failed to sync agents:', error);
      return false;
    }
  }
}
