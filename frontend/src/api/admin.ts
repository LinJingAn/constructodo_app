import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

export interface AdminStats {
  users: number;
  profiles: number;
  clients: number;
  professionals: number;
  project_requests: number;
  quotes: number;
  reviews: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  last_login: string | null;
  user_type?: string | null;
  profile_full_name?: string | null;
  whatsapp?: string | null;
}

export interface PageViewMetric {
  path: string;
  count: number;
}

export interface AdminPageViewsResponse {
  by_path: PageViewMetric[];
  total: number;
  days: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export const adminApi = {
  async getStats(): Promise<AdminStats> {
    const res = await fetch(`${getAPIBaseURL()}/api/v1/admin/stats`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load admin stats');
    return res.json();
  },

  async getUsers(limit = 50, offset = 0): Promise<AdminUsersResponse> {
    const res = await fetch(
      `${getAPIBaseURL()}/api/v1/admin/users?limit=${limit}&offset=${offset}`,
      { credentials: 'include', headers: authHeaders() }
    );
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  async setUserRole(userId: string, role: 'user' | 'admin'): Promise<{ id: string; email: string; role: string }> {
    const res = await fetch(`${getAPIBaseURL()}/api/v1/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to update role');
    }
    return res.json();
  },

  async getPageViews(days = 30): Promise<AdminPageViewsResponse> {
    const res = await fetch(
      `${getAPIBaseURL()}/api/v1/admin/metrics/page-views?days=${days}`,
      { credentials: 'include', headers: authHeaders() }
    );
    if (!res.ok) throw new Error('Failed to load page view metrics');
    return res.json();
  },
};
