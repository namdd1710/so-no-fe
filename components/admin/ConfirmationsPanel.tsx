'use client';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import MoneyText from '@/components/ledger/MoneyText';
import { apiFetch } from '@/lib/client-api';
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import type { ConfirmationJson } from '@/lib/types';

type Props = {
  debtorId: string;
  items: ConfirmationJson[];
  onChanged: () => void;
  notify: (message: string, severity?: 'success' | 'error' | 'info') => void;
};

type Target = { item: ConfirmationJson; status: 'confirmed' | 'rejected' };

/**
 * Con nợ tự báo "đã chuyển khoản" ở trang công khai; đây là chỗ chủ nợ đối
 * chiếu, viết phản hồi (con nợ đọc được) và đánh dấu đã nhận / bỏ qua. Không
 * tự trừ nợ — chốt kỳ vẫn là thao tác riêng.
 */
export default function ConfirmationsPanel({ debtorId, items, onChanged, notify }: Props) {
  const [target, setTarget] = useState<Target | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = items.filter((item) => item.status === 'pending');

  function open(item: ConfirmationJson, status: Target['status']) {
    setTarget({ item, status });
    setReply(status === 'confirmed' ? '' : '');
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!target) return;

    setBusy(true);
    const result = await apiFetch(`/api/debtors/${debtorId}/confirmations/${target.item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: target.status, reply }),
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message ?? 'Không cập nhật được');
      return;
    }
    notify(target.status === 'confirmed' ? 'Đã đánh dấu nhận tiền' : 'Đã bỏ qua lời báo này');
    setTarget(null);
    onChanged();
  }

  if (pending.length === 0) return null;

  return (
    <Stack spacing={1.25}>
      <Alert severity="info" icon={false}>
        Con nợ báo đã chuyển khoản {pending.length} lần — kiểm tra sao kê rồi xác nhận. Phản hồi bạn viết sẽ hiện ở
        trang của con nợ. Muốn trừ nợ hãy bấm <strong>Chốt</strong>.
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
                “{item.note}”
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={() => open(item, 'confirmed')}
            >
              Đã nhận
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<CloseIcon />}
              onClick={() => open(item, 'rejected')}
            >
              Bỏ qua
            </Button>
          </Stack>
        </Stack>
      ))}

      <Dialog
        open={Boolean(target)}
        onClose={busy ? undefined : () => setTarget(null)}
        fullWidth
        maxWidth="xs"
        component="form"
        onSubmit={submit}
      >
        <DialogTitle>{target?.status === 'confirmed' ? 'Xác nhận đã nhận tiền' : 'Bỏ qua lời báo này'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {target ? `Con nợ báo ${formatVnd(target.item.amount)}₫ lúc ${formatDateTimeVn(target.item.declaredAt)}.` : ''}
              {target?.status === 'confirmed'
                ? ' Phản hồi bên dưới sẽ hiện ở trang của con nợ.'
                : ' Bạn có thể ghi lý do để con nợ hiểu vì sao chưa thấy khoản này.'}
            </Typography>

            <TextField
              label={target?.status === 'confirmed' ? 'Phản hồi (không bắt buộc)' : 'Lý do (không bắt buộc)'}
              placeholder={target?.status === 'confirmed' ? 'Ví dụ: đã nhận đủ, cảm ơn' : 'Ví dụ: chưa thấy giao dịch này'}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              multiline
              minRows={2}
              maxRows={5}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 300 } }}
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTarget(null)} disabled={busy}>
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={target?.status === 'confirmed' ? 'success' : 'primary'}
            disabled={busy}
          >
            {busy ? 'Đang lưu…' : target?.status === 'confirmed' ? 'Xác nhận đã nhận' : 'Bỏ qua'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
