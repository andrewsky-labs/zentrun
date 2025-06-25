import { ref, computed } from 'vue'
import { usePresenter } from "../composables/usePresenter"

const teamP = usePresenter('teamSQLitePresenter')

interface TEAM {
  id: string
  name: string
  slug?: string
  organization?: string
  created_at?: string
  user?: number
  by?: string
  is_public?: number
}

export const teamStore = {
  teams: ref([]),

  // 팀 목록 가져오기
  async loadTeams() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const queryTotal = await teamP.query()
      const teams = queryTotal.filter((x) => x.user === user.id)
      this.teams.value = teams
      return teams
    } catch (error) {
      console.error('Failed to load teams:', error)
    }
  },

  // 팀 추가
  async createTeam(team) {
    try {
      const teamToSave = {
        ...team,
        is_public: team.is_public ? 1 : 0
      }
      const result = await teamP.insert(teamToSave)
      await this.loadTeams()
      return result
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  },

  // 팀 업데이트
  async updateTeam(id, team) {
    try {
      // Define the keys from the TEAM interface
      const teamKeys = [
        'id', 'name', 'slug', 'description', 'organization',
        'parentTeam', 'created_at', 'user', 'by', 'is_public'
      ];

      // Filter the team object to only include keys from the TEAM interface
      const teamToUpdate = Object.keys(team)
        .filter(key => teamKeys.includes(key))
        .reduce((obj, key) => {
          obj[key] = team[key];
          return obj;
        }, {});

      // Convert boolean is_public to number (0 or 1)
      if ('is_public' in team) {
        teamToUpdate.is_public = team.is_public ? 1 : 0;
      }

      const result = await teamP.update(id, teamToUpdate)
      await this.loadTeams()
      return result
    } catch (error) {
      console.error('Failed to update team:', error)
    }
  },

  // 팀 삭제
  async deleteTeam(id: string) {
    try {
      const result = await teamP.delete(id)
      await this.loadTeams()
      return result
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  },

  // 팀을 slug로 찾기
  getTeamBySlug (slug: string) {
      return this.teams.value.find(team => team.slug === slug)
    },

  // 팀을 이름으로 찾기
  getTeamByName (name: string) {
      return this.teams.value.find(team => team.name === name)
    },

  // 팀 이름 중복 확인
  isTeamNameUnique (name: string) {
      return !this.teams.value.some(team => team.name === name)
    },

  // 팀을 조직 ID로 필터링
  getTeamsByOrganization (organizationId: string) {
      return this.teams.value.filter(team => team.organization === organizationId)
    },

  /**
   * Sync teams with server data
   * - Update existing teams with matching slugs
   * - Add new teams that don't exist locally
   * - Remove teams that exist locally but not in server data
   * @param serverTeams Array of teams from the server
   */
  async syncTeams(serverTeams: any[]) {
    try {
      console.log('Syncing teams:', serverTeams);

      // Load current teams from local database
      const localTeams = await this.loadTeams();

      // Track which local teams are still present in server data
      const localTeamsToKeep = new Set<string>();

      // Process each server team
      for (const serverTeam of serverTeams) {
        if (!serverTeam.slug) {
          console.warn('Server team missing slug, skipping:', serverTeam);
          continue;
        }

        // Find matching local team by slug
        const localTeam = this.getTeamBySlug(serverTeam.slug);

        if (localTeam) {
          // Team exists locally - update it
          console.log(`Updating existing team: ${serverTeam.slug}`);
          localTeamsToKeep.add(localTeam.id);
          await this.updateTeam(localTeam.id, serverTeam);
        } else {
          // New team - add it
          console.log(`Adding new team: ${serverTeam.slug}`);
          await this.createTeam(serverTeam);
        }
      }

      // // Remove local teams that are not in server data
      // for (const localTeam of localTeams) {
      //   if (localTeam.slug && !localTeamsToKeep.has(localTeam.id) &&
      //       serverTeams.some(serverTeam => serverTeam.slug === localTeam.slug) === false) {
      //     console.log(`Removing team no longer in server data: ${localTeam.slug}`);
      //     await this.deleteTeam(localTeam.id);
      //   }
      // }

      // Reload teams to ensure consistency
      await this.loadTeams();

      return true;
    } catch (error) {
      console.error('Failed to sync teams:', error);
      return false;
    }
  }
}
