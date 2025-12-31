import { ApiResponse } from "../../shared/types";
interface ApiOptions extends RequestInit {
  silent?: boolean;
  responseType?: 'json' | 'blob';
}
export async function api<T>(path: string, options?: ApiOptions): Promise<T> {
  const token = localStorage.getItem('lumina_token');
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const { silent, responseType = 'json', ...init } = options || {};
  try {
    const res = await fetch(path, { ...init, headers });
    if (res.status === 401) {
      const isPublicPath = path.includes('/api/public/') || window.location.pathname.startsWith('/shared/');
      if (!isPublicPath) {
        localStorage.removeItem('lumina_token');
        if (window.location.pathname !== '/' && window.location.pathname !== '/auth' && !silent) {
          window.location.href = '/auth';
        }
      }
    }
    if (responseType === 'blob') {
      if (!res.ok) throw new Error('Blob transmission failed');
      return (await res.blob()) as unknown as T;
    }
    const text = await res.text();
    let json: ApiResponse<T>;
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch (e) {
      throw new Error(`Decoder failed: ${res.status}`);
    }
    if (!res.ok || !json.success) {
      const errorMsg = json.error || `Sanctuary error: ${res.status}`;
      if (!silent) console.error(`[API] ${path}:`, errorMsg);
      throw new Error(errorMsg);
    }
    return json.data as T;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Moat interrupted');
  }
}