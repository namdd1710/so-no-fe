import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DayFolderList from '@/components/ledger/DayFolderList';
import MoneyText from '@/components/ledger/MoneyText';
import FakePayButton from '@/components/public/FakePayButton';
import MonthFilter from '@/components/public/MonthFilter';
import PaymentHistory from '@/components/public/PaymentHistory';
import { fetchPublic } from '@/lib/api';
import { formatDateVn, formatMonthVn } from '@/lib/format';
import type { PublicLedgerResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ month?: string; page?: string }>;
};

export const metadata: Metadata = {
  title: 'Sổ nợ',
  robots: { index: false, follow: false },
};

/**
 * Trang công khai `/s/{code}` — CHỈ ĐỌC, render server-side (RSC), đọc thẳng
 * backend, không có API công khai dư thừa. Không index, không cache (BRIEF §8, §9).
 */
export default async function PublicLedgerPage({ params, searchParams }: Props) {
  const { code } = await params;
  const sp = await searchParams;

  const paramsQs = new URLSearchParams();
  if (sp.month) paramsQs.set('month', sp.month);
  if (sp.page) paramsQs.set('page', sp.page);
  // BE max; page has no pager — avoid silent truncation at default pageSize=10
  paramsQs.set('pageSize', '50');
  // Omit status → BE defaults to all
  const qs = paramsQs.toString();
  const query = qs ? `?${qs}` : '';

  const { status, data } = await fetchPublic<PublicLedgerResponse>(`/api/public/${encodeURIComponent(code)}${query}`);

  if (status === 404) notFound();
  if (!data) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, px: 2 }}>
        <Typography variant="h6" gutterBottom>
          Không tải được sổ nợ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vui lòng thử lại sau ít phút.
        </Typography>
      </Container>
    );
  }

  const hasDebt = data.totals.unsettled !== 0;
  const month = sp.month;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh' }}>
      <Container maxWidth="sm" sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 2, sm: 4 } }}>
        <Stack spacing={2}>
          {/* ---------- Header ---------- */}
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="overline" color="text.secondary">
              Sổ nợ
            </Typography>
            <Typography variant="h5" component="h1" sx={{ wordBreak: 'break-word' }}>
              {data.name}
            </Typography>

            <Box sx={{ mt: 2, bgcolor: 'action.hover', borderRadius: 2, px: 2, py: 1.75 }}>
              <Typography variant="overline" color="text.secondary">
                {hasDebt ? 'Còn nợ' : 'Đã thanh toán đủ'}
              </Typography>
              <MoneyText variant="h4" component="p" amount={data.totals.unsettled} suffix="₫" />
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip size="small" label={`${data.totals.unsettledCount} khoản chưa thanh toán`} />
                {data.watermark && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color="success"
                    label={`Đã chốt đến ${formatDateVn(data.watermark)}`}
                  />
                )}
              </Stack>
            </Box>
            {hasDebt && (
              <Box sx={{ mt: 2 }}>
                <FakePayButton />
              </Box>
            )}
          </Paper>

          {hasDebt === false && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Hiện không có khoản nào chưa thanh toán.
                {data.watermark ? ` Sổ đã được chốt đến ${formatDateVn(data.watermark)}.` : ''}
              </Typography>
            </Paper>
          )}

          {/* ---------- Lọc tháng ---------- */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <MonthFilter value={month ?? ''} basePath={`/s/${code}`} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Tổng phát sinh {month ? formatMonthVn(month) : 'tất cả'}
                </Typography>
                <MoneyText amount={data.totals.monthTotal} suffix="₫" fontWeight={700} />
              </Stack>
            </Stack>
          </Paper>

          {/* ---------- Khoản theo ngày (folder list) ---------- */}
          {data.groups.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
              {month ? `Không có khoản nào trong ${formatMonthVn(month)}.` : 'Chưa có khoản nào.'}
            </Typography>
          ) : (
            <DayFolderList groups={data.groups} />
          )}

          {/* ---------- Lịch sử thanh toán ---------- */}
          <PaymentHistory settlements={data.settlements} />

          <Typography variant="caption" color="text.secondary" align="center" sx={{ pb: 2 }}>
            Sổ này được cập nhật tự động · Xem lúc {formatDateVn(data.today)}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
