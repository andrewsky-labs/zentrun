import { organizationStore } from '@/stores/organization'

/**
 * Check if the current user has a 'viewer' role in the specified organization
 * @param organizationSlug The slug of the organization to check
 * @returns True if the user has a 'viewer' role, false otherwise
 */
export function isViewerRole(organizationSlug: string): boolean {
  // Get the organization by slug
  const organization = organizationStore.getOrganizationBySlug(organizationSlug)

  // If organization doesn't exist or doesn't have data, return false
  if (!organization || !organization.data) {
    return false
  }

  // Check if memberInfo exists and the role is 'viewer'
  return organization.data.memberInfo && organization.data.memberInfo.role === 'viewer'
}
