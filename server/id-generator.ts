import { nanoid } from 'nanoid';

/**
 * Generate a cryptographically secure ID with optional prefix
 * @param prefix Optional prefix (e.g., 'tx', 'inst', 'save')
 * @returns Unique ID in format: prefix-nanoid (or just nanoid if no prefix)
 */
export const generateId = (prefix?: string): string => {
  const id = nanoid(16);
  return prefix ? `${prefix}-${id}` : id;
};
