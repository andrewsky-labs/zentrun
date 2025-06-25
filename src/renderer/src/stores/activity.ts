import { ref, computed } from 'vue'
import { usePresenter } from "../composables/usePresenter"

// Define the activity interface
interface Activity {
  id: string
  type: string // 'add', 'edit', 'remove', 'move', etc.
  action: string // Descriptive action text
  entity_type: string // 'agent', 'team', 'organization', 'zent', etc.
  entity_id: string
  entity_name: string
  organization?: string
  team?: string
  agent?: string
  user?: number
  by?: string
  created_at?: string
}

export const activityStore = {
  activities: ref<Activity[]>([]),
  activityPresenter: usePresenter('activitySQLitePresenter'),

  // Load all activities
  async loadActivities() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const activitiesTotal = await this.activityPresenter.query()
      const response = activitiesTotal.filter((x) => x.user === user.id)
      this.activities.value = response
      // console.log("response");
      // console.log(response);
      return response
    } catch (error) {
      console.error('Failed to load activities:', error)
      return []
    }
  },

  // Add a new activity
  async addActivity(activity: Omit<Activity, 'id' | 'created_at'>) {
    try {
      const id = await this.activityPresenter.insert(activity)
      await this.loadActivities()
      return id
    } catch (error) {
      console.error('Failed to add activity:', error)
    }
  },

  // Get activities by organization ID
  getActivitiesByOrganization(organization: string) {
  return this.activities.value.filter(activity => activity.organization === organization)
  },
  // Get activities by organization ID
  getActivitiesByTeam(team: string) {
  return this.activities.value.filter(activity => activity.team === team)
  },

  // Get activities by entity ID
  getActivitiesByEntity: computed(() => {
    return (entityId: string) => {
      return this.activities.value.filter(activity =>
        activity.entityId === entityId
      )
    }
  }),

  // Get activities by type
  getActivitiesByType: computed(() => {
    return (type: string) => {
      return this.activities.value.filter(activity =>
        activity.type === type
      )
    }
  })
}
