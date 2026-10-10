/**
 * Resolves API endpoint URL dynamically based on environment configuration.
 * In production on Vercel: Uses VITE_API_URL pointing to the deployed backend.
 * In local development: Falls back to relative paths handled by Vite's proxy.
 */
const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE_URL = rawBase.replace(/\/$/, '');

export function getApiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL || '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export default getApiUrl;
