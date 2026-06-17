/**
 * Admin API fetch wrapper - automatically includes auth token
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  // FormData needs the browser to auto-set Content-Type with boundary
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
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export function clearAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}
