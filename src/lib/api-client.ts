import { ApiResponse } from "../../shared/types"
interface ApiOptions extends RequestInit {
  silent?: boolean;
}
export async function api<T>(path: string, options?: ApiOptions): Promise<T> {
  const token = localStorage.getItem('lumina_token');
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const { silent, ...init } = options || {};
  try {
    const res = await fetch(path, { ...init, headers });
    if (res.status === 401 && !silent) {
      localStorage.removeItem('lumina_token');
      if (window.location.pathname !== '/' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    let json: ApiResponse<T>;
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch (e) {
      throw new Error(`Failed to parse response from ${init.method || 'GET'} ${path} (${res.status})`);
    }
    if (!res.ok || !json.success) {
      const errorMsg = json.error || `Request to ${path} failed with status ${res.status}`;
      console.error(`[API ERROR] ${init.method || 'GET'} ${path}:`, errorMsg);
      throw new Error(errorMsg);
    }
    if (json.data === undefined) {
      // For void responses
      return null as T;
    }
    return json.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected network error occurred');
  }
}