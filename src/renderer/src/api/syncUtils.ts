import { organizationStore } from '../stores/organization';
import { teamStore } from '../stores/team';
import { agentStore } from '../stores/agent';
import { zentStore } from '../stores/zent';
import { useToast } from '../components/ui/toast/use-toast';
import { useI18n } from 'vue-i18n'

/**
 * Process sync data received from either SSE or API endpoints
 * @param syncData The data received from the server containing organizations, teams, agents, and zents
 * @param showToast Whether to show a toast notification (default: true)
 * @param reloadPage Whether to reload the page after syncing (default: true)
 */
export function processSyncData(
  syncData: any,
  showToast: boolean = true,
  reloadPage: boolean = true
): void {
  try {
    console.log('processSyncData:', syncData);
    const { toast } = useToast();
    console.log('toast:');
    console.log('t:');
    // if (showToast) {
    //   toast({
    //     title: t('startSyncTitle'),
    //     description: t('startSyncDescription'),
    //     variant: 'default',
    //   });
    // }
    console.log('Sync data received:', syncData);

    // Process organizations if present
    if (syncData.organizations && Array.isArray(syncData.organizations)) {
      syncOrganizations(syncData.organizations);
    }

    // Process teams if present
    if (syncData.teams && Array.isArray(syncData.teams)) {
      console.log('Teams sync data received:', syncData.teams);
      syncTeams(syncData.teams);
    }

    // Process agents if present
    if (syncData.agents && Array.isArray(syncData.agents)) {
      console.log('Agents sync data received:', syncData.agents);
      syncAgents(syncData.agents);
    }

    // Process zents if present
    if (syncData.zents && Array.isArray(syncData.zents)) {
      console.log('Zents sync data received:', syncData.zents);
      syncZents(syncData.zents);
    }

    // Process user data if present
    if (syncData.user) {
      localStorage.setItem('user', JSON.stringify(syncData.user));
    }

    // Reload the page if requested
    if (reloadPage) {
      window.location.reload();
    }

    // // Show toast notification if requested
    // if (showToast) {
    //   const { toast } = useToast();
    //   toast({
    //     title: t('endSyncTitle'),
    //     description: t('endSyncDescription'),
    //     variant: 'default',
    //   });
    // }
  } catch (error) {
    console.error('Error processing sync data:', error);
  }
}

/**
 * Sync organizations with local database
 * @param organizations Array of organizations from the server
 */
function syncOrganizations(organizations: any[]): void {
  // Call the syncOrganizations method in the organization store
  organizationStore.syncOrganizations(organizations);
}

/**
 * Sync teams with local database
 * @param teams Array of teams from the server
 */
function syncTeams(teams: any[]): void {
  // Call the syncTeams method in the team store
  teamStore.syncTeams(teams);
}

/**
 * Sync agents with local database
 * @param agents Array of agents from the server
 */
function syncAgents(agents: any[]): void {
  // Call the syncAgents method in the agent store
  agentStore.syncAgents(agents);
}

/**
 * Sync zents with local database
 * @param zents Array of zents from the server
 */
function syncZents(zents: any[]): void {
  // Call the syncZents method in the zent store
  zentStore.syncZents(zents);
}
