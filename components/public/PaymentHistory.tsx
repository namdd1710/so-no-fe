'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MoneyText from '@/components/ledger/MoneyText';
import { formatDateVn } from '@/lib/format';

type Item = { id: string; periodStart: string | null; periodEnd: string; amount: number; entryCount: number };

/** Lịch sử "đã thanh toán" cho trang công khai (BRIEF §4.4). */
export default function PaymentHistory({ settlements }: { settlements: Item[] }) {
  const total = settlements.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Accordion variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="payment-history" id="payment-history-summary">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%', pr: 1 }}>
          <Typography variant="subtitle2">Lịch sử đã thanh toán</Typography>
          <Typography variant="caption" color="text.secondary">
            {settlements.length} lần
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {settlements.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Chưa có lần thanh toán nào được ghi nhận.
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {settlements.map((item) => (
              <Box key={item.id} sx={{ py: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                  <Typography variant="body2" fontWeight={600}>
                    Đã thanh toán ngày {formatDateVn(item.periodEnd)}
                  </Typography>
                  <MoneyText amount={item.amount} suffix="₫" fontWeight={600} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {item.periodStart ? `Kỳ sau ${formatDateVn(item.periodStart)}` : 'Kỳ từ đầu sổ'} · {item.entryCount} khoản
                </Typography>
              </Box>
            ))}
            <Stack direction="row" justifyContent="space-between" sx={{ pt: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                Tổng đã thanh toán
              </Typography>
              <MoneyText amount={total} suffix="₫" fontWeight={700} />
            </Stack>
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
