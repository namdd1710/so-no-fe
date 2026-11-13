'use client';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import MoneyText from '@/components/ledger/MoneyText';
import { apiFetch } from '@/lib/client-api';
import { formatDateTimeVn } from '@/lib/format';
import type { ConfirmationJson } from '@/lib/types';

type Props = {
  debtorId: string;
  items: ConfirmationJson[];
  onChanged: () => void;
  notify: (message: string, severity?: 'success' | 'error' | 'info') => void;
};

/**
 * Con nợ tự báo "đã chuyển khoản" ở trang công khai; đây là chỗ chủ nợ đối
 * chiếu và đánh dấu đã nhận / bỏ qua. Không tự trừ nợ — chốt kỳ vẫn là thao
 * tác riêng để tổng luôn tính lại từ entries.
 */
export default function ConfirmationsPanel({ debtorId, items, onChanged, notify }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = items.filter((item) => item.status === 'pending');

  async function resolve(id: string, status: 'confirmed' | 'rejected') {
    setBusyId(id);
    const result = await apiFetch(`/api/debtors/${debtorId}/confirmations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!result.ok) {
      notify(result.message ?? 'Không cập nhật được', 'error');
      return;
    }
    notify(status === 'confirmed' ? 'Đã đánh dấu nhận tiền' : 'Đã bỏ qua lời báo này');
    onChanged();
  }

  if (pending.length === 0) return null;

  return (
    <Stack spacing={1.25}>
      <Alert severity="info" icon={false}>
        Con nợ báo đã chuyển khoản {pending.length} lần — kiểm tra sao kê rồi xác nhận. Xác nhận ở đây chỉ đánh dấu,
        muốn trừ nợ hãy bấm <strong>Chốt</strong>.
      </Alert>

      {pending.map((item) => (
        <Stack
          key={item.id}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 2, py: 1.25 }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <MoneyText amount={item.amount} suffix="₫" fontWeight={700} color="primary" />
              <Chip size="small" label="Chờ kiểm tra" />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Báo lúc {formatDateTimeVn(item.declaredAt)}
            </Typography>
            {item.note && (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {item.note}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              disabled={busyId === item.id}
              onClick={() => resolve(item.id, 'confirmed')}
            >
              Đã nhận
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<CloseIcon />}
              disabled={busyId === item.id}
              onClick={() => resolve(item.id, 'rejected')}
            >
              Bỏ qua
            </Button>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
