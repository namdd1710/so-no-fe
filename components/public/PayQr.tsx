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
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import AmountField from '@/components/ledger/AmountField';
import { formatVnd } from '@/lib/format';

type Payment = {
  provider: string;
  debtorName: string;
  phone: string;
  name: string | null;
  /** 'emvco' = QR đã có sẵn số tiền; 'link' = QR mở trang chuyển tiền MoMo. */
  mode: 'emvco' | 'link';
  payload: string;
  memo: string;
  amount: number;
  qrDataUrl: string;
};

type Props = { code: string; amount: number };

/**
 * Khối "Chuyển khoản MoMo" ở trang công khai: mã QR lấy từ BE + nút tự báo đã
 * chuyển khoản. Việc báo chỉ tạo lời khai chờ chủ nợ kiểm tra, không tự trừ nợ.
 */
export default function PayQr({ code, amount }: Props) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(amount > 0);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [sentNote, setSentNote] = useState<string | null>(null);

  useEffect(() => {
    if (amount <= 0) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetch(`/api/public/${encodeURIComponent(code)}/payment`, { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, data: await response.json().catch(() => null) }))
      .then(({ ok, data }) => {
        if (!alive) return;
        if (!ok || !data?.qrDataUrl) {
          setError(data?.error?.message ?? 'Không lấy được mã QR');
          return;
        }
        setPayment(data as Payment);
      })
      .catch(() => {
        if (alive) setError('Không kết nối được máy chủ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [code, amount]);

  function openDeclare() {
    setDigits(String(payment?.amount ?? amount));
    setNote(payment?.memo ?? '');
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
    setSentNote('Đã ghi nhận. Chủ nợ sẽ kiểm tra và xác nhận — bạn không cần làm gì thêm.');
  }

  if (amount <= 0) return null;

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: { xs: 1.75, sm: 2 } }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
        Chuyển khoản MoMo
      </Typography>

      {loading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Đang tạo mã QR…
          </Typography>
        </Stack>
      )}

      {!loading && error && !payment && <Alert severity="warning">{error}</Alert>}

      {payment && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'center', sm: 'flex-start' }}>
          <Box
            component="img"
            src={payment.qrDataUrl}
            alt="Mã QR chuyển khoản MoMo"
            sx={{ width: 168, height: 168, borderRadius: 1, border: 1, borderColor: 'divider', bgcolor: '#fff' }}
          />
          <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
            <Typography variant="caption" color="text.secondary">
              Số tiền
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary">
              {formatVnd(payment.amount)}₫
            </Typography>
            <Typography variant="body2">
              MoMo: <strong>{payment.phone}</strong>
              {payment.name ? ` · ${payment.name}` : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nội dung: {payment.memo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {payment.mode === 'emvco'
                ? 'Quét mã bằng MoMo hoặc app ngân hàng: số tiền và nội dung đã điền sẵn.'
                : 'Quét mã để mở trang chuyển tiền MoMo tới số này rồi nhập số tiền ở trên.'}
            </Typography>
          </Stack>
        </Stack>
      )}

      {sentNote ? (
        <Alert severity="success" sx={{ mt: 1.5 }}>
          {sentNote}
        </Alert>
      ) : (
        <Button variant="outlined" onClick={openDeclare} disabled={!payment} sx={{ mt: 1.5 }}>
          Tôi đã chuyển khoản
        </Button>
      )}

      <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
        <DialogTitle>Báo đã chuyển khoản</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Chủ nợ sẽ đối chiếu sao kê rồi xác nhận. Sổ chỉ được trừ khi chủ nợ chốt kỳ.
            </Typography>
            <AmountField
              label="Số tiền đã chuyển"
              value={digits}
              onChange={setDigits}
              required
            />
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
