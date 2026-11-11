'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-api';
import type { DebtorSummary } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  /** null = thêm mới. */
  debtor: DebtorSummary | null;
  onSaved: (message: string, debtorId?: string) => void;
};

export default function DebtorDialog({ open, onClose, debtor, onSaved }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(debtor?.name ?? '');
    setPhone(debtor?.phone ?? '');
    setNote(debtor?.note ?? '');
    setError(null);
  }, [open, debtor]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Tên con nợ không được để trống');

    setSaving(true);
    const payload = { name: name.trim(), phone: phone.trim(), note: note.trim() };
    const result = debtor
      ? await apiFetch<{ debtor: DebtorSummary }>(`/api/debtors/${debtor.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await apiFetch<{ debtor: DebtorSummary }>('/api/debtors', { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? 'Không lưu được');
      return;
    }

    onSaved(debtor ? 'Đã cập nhật con nợ' : 'Đã tạo sổ nợ mới', result.data?.debtor?.id);
    onClose();
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>{debtor ? 'Sửa con nợ' : 'Thêm con nợ'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Tên"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoFocus
            fullWidth
            inputProps={{ maxLength: 80 }}
          />
          <TextField
            label="Số điện thoại"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputProps={{ maxLength: 30, inputMode: 'tel' }}
            helperText="Không hiển thị ở trang công khai"
            fullWidth
          />
          <TextField
            label="Ghi chú nội bộ"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 500 }}
            helperText="Chỉ admin thấy"
            fullWidth
          />
          {!debtor && (
            <Alert severity="info" icon={false}>
              Hệ thống sẽ tự sinh <strong>một link cố định</strong> cho con nợ này. Link không đổi và không thể cấp lại.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Huỷ
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
