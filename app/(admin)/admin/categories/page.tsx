import type { Metadata } from 'next';
import CategoriesClient from '@/components/admin/CategoriesClient';
import { fetchAdmin } from '@/lib/api';
import type { CategoryJson } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Danh mục khoản · Sổ Nợ' };

export default async function CategoriesPage() {
  const { data } = await fetchAdmin<{ categories: CategoryJson[] }>('/api/categories');

  return <CategoriesClient initial={data?.categories ?? []} />;
}
