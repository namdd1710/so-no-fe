'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { formatDateVn, formatDateTimeVn, formatVnd } from '@/lib/format';
import type { ConfirmationJson } from '@/lib/types';

/** Ảnh QR nhận tiền MoMo đặt sẵn trong `public/`. */
const QR_SRC = '/qr-momo.jpg';
const RECEIVER_NAME = 'DO DUC NAM';
const RECEIVER_PHONE = '0352611710';

type Props = {
  code: string;
  amount: number;
  /** Ngày đã chốt gần nhất — mốc bắt đầu của kỳ đang nợ. */
  fromDate?: string | null;
  /** Hôm nay — mốc kết thúc của kỳ đang nợ. */
  toDate: string;
  /** Lời báo trước đây (kèm phản hồi của chủ nợ) — server render sẵn. */
  confirmations?: ConfirmationJson[];
};

function statusChip(item: ConfirmationJson) {
  if (item.status === 'confirmed') return <Chip size="small" color="success" label="Chủ nợ đã xác nhận" />;
  if (item.status === 'rejected') return <Chip size="small" color="default" label="Chủ nợ chưa thấy khoản này" />;
  return <Chip size="small" color="warning" label="Chờ chủ nợ kiểm tra" />;
}

/**
 * Khối thanh toán MoMo ở trang công khai, tách hẳn khỏi nút "Đã thanh toán":
 * bấm lấy QR → hiện ảnh QR → ô bình luận → gửi lời báo; chủ nợ xác nhận kèm
 * phản hồi và con nợ đọc lại được ngay dưới đây.
 */
export default function PayQr({ code, amount, fromDate, toDate, confirmations = [] }: Props) {
  const [showQr, setShowQr] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<ConfirmationJson[]>([]);
  const [imageError, setImageError] = useState(false);

  // Nội dung chuyển khoản nói rõ trả nợ cho kỳ nào, thay vì mã sổ.
  const memo = fromDate
    ? `TRA NO TU ${formatDateVn(fromDate)} DEN ${formatDateVn(toDate)}`
    : `TRA NO DEN ${formatDateVn(toDate)}`;
  const history = [...sent, ...confirmations];

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    const response = await fetch(`/api/public/${encodeURIComponent(code)}/confirmations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note }),
    });
    const data = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setError(data?.error?.message ?? 'Không gửi được xác nhận');
      return;
    }

    setError(null);
    setNote('');
    setSent((prev) => [
      {
        id: data?.id ?? `local-${Date.now()}`,
        amount,
        note,
        status: 'pending',
        reply: '',
        declaredAt: data?.declaredAt ?? new Date().toISOString(),
        resolvedAt: null,
      },
      ...prev,
    ]);
  }

  if (amount <= 0) return null;

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: { xs: 1.75, sm: 2 } }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
        Chuyển khoản MoMo
      </Typography>

      {!showQr ? (
        <Stack spacing={1} alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">
            Quét mã để chuyển {formatVnd(amount)}₫ tới ví MoMo của chủ nợ.
          </Typography>
          <Button variant="contained" onClick={() => setShowQr(true)}>
            Lấy mã QR
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            {imageError ? (
              <Alert severity="warning" sx={{ flex: 1 }}>
                Chưa tìm thấy ảnh QR (cần file <code>public/qr-momo.jpg</code>). Bạn vẫn có thể chuyển tới số MoMo bên
                cạnh.
              </Alert>
            ) : (
              <Box
                component="img"
                src={QR_SRC}
                alt="Mã QR nhận tiền MoMo"
                onError={() => setImageError(true)}
                sx={{
                  width: { xs: '100%', sm: 232 },
                  maxWidth: 300,
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
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                Nội dung: {memo}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quét mã bằng app MoMo hoặc app ngân hàng, nhập đúng số tiền và nội dung ở trên.
              </Typography>
            </Stack>
          </Stack>

          <Box component="form" onSubmit={submit}>
            <Stack spacing={1.5}>
              <TextField
                label="Bình luận cho chủ nợ"
                placeholder="Ví dụ: mình chuyển lúc 20h, nội dung TRẢ NỢ…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                multiline
                minRows={2}
                maxRows={5}
                fullWidth
                slotProps={{ htmlInput: { maxLength: 200 } }}
                helperText={`${note.length}/200`}
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: 'flex-start' }}>
                {saving ? 'Đang gửi…' : 'Xác nhận đã chuyển khoản'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}

      {history.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Lời báo của bạn
          </Typography>
          {history.map((item) => (
            <Box key={item.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" fontWeight={600}>
                  {formatVnd(item.amount)}₫
                </Typography>
                {statusChip(item)}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDateTimeVn(item.declaredAt)}
              </Typography>
              {item.note && (
                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                  “{item.note}”
                </Typography>
              )}
              {item.reply && (
                <Typography variant="body2" sx={{ mt: 0.5, color: 'primary.main', wordBreak: 'break-word' }}>
                  Chủ nợ: {item.reply}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
