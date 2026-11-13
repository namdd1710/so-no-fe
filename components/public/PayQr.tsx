'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import AmountField from '@/components/ledger/AmountField';
import { formatVnd } from '@/lib/format';

/** Ảnh QR nhận tiền MoMo đặt sẵn trong `public/`. */
const QR_SRC = '/momo-qr.png';
const RECEIVER_NAME = 'DO DUC NAM';
const RECEIVER_PHONE = '0352611710';

type Props = { code: string; amount: number };

/**
 * Khối "Chuyển khoản MoMo": ảnh QR có sẵn của chủ nợ + nút tự báo đã chuyển
 * khoản. Việc báo chỉ tạo lời khai chờ chủ nợ kiểm tra, không tự trừ nợ.
 */
export default function PayQr({ code, amount }: Props) {
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [imageError, setImageError] = useState(false);

  const memo = `SO NO ${code}`;

  function openDeclare() {
    setDigits(String(amount));
    setNote(memo);
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(digits);
    if (!value || value <= 0) return setError('Nhập số tiền đã chuyển');

    setSaving(true);
    const response = await fetch(`/api/public/${encodeURIComponent(code)}/confirmations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: value, note }),
    });
    const data = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setError(data?.error?.message ?? 'Không gửi được xác nhận');
      return;
    }
    setOpen(false);
    setSent(true);
  }

  if (amount <= 0) return null;

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: { xs: 1.75, sm: 2 } }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
        Chuyển khoản MoMo
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'center', sm: 'flex-start' }}>
        {imageError ? (
          <Alert severity="warning" sx={{ flex: 1 }}>
            Chưa tìm thấy ảnh QR (cần đặt file tại <code>public/momo-qr.png</code>). Bạn vẫn có thể chuyển tới số MoMo
            bên cạnh.
          </Alert>
        ) : (
          <Box
            component="img"
            src={QR_SRC}
            alt="Mã QR nhận tiền MoMo"
            onError={() => setImageError(true)}
            sx={{
              width: { xs: 200, sm: 176 },
              height: 'auto',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: '#fff',
            }}
          />
        )}

        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Typography variant="caption" color="text.secondary">
            Số tiền cần trả
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary">
            {formatVnd(amount)}₫
          </Typography>
          <Typography variant="body2">
            MoMo: <strong>{RECEIVER_PHONE}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {RECEIVER_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nội dung: {memo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Mở app MoMo hoặc app ngân hàng, quét mã rồi nhập số tiền và nội dung như trên.
          </Typography>
        </Stack>
      </Stack>

      {sent ? (
        <Alert severity="success" sx={{ mt: 1.5 }}>
          Đã ghi nhận. Chủ nợ sẽ kiểm tra và xác nhận — bạn không cần làm gì thêm.
        </Alert>
      ) : (
        <Button variant="outlined" onClick={openDeclare} sx={{ mt: 1.5 }}>
          Tôi đã chuyển khoản
        </Button>
      )}

      <Dialog
        open={open}
        onClose={saving ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="xs"
        component="form"
        onSubmit={submit}
      >
        <DialogTitle>Báo đã chuyển khoản</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Chủ nợ sẽ đối chiếu sao kê rồi xác nhận. Sổ chỉ được trừ khi chủ nợ chốt kỳ.
            </Typography>
            <AmountField label="Số tiền đã chuyển" value={digits} onChange={setDigits} required />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Lời nhắn (không bắt buộc)
              </Typography>
              <Box
                component="input"
                value={note}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNote(event.target.value)}
                maxLength={200}
                placeholder="Ví dụ: chuyển lúc 20h ngày 13/11"
                sx={{
                  width: '100%',
                  boxSizing: 'border-box',
                  font: 'inherit',
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                }}
              />
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Đang gửi…' : 'Gửi xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
