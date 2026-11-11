/**
 * /api/* của FE — proxy mỏng sang so-no-be.
 *
 * Lý do: BE và FE nằm trên hai domain khác nhau. Chuyển mọi lời gọi qua đây
 * giúp cookie session `sn_session` (HttpOnly) thuộc origin của FE, không cần
 * cấu hình CORS, và mọi kiểm tra quyền vẫn do BE quyết định.
 */

import { API_BASE } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };

const FORWARD_REQUEST_HEADERS = ['content-type', 'cookie', 'origin', 'referer', 'accept-language'];
const FORWARD_RESPONSE_HEADERS = ['content-type', 'cache-control', 'x-robots-tag'];

async function proxy(request: Request, context: Context): Promise<Response> {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const target = `${API_BASE}/api/${path.map(encodeURIComponent).join('/')}${incomingUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Giữ IP thật để BE rate-limit đúng người.
  const forwardedFor = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';
  const body = hasBody ? Buffer.from(await request.arrayBuffer()) : undefined;

  try {
    const upstream = await fetch(target, { method, headers, body, redirect: 'manual', cache: 'no-store' });

    const responseHeaders = new Headers();
    for (const name of FORWARD_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie?.() ?? []) {
      responseHeaders.append('set-cookie', cookie);
    }

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error('[fe/proxy] backend không phản hồi:', error);
    return new Response(
      JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Không kết nối được máy chủ dữ liệu' } }),
      { status: 502, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
