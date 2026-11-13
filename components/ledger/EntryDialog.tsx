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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import AmountField from './AmountField';
import { statusToggleGroupSx } from '@/components/ui/softBlock';
import { apiFetch } from '@/lib/client-api';
import { formatDateVn, formatVnd } from '@/lib/format';
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

type Mode = 'single' | 'range';

/** POST trả thêm `createdCount` khi thêm theo khoảng ngày. */
type SaveResponse = { entry: EntryJson; createdCount?: number };

/** Số ngày trong [from, to], tính cả hai đầu (lịch UTC cho khỏi lệch múi giờ). */
function rangeDays(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

export default function EntryDialog({ open, onClose, debtorId, entry, categories, today, onSaved }: Props) {
  const editing = Boolean(entry);
  const [mode, setMode] = useState<Mode>('single');
  const [date, setDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [category, setCategory] = useState('');
  const [digits, setDigits] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [negative, setNegative] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode('single');
    setDate(entry?.date ?? today);
    setFromDate(entry?.date ?? today);
    setToDate(entry?.date ?? today);
    setCategory(entry?.category ?? '');
    // Đơn giá hiển thị riêng; khoản cũ (chưa có unitAmount) thì lấy tổng.
    setDigits(entry ? String(Math.abs(entry.unitAmount ?? entry.amount)) : '');
    setQuantity(String(entry?.quantity ?? 1));
    setNegative((entry?.amount ?? 0) < 0);
    setNote(entry?.note ?? '');
    setError(null);
  }, [open, entry, today]);

  const unitAmount = (Number(digits) || 0) * (negative ? -1 : 1);
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const perDay = unitAmount * qty;

  const days = useMemo(() => (mode === 'range' ? rangeDays(fromDate, toDate) : 1), [mode, fromDate, toDate]);
  const total = perDay * (days > 0 ? days : 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === 'single') {
      if (!date) return setError('Chọn ngày phát sinh');
      if (date > today) return setError('Không được nhập ngày ở tương lai');
    } else {
      if (!fromDate || !toDate) return setError('Chọn đủ ngày bắt đầu và ngày kết thúc');
      if (fromDate > toDate) return setError('Ngày bắt đầu phải trước ngày kết thúc');
      if (toDate > today) return setError('Không được nhập ngày ở tương lai');
      if (days > 366) return setError('Mỗi lần chỉ thêm được tối đa 366 ngày');
    }

    if (!category.trim()) return setError('Nhập danh mục');
    if (!digits || Number(digits) === 0) return setError('Nhập đơn giá khác 0');
    if (!Number.isInteger(Number(quantity)) || qty < 1 || qty > 1000) {
      return setError('Số lượng phải là số nguyên từ 1 đến 1000');
    }

    const base = { category: category.trim(), unitAmount, quantity: qty, note: note.trim() };
    const payload = mode === 'range' ? { ...base, fromDate, toDate } : { ...base, date };

    setSaving(true);
    const result = entry
      ? await apiFetch<SaveResponse>(`/api/entries/${entry.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await apiFetch<SaveResponse>(`/api/debtors/${debtorId}/entries`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? 'Không lưu được khoản này');
      return;
    }

    if (entry) onSaved('Đã cập nhật khoản');
    else if ((result.data?.createdCount ?? 1) > 1) onSaved(`Đã thêm ${result.data?.createdCount} khoản`);
    else onSaved('Đã thêm khoản');
    onClose();
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>{editing ? 'Sửa khoản' : 'Thêm khoản'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {!editing && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(_event, next: Mode | null) => {
                if (next) setMode(next);
              }}
              aria-label="Thêm một ngày hay nhiều ngày"
              sx={statusToggleGroupSx}
            >
              <ToggleButton value="single">Một ngày</ToggleButton>
              <ToggleButton value="range">Khoảng ngày</ToggleButton>
            </ToggleButtonGroup>
          )}

          {mode === 'single' ? (
            <TextField
              label="Ngày"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
              fullWidth
              required
            />
          ) : (
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Từ ngày"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
                fullWidth
                required
              />
              <TextField
                label="Đến ngày"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
                fullWidth
                required
              />
            </Stack>
          )}

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

          <Stack direction="row" spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <AmountField value={digits} onChange={setDigits} label="Đơn giá" required error={undefined} />
            </Box>
            <TextField
              label="Số lượng"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              slotProps={{ htmlInput: { min: 1, max: 1000, inputMode: 'numeric' } }}
              sx={{ width: 120 }}
              helperText="×1 giá"
            />
          </Stack>

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
            {mode === 'range' ? (
              <>
                {days > 0 ? `${days} ngày` : 'Khoảng ngày không hợp lệ'} · mỗi ngày{' '}
                <strong>{formatVnd(perDay)}₫</strong>
                <br />
                Tổng sẽ ghi: <strong>{formatVnd(total)}₫</strong> ({formatDateVn(fromDate)} → {formatDateVn(toDate)})
              </>
            ) : (
              <>
                Sẽ ghi: <strong>{formatVnd(perDay)}₫</strong>
                {qty > 1 && <> ({formatVnd(unitAmount)}₫ × {qty})</>} ngày {formatDateVn(date)}
              </>
            )}
          </Alert>

          {mode === 'range' && (
            <Typography variant="caption" color="text.secondary">
              Mỗi ngày trong khoảng sẽ thành một khoản riêng, sửa/xoá được từng khoản sau khi thêm.
            </Typography>
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
