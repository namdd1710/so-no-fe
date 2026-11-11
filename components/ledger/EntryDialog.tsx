'use client';

import Autocomplete from '@mui/material/Autocomplete';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import AmountField from './AmountField';
import { apiFetch } from '@/lib/client-api';
import { formatVnd } from '@/lib/format';
import type { EntryJson } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  debtorId: string;
  /** null = thêm mới, có giá trị = sửa. */
  entry: EntryJson | null;
  categories: string[];
  today: string;
  onSaved: (message: string) => void;
};

export default function EntryDialog({ open, onClose, debtorId, entry, categories, today, onSaved }: Props) {
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState('');
  const [digits, setDigits] = useState('');
  const [negative, setNegative] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(entry?.date ?? today);
    setCategory(entry?.category ?? '');
    setDigits(entry ? String(Math.abs(entry.amount)) : '');
    setNegative((entry?.amount ?? 0) < 0);
    setNote(entry?.note ?? '');
    setError(null);
  }, [open, entry, today]);

  const amount = (Number(digits) || 0) * (negative ? -1 : 1);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!date) return setError('Chọn ngày phát sinh');
    if (date > today) return setError('Không được nhập ngày ở tương lai');
    if (!category.trim()) return setError('Nhập danh mục');
    if (!digits || Number(digits) === 0) return setError('Nhập số tiền khác 0');

    setSaving(true);
    const payload = { date, category: category.trim(), amount, note: note.trim() };
    const result = entry
      ? await apiFetch<{ entry: EntryJson }>(`/api/entries/${entry.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await apiFetch<{ entry: EntryJson }>(`/api/debtors/${debtorId}/entries`, { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? 'Không lưu được khoản này');
      return;
    }

    onSaved(entry ? 'Đã cập nhật khoản' : 'Đã thêm khoản');
    onClose();
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>{entry ? 'Sửa khoản' : 'Thêm khoản'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Ngày"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
            fullWidth
            required
          />

          <Autocomplete
            freeSolo
            options={categories}
            value={category}
            onChange={(_, value) => setCategory(value ?? '')}
            onInputChange={(_, value) => setCategory(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Danh mục"
                placeholder="Mua cơm, mua thuốc…"
                required
                helperText="Chọn danh mục đã dùng hoặc gõ danh mục mới"
              />
            )}
          />

          <Box>
            <AmountField value={digits} onChange={setDigits} required error={undefined} />
          </Box>

          <FormControlLabel
            control={<Checkbox checked={negative} onChange={(event) => setNegative(event.target.checked)} />}
            label="Khoản giảm nợ (trả trước)"
          />

          <TextField
            label="Ghi chú"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 500 }}
            fullWidth
          />

          <Alert severity={negative ? 'warning' : 'info'} icon={false}>
            Sẽ ghi: <strong>{formatVnd(amount)}₫</strong> ngày {date.split('-').reverse().join('/')}
          </Alert>
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
