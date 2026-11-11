import type { Metadata } from 'next';
import DebtorsClient from '@/components/admin/DebtorsClient';
import { fetchAdmin } from '@/lib/api';
import type { DebtorSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Con nợ · Sổ Nợ' };

export default async function AdminHomePage() {
  const { data } = await fetchAdmin<{ debtors: DebtorSummary[] }>('/api/debtors');

  return <DebtorsClient initial={data?.debtors ?? []} />;
}
