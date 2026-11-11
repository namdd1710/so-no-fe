import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import DebtorDetailClient from '@/components/admin/DebtorDetailClient';
import { fetchAdmin } from '@/lib/api';
import type { LedgerResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await fetchAdmin<LedgerResponse>(`/api/debtors/${id}`);
  return { title: data?.debtor?.name ? `${data.debtor.name} · Sổ Nợ` : 'Sổ nợ' };
}

export default async function DebtorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { month } = await searchParams;

  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const { status, data } = await fetchAdmin<LedgerResponse>(`/api/debtors/${encodeURIComponent(id)}${query}`);

  if (status === 401) redirect('/admin/login');
  if (status === 404 || !data) notFound();

  return <DebtorDetailClient initial={data} />;
}
