import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import DebtorDetailClient from '@/components/admin/DebtorDetailClient';
import { fetchAdmin } from '@/lib/api';
import type { LedgerResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
    month?: string;
    page?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await fetchAdmin<LedgerResponse>(`/api/debtors/${id}?status=unsettled`);
  return { title: data?.debtor?.name ? `${data.debtor.name} · Sổ Nợ` : 'Sổ nợ' };
}

export default async function DebtorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const paramsQs = new URLSearchParams();
  paramsQs.set('status', sp.status ?? 'unsettled');
  if (sp.from) paramsQs.set('from', sp.from);
  if (sp.to) paramsQs.set('to', sp.to);
  if (sp.month) paramsQs.set('month', sp.month);
  if (sp.page) paramsQs.set('page', sp.page);
  const query = `?${paramsQs.toString()}`;

  const { status, data } = await fetchAdmin<LedgerResponse>(`/api/debtors/${encodeURIComponent(id)}${query}`);

  if (status === 401) redirect('/admin/login');
  if (status === 404 || !data) notFound();

  return <DebtorDetailClient initial={data} />;
}
