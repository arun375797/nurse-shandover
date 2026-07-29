import { apiFetch } from './client';

export type UserUsageStats = {
  loginCount: number;
  handoverCreateCount: number;
  handoverUpdateCount: number;
  acknowledgeCount: number;
  lastActivityAt: string | null;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'nurse' | 'admin';
  active: boolean;
  unit: { id: string; name: string; code: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
  usage: UserUsageStats;
};

export type AdminFormOption = {
  id: string;
  category: string;
  value: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FormOptionsMap = Record<string, string[]>;

export async function fetchAdminUsers() {
  return apiFetch<{ items: AdminUser[] }>('/api/admin/users');
}

export async function updateAdminUser(id: string, payload: { active: boolean }) {
  return apiFetch<{ item: AdminUser }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function fetchAdminFormOptions() {
  return apiFetch<{ items: AdminFormOption[] }>('/api/admin/form-options');
}

export async function createAdminFormOption(payload: {
  category: string;
  value: string;
  sortOrder?: number;
}) {
  return apiFetch<{ item: AdminFormOption }>('/api/admin/form-options', {
    method: 'POST',
    json: payload,
  });
}

export async function updateAdminFormOption(
  id: string,
  payload: { value?: string; sortOrder?: number; active?: boolean },
) {
  return apiFetch<{ item: AdminFormOption }>(`/api/admin/form-options/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function deleteAdminFormOption(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/form-options/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchFormOptions() {
  return apiFetch<{ options: FormOptionsMap }>('/api/form-options');
}
