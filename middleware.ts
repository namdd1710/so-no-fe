import { NextResponse, type NextRequest } from 'next/server';

/**
 * Chặn cứng `/admin/*` khi chưa có cookie session (lớp 1).
 * Lớp 2: layout /admin kiểm tra session thật với backend.
 * Lớp 3: backend xác thực chữ ký HMAC trên mọi request ghi.
 */
const SESSION_COOKIE = 'sn_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
