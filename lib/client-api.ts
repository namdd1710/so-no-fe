/** Gọi API từ trình duyệt — luôn qua proxy `/api/*` của FE. */

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  code?: string;
  message?: string;
};

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  try {
    const response = await fetch(path, {
      ...init,
      headers,
      cache: 'no-store',
      credentials: 'same-origin',
    });

    let payload: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const error = (payload as { error?: { code?: string; message?: string } } | null)?.error;
      return {
        ok: false,
        status: response.status,
        data: null,
        code: error?.code,
        message: error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại',
      };
    }

    return { ok: true, status: response.status, data: payload as T };
  } catch {
    return { ok: false, status: 0, data: null, message: 'Không kết nối được máy chủ' };
  }
}
