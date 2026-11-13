import type { Metadata } from 'next';
import PaymentQrsClient from '@/components/admin/PaymentQrsClient';
import { fetchAdmin } from '@/lib/api';
import type { PaymentQrJson } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mã QR nhận tiền · Sổ Nợ' };

export default async function PaymentQrsPage() {
  const { data } = await fetchAdmin<{ paymentQrs: PaymentQrJson[] }>('/api/payment-qrs');

  return <PaymentQrsClient initial={data?.paymentQrs ?? []} />;
}
