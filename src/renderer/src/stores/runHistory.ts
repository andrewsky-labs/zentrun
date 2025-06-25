import { ref, computed } from 'vue'
import { usePresenter } from "../composables/usePresenter";
import {nanoid} from "nanoid";

const runHistoryP = usePresenter('runHistorySQLitePresenter')

interface RUN_HISTORY {
  id: string
  type?: string
  slug?: string
  run_slug?: string
  prompt: string
  tool_calls?: any // JSON parsed
  data?: any // JSON parsed
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

export const runHistoryStore = {
  runHistories: ref([]),

  // Run history list를 가져오는 action
  async loadRunHistories() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const queryTotal = await runHistoryP.query()
      const runHistories = queryTotal.filter((x) => x.user === user.id)
      // Parse JSON fields
      console.log("runHistories");
      console.log(runHistories);
      const parsedRunHistories = runHistories.map(history => {
        return {
          ...history,
          tool_calls: history.tool_calls ? JSON.parse(history.tool_calls) : [],
          data: history.data ? JSON.parse(history.data) : {},
          status: history.status || '',
          status_description: history.status_description || '',
          user: history.user || null,
          by: history.by || '',
          zent: history.zent || '',
          zent_name: history.zent_name || '',
          agent: history.agent || '',
          agent_name: history.agent_name || '',
          team: history.team || '',
          organization: history.organization || ''
        }
      })
      this.runHistories.value = parsedRunHistories
      return parsedRunHistories
    } catch (error) {
      console.error('Failed to load run histories:', error)
    }
  },

  // Run history 추가
  async addRunHistory(runHistory) {
    try {

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Stringify JSON fields
      const runHistoryToSave = {
        ...runHistory,
        tool_calls: runHistory.tool_calls ? (Array.isArray(runHistory.tool_calls) ? JSON.stringify(runHistory.tool_calls) : runHistory.tool_calls) : null,
        data: runHistory.data ? (typeof runHistory.data === 'object' ? JSON.stringify(runHistory.data) : runHistory.data) : null,
        status: runHistory.status || '',
        status_description: runHistory.status_description || '',
        user: user?.id,
        by: user?.username,
        zent: runHistory.zent || '',
        zent_name: runHistory.zent_name || '',
        agent: runHistory.agent || '',
        agent_name: runHistory.agent_name || '',
        team: runHistory.team || '',
        organization: runHistory.organization || ''
      }
      runHistoryToSave.slug = nanoid();

      console.log("runHistoryToSave");
      console.log(runHistoryToSave);
      const result = await runHistoryP.insert(runHistoryToSave)
      console.log("runHistoryToSave");
      console.log(runHistoryToSave);
      await this.loadRunHistories()
      return result
    } catch (error) {
      console.error('Failed to add run history:', error)
    }
  },

  // Run history 업데이트
  async updateRunHistory(id: string, runHistory) {
    try {
      // Stringify JSON fields
      const runHistoryToUpdate = {
        ...runHistory,
        tool_calls: runHistory.tool_calls ? (Array.isArray(runHistory.tool_calls) ? JSON.stringify(runHistory.tool_calls) : runHistory.tool_calls) : null,
        data: runHistory.data ? (typeof runHistory.data === 'object' ? JSON.stringify(runHistory.data) : runHistory.data) : null,
        status: runHistory.status || '',
        status_description: runHistory.status_description || '',
        user: runHistory.user || null,
        by: runHistory.by || '',
        zent: runHistory.zent || '',
        zent_name: runHistory.zent_name || '',
        agent: runHistory.agent || '',
        agent_name: runHistory.agent_name || '',
        team: runHistory.team || '',
        organization: runHistory.organization || ''
      }
      const result = await runHistoryP.update(id, runHistoryToUpdate)
      await this.loadRunHistories()
      return result
    } catch (error) {
      console.error('Failed to update run history:', error)
    }
  },

  // Run history 삭제
  async deleteRunHistory(id: string) {
    try {
      const result = await runHistoryP.delete(id)
      await this.loadRunHistories()
      return result
    } catch (error) {
      console.error('Failed to delete run history:', error)
    }
  },

  // Run history 가져오기
  async getRunHistoryById(id: string) {
    return this.runHistories.value.find(history => history.id === id)
  },

  // Slug로 Run history 가져오기
  async getRunHistoriesBySlug(slug: string) {
    try {
      const runHistories = await runHistoryP.getBySlug(slug)
      // Parse JSON fields
      return runHistories.map(history => {
        return {
          ...history,
          tool_calls: history.tool_calls ? JSON.parse(history.tool_calls) : [],
          data: history.data ? JSON.parse(history.data) : {},
          status: history.status || '',
          status_description: history.status_description || '',
          user: history.user || null,
          by: history.by || '',
          zent: runHistory.zent || '',
          zent_name: runHistory.zent_name || '',
          agent: runHistory.agent || '',
          agent_name: runHistory.agent_name || '',
          team: history.team || '',
          organization: history.organization || ''
        }
      })
    } catch (error) {
      console.error('Failed to get run histories by slug:', error)
      return []
    }
  },

  // Run slug로 Run history 가져오기
  async getRunHistoriesByRunSlug(runSlug: string) {
    try {
      const runHistories = await runHistoryP.getByRunSlug(runSlug)
      // Parse JSON fields
      return runHistories.map(history => {
        return {
          ...history,
          tool_calls: history.tool_calls ? JSON.parse(history.tool_calls) : [],
          data: history.data ? JSON.parse(history.data) : {},
          status: history.status || '',
          status_description: history.status_description || '',
          user: history.user || null,
          by: history.by || '',
          zent: runHistory.zent || '',
          zent_name: runHistory.zent_name || '',
          agent: runHistory.agent || '',
          agent_name: runHistory.agent_name || '',
          team: history.team || '',
          organization: history.organization || ''
        }
      })
    } catch (error) {
      console.error('Failed to get run histories by run slug:', error)
      return []
    }
  },

  // Type으로 Run history 가져오기
  async getRunHistoriesByType(type: string) {
    try {
      const runHistories = await runHistoryP.getByType(type)
      // Parse JSON fields
      return runHistories.map(history => {
        return {
          ...history,
          tool_calls: history.tool_calls ? JSON.parse(history.tool_calls) : [],
          data: history.data ? JSON.parse(history.data) : {},
          status: history.status || '',
          status_description: history.status_description || '',
          user: history.user || null,
          by: history.by || '',
          zent: runHistory.zent || '',
          zent_name: runHistory.zent_name || '',
          agent: runHistory.agent || '',
          agent_name: runHistory.agent_name || '',
          team: history.team || '',
          organization: history.organization || ''
        }
      })
    } catch (error) {
      console.error('Failed to get run histories by type:', error)
      return []
    }
  },

  // Slug로 Run history 삭제
  async deleteRunHistoriesBySlug(slug: string) {
    try {
      const result = await runHistoryP.deleteBySlug(slug)
      await this.loadRunHistories()
      return result
    } catch (error) {
      console.error('Failed to delete run histories by slug:', error)
    }
  },

  // Run slug로 Run history 삭제
  async deleteRunHistoriesByRunSlug(runSlug: string) {
    try {
      const result = await runHistoryP.deleteByRunSlug(runSlug)
      await this.loadRunHistories()
      return result
    } catch (error) {
      console.error('Failed to delete run histories by run slug:', error)
    }
  },
  getRunHistoriesByOrganization(organization: string) {
    return this.runHistories.value.filter(activity => activity.organization === organization)
  },
  getRunHistoriesByTeam(team: string) {
    return this.runHistories.value.filter(activity => activity.team === team)
  },

  // // Type별 Run history 찾기
  // getRunHistoriesByTypeComputed: computed(() => {
  //   return (type: string) => {
  //     return this.runHistories.value.filter(history => history.type === type)
  //   }
  // }),

  // // Slug별 Run history 찾기
  // getRunHistoriesBySlugComputed: computed(() => {
  //   return (slug: string) => {
  //     return this.runHistories.value.filter(history => history.slug === slug)
  //   }
  // }),
  //
  // // Run slug별 Run history 찾기
  // getRunHistoriesByRunSlugComputed: computed(() => {
  //   return (runSlug: string) => {
  //     return this.runHistories.value.filter(history => history.run_slug === runSlug)
  //   }
  // })
}
