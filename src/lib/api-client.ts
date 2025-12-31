import { ApiResponse } from "../../shared/types";
interface ApiOptions extends RequestInit {
  silent?: boolean;
  responseType?: 'json' | 'blob';
}
export async function api<T>(path: string, options?: ApiOptions): Promise<T> {
  const token = localStorage.getItem('lumina_token');
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const { silent, responseType = 'json', ...init } = options || {};
  try {
    const res = await fetch(path, { ...init, headers });
    if (res.status === 401 && !silent) {
      localStorage.removeItem('lumina_token');
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/auth' && !currentPath.startsWith('/shared/')) {
        window.location.href = '/auth';
      }
    }
    if (responseType === 'blob') {
      if (!res.ok) throw new Error(`Transmission failed: ${res.status}`);
      return (await res.blob()) as unknown as T;
    }

    let json: ApiResponse<T>;
    const text = await res.text();
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch (e) {
      console.error(`[API PARSE ERROR] ${path}:`, text);
      throw new Error(`Failed to decode sanctuary response: ${res.status}`);
    }
    if (!res.ok || !json.success) {
      const errorMsg = json.error || `Sanctuary transmission error: ${res.status}`;
      if (!silent) console.error(`[API ERROR] ${path}:`, errorMsg);
      throw new Error(errorMsg);
    }
    return json.data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Moat connection interrupted');
  }
}