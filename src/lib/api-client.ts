import { ApiResponse } from "../../shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('lumina_token');
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    localStorage.removeItem('lumina_token');
    if (window.location.pathname !== '/' && window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
  }
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch (e) {
    throw new Error(`Failed to parse response from ${path} (${res.status})`);
  }
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || `Request to ${path} failed with status ${res.status}`);
  }
  return json.data;
}