import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { isAdminAuthenticated } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Bảo vệ toàn bộ /admin/* — kiểm tra session thật với backend, không chỉ nhìn cookie. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return <AdminShell>{children}</AdminShell>;
}
