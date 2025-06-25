// API base URL
export const API_BASE_URL = 'https://api.zentrun.com';
// export const API_BASE_URL = 'http://0.0.0.0:2502';

import { processSyncData } from './syncUtils';

// Flag to prevent infinite loops when logging activities
let isLoggingActivity = false;

// Helper function to determine entity type from endpoint
function getentityTypeFromEndpoint(endpoint: string): string {
  if (endpoint.includes('zentrun-organization')) return 'organization';
  if (endpoint.includes('zentrun-team')) return 'team';
  if (endpoint.includes('zentrun-agent')) return 'agent';
  if (endpoint.includes('zentrun-zent')) return 'zent';
  return 'unknown';
}

// Helper function to determine action type from method and endpoint
function getActionType(method: string, endpoint: string): string {
  if (method === 'POST') return 'add';
  if (method === 'PUT') return 'edit';
  if (method === 'DELETE') return 'remove';
  return 'unknown';
}

// Helper function to get a descriptive action text
function getActionText(method: string, entity_type: string): string {
  const action = method === 'POST' ? 'Added' : method === 'PUT' ? 'Updated' : method === 'DELETE' ? 'Removed' : 'Accessed';
  return `${action} ${entity_type}`;
}

// Generic API request function
export async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  headers?: Record<string, string>,
  skipActivityLog: boolean = false
) {
  const url = `${API_BASE_URL}${endpoint}`;
  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers || {})
  };
  const token = localStorage.getItem('jwt') || '';
  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: data ? JSON.stringify(data) : undefined
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message_en || 'API request failed');
    // Attach the original error data to the error object
    error.cause = { data: errorData };
    throw error;
  }

  const result = await response.json();

  // Log activity for non-GET requests and if not already logging an activity
  // Skip activity logging for activity-related endpoints to prevent infinite loops
  if (method !== 'GET' && !skipActivityLog && !isLoggingActivity && !endpoint.includes('zentrun-activity')) {
    try {
      isLoggingActivity = true;

      const entity_type = getentityTypeFromEndpoint(endpoint);
      const actionType = getActionType(method, endpoint);
      const actionText = getActionText(method, entity_type);

      // Extract entity information from data or result
      const entity_id = data?.slug || data?.id || result?.slug || result?.id || '';
      const entity_name = data?.name || result?.name || entity_id;

      // Extract organization and team IDs if available
      const organization = data?.organization || result?.organization || '';
      const team = data?.team || result?.team || '';
      const agent = data?.agent || result?.agent || '';

      // Import dynamically to avoid circular dependencies
      const { activityStore } = await import('../stores/activity');

      // Log the activity
      await activityStore.addActivity({
        type: actionType,
        action: actionText,
        entity_type,
        entity_id,
        entity_name,
        organization,
        team,
        agent,
        by: 'current-user' // This would be replaced with the actual user in a real app
      });

    } catch (error) {
      console.error('Failed to log activity:', error);
    } finally {
      isLoggingActivity = false;
    }
  }

  return result;
}

/**
 * Synchronize data with the server using a POST request
 * This function fetches all data (organizations, teams, agents, zents) from the server
 * and processes it using the same logic as the SSE endpoint
 *
 * @param showToast Whether to show a toast notification (default: true)
 * @param reloadPage Whether to reload the page after syncing (default: true)
 * @returns Promise that resolves when the sync is complete
 */
export async function syncZentrun(
  showToast: boolean = true,
  reloadPage: boolean = true
): Promise<void> {
  try {
    // Make a POST request to the sync endpoint
    const syncData = await apiRequest('/sync-zentrun/', 'POST');

    // Process the received data using the common utility function
    processSyncData(syncData, showToast, reloadPage);

    return syncData;
  } catch (error) {
    console.error('Error syncing with server:', error);
    throw error;
  }
}
