export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch(endpoint: string, options: RequestInit & { redirectOn401?: boolean } = {}) {
  const { redirectOn401 = true, ...fetchOptions } = options;
  const token = localStorage.getItem('token');
  const headers = new Headers(fetchOptions.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && fetchOptions.method && fetchOptions.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers
  });

  if (response.status === 401 && redirectOn401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}
