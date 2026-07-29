let csrfToken: string | null = null;

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch('/api/auth/csrf-token', { credentials: 'include' });
  if (!res.ok) {
    throw new ApiError(res.status, 'CSRF', 'Unable to obtain security token.');
  }
  const data = (await res.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    const token = await ensureCsrf();
    headers.set('x-csrf-token', token);
  }

  let body = options.body;
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      method,
      headers,
      body,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to reach the server. If the dev server restarted, wait a moment and try again.',
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 403 && method !== 'GET' && method !== 'HEAD') {
      clearCsrfToken();
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set('Accept', 'application/json');
      const token = await ensureCsrf();
      retryHeaders.set('x-csrf-token', token);
      if (options.json !== undefined) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      let retry: Response;
      try {
        retry = await fetch(path, {
          ...options,
          method,
          headers: retryHeaders,
          body,
          credentials: 'include',
        });
      } catch {
        throw new ApiError(
          0,
          'NETWORK_ERROR',
          'Unable to reach the server. If the dev server restarted, wait a moment and try again.',
        );
      }
      const retryData = await retry.json().catch(() => ({}));
      if (!retry.ok) {
        const err = retryData as ApiErrorBody;
        throw new ApiError(
          retry.status,
          err.error?.code ?? 'ERROR',
          err.error?.message ?? 'Request failed.',
          err.error?.details,
        );
      }
      return retryData as T;
    }

    const err = data as ApiErrorBody;
    throw new ApiError(
      res.status,
      err.error?.code ?? 'ERROR',
      err.error?.message ?? 'Request failed.',
      err.error?.details,
    );
  }

  return data as T;
}
