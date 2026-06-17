/**
 * Admin API fetch wrapper - automatically includes auth token
 */

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

/**
 * Parse response safely - handles non-JSON responses (e.g. Nginx error pages)
 */
async function parseResponse(res: Response): Promise<{ ok: boolean; status: number; data: unknown }> {
  const text = await res.text();
  let data: unknown;
  
  if (text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      // Response is not JSON (probably Nginx error page or redirect)
      data = { error: `服务器返回非JSON响应 (HTTP ${res.status})`, raw: text.substring(0, 500) };
    }
  } else {
    data = { error: `服务器返回空响应 (HTTP ${res.status})` };
  }
  
  return { ok: res.ok, status: res.status, data };
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Merge existing headers
  if (options.headers) {
    const existing = options.headers as Record<string, string>;
    Object.entries(existing).forEach(([key, value]) => {
      headers[key] = value;
    });
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
  });
  
  return res;
}

/**
 * Admin fetch with auto JSON parsing and better error messages
 */
export async function adminFetchJSON<T = unknown>(
  url: string, 
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await adminFetch(url, options);
  return parseResponse(res) as Promise<{ ok: boolean; status: number; data: T }>;
}

export function clearAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

/**
 * Safely parse JSON from a Response, with better error messages for non-JSON responses
 */
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`服务器返回空响应 (HTTP ${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`服务器返回非JSON响应 (HTTP ${res.status}): ${text.substring(0, 200)}`);
  }
}
