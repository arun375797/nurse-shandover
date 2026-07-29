import { apiFetch, clearCsrfToken, ensureCsrf } from './client';

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'nurse' | 'admin';
  unitId: string;
};

export type UnitInfo = {
  id: string;
  name: string;
  code: string;
};

export type AuthResponse = {
  user: SessionUser;
  unit: UnitInfo | null;
  timezone: string;
};

export type PatientSummary = {
  id: string;
  patientName: string;
  mrNumberDisplay: string;
  ward?: string;
  room?: string;
  bedNumber?: string;
  shift?: string;
  status: string;
  handoverStatus?: string;
  updatedAt: string;
  updatedBy?: string;
};

export type PatientListResponse = {
  items: PatientSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PatientDetail = PatientSummary &
  Record<string, unknown> & {
    version: number;
    createdAt?: string;
    assessment?: Record<string, unknown>;
    ventilation?: Record<string, unknown>;
  };

export async function login(email: string, password: string) {
  clearCsrfToken();
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    json: { email, password },
  });
  clearCsrfToken();
  await ensureCsrf();
  return data;
}

export async function logout() {
  await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  clearCsrfToken();
}

export async function fetchMe() {
  return apiFetch<AuthResponse>('/api/auth/me');
}

export type UnitsResponse = {
  items: UnitInfo[];
};

export async function fetchUnits() {
  return apiFetch<UnitsResponse>('/api/units');
}

export type RegisterResponse = {
  message: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export async function register(payload: {
  fullName: string;
  email: string;
  unitName: string;
  password: string;
  confirmPassword: string;
}) {
  clearCsrfToken();
  const data = await apiFetch<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    json: payload,
  });
  clearCsrfToken();
  return data;
}

export async function fetchPatients(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  });
  return apiFetch<PatientListResponse>(`/api/patients?${qs.toString()}`);
}

export async function fetchPatient(id: string) {
  return apiFetch<{ item: PatientDetail }>(`/api/patients/${id}`);
}

export async function createPatient(payload: unknown) {
  return apiFetch<{ item: PatientDetail }>('/api/patients', {
    method: 'POST',
    json: payload,
  });
}

export async function updatePatient(id: string, payload: unknown) {
  return apiFetch<{ item: PatientDetail }>(`/api/patients/${id}`, {
    method: 'PATCH',
    json: payload,
  });
}

export async function deletePatient(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/patients/${id}`, {
    method: 'DELETE',
  });
}
