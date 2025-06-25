/**
 * Utility functions for handling zentrun-app-core module in the main process
 */

/**
 * Returns the appropriate module path based on the environment variable
 * In development mode, it returns the community version
 * In build mode, it returns the core version
 */
export const getZentrunCorePath = () => {
  // Check if we're in build mode
  const isForBuild = process.env.VITE_IS_FOR_BUILD === 'true';

  // Return the appropriate module path
  return isForBuild ? 'zentrun-app-core' : 'zentrun-app-core-community';
};

/**
 * Returns whether the zentrun-app-core module is available
 * Returns true only when using the core version, false for community version
 */
export const hasZentrunCore = () => {
  // Check if we're in build mode
  const isForBuild = process.env.VITE_IS_FOR_BUILD === 'true';

  // Only return true if we're using the core version
  return isForBuild;
};
