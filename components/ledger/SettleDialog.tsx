'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import MoneyText from './MoneyText';
import { apiFetch } from '@/lib/client-api';
import { formatDateVn, nextDay } from '@/lib/format';
import type { SettlePreview } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  debtorId: string;
  today: string;
  watermark: string | null;
  onSettled: () => void;
  onRejected: (message: string) => void;
};

/**
 * Dialog chốt đã thanh toán (BRIEF §4.3):
 * kỳ = sau lần chốt trước → ngày chốt (W ≤ D ≤ T), kèm tổng tiền / số khoản / số ngày.
 */
export default function SettleDialog({ open, onClose, debtorId, today, watermark, onSettled, onRejected }: Props) {
  const [date, setDate] = useState(today);
  const [preview, setPreview] = useState<SettlePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(today);
    setError(null);
  }, [open, today]);

  useEffect(() => {
    if (!open || !date) return;
    let cancelled = false;
    setLoading(true);

    apiFetch<SettlePreview>(`/api/debtors/${debtorId}/settle?periodEnd=${encodeURIComponent(date)}`).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok || !result.data) {
        setPreview(null);
        setError(result.message ?? 'Không tính được kỳ chốt');
        return;
      }
      setPreview(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [open, date, debtorId]);

  async function confirm() {
    if (!preview?.ok) return;
    setSaving(true);
    setError(null);

    const result = await apiFetch<{ settlement: { amount: number } }>(`/api/debtors/${debtorId}/settle`, {
      method: 'POST',
      body: JSON.stringify({ periodEnd: date, expectedWatermark: watermark ?? '' }),
    });
    setSaving(false);

    if (!result.ok) {
      if (result.code === 'STALE_WATERMARK') {
        onRejected(result.message ?? 'Sổ đã thay đổi, vui lòng tải lại');
        onClose();
        return;
      }
      setError(result.message ?? 'Không chốt được');
      return;
    }

    onSettled();
    onClose();
  }

  const periodLabel = watermark ? `sau ${formatDateVn(watermark)}` : 'từ đầu sổ';

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Chốt đã thanh toán</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            Không xoá khoản nào. Sau khi chốt, &ldquo;chưa thanh toán&rdquo; chỉ còn các khoản <strong>sau</strong> ngày chốt.
          </Alert>

          <TextField
            label="Ngày chốt"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: watermark ? nextDay(watermark) : undefined, max: today },
            }}
            helperText={`Kỳ tính: ${periodLabel} → ${formatDateVn(date)}`}
            fullWidth
          />

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              bgcolor: 'action.hover',
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Đang tính kỳ…
                </Typography>
              </Stack>
            ) : preview?.ok ? (
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Số khoản
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {preview.entryCount}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Số ngày
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {preview.dayCount}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ pt: 0.5 }}>
                  <Typography variant="subtitle2">Tổng kỳ</Typography>
                  <MoneyText variant="h6" amount={preview.amount} suffix="₫" />
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {preview?.message ?? 'Chọn ngày để xem kỳ chốt'}
              </Typography>
            )}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={confirm} disabled={saving || loading || !preview?.ok}>
          {saving ? 'Đang chốt…' : 'Xác nhận chốt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
