import { supabase } from './supabase';

/**
 * Get the current session token for API requests
 */
export async function getSessionToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Create authenticated headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  if (!token) {
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
  };
}
