/**
 * lib/api.ts — gọi backend (so-no-be) từ phía SERVER của Next.js.
 *
 * FE không gọi thẳng BE từ trình duyệt: mọi request của browser đều đi qua
 * `/api/*` của chính FE (app/api/[...path]/route.ts) rồi mới tới BE. Nhờ vậy
 * cookie session nằm trên origin của FE và không cần CORS.
 */

import { cookies } from 'next/headers';

export const API_BASE = (process.env.API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function forwardCookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

/** GET công khai (không cần session). Trả `null` nếu lỗi. */
export async function fetchPublic<T>(path: string): Promise<{ status: number; data: T | null }> {
  try {
    const response = await fetch(apiUrl(path), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const data = response.ok ? ((await response.json()) as T) : null;
    return { status: response.status, data };
  } catch (error) {
    console.error('[fe/api] không gọi được backend:', error);
    return { status: 503, data: null };
  }
}

/** GET cần session admin. Trả `null` nếu 401/403. */
export async function fetchAdmin<T>(path: string): Promise<{ status: number; data: T | null }> {
  try {
    const cookie = await forwardCookieHeader();
    const response = await fetch(apiUrl(path), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie },
    });
    const data = response.ok ? ((await response.json()) as T) : null;
    return { status: response.status, data };
  } catch (error) {
    console.error('[fe/api] không gọi được backend:', error);
    return { status: 503, data: null };
  }
}

/** Session còn hiệu lực không (kiểm tra thật với BE, không chỉ nhìn cookie). */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookie = await forwardCookieHeader();
  if (!cookie) return false;
  try {
    const response = await fetch(apiUrl('/api/auth/session'), { cache: 'no-store', headers: { cookie } });
    if (!response.ok) return false;
    const data = (await response.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}
