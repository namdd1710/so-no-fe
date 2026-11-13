'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
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
  /** Ngày gợi ý khi thêm mới (nút + trong một ngày cụ thể). */
  initialDate?: string;
};

type Mode = 'single' | 'range';

/** POST trả thêm `createdCount` khi thêm nhiều khoản. */
type SaveResponse = { entry: EntryJson; createdCount?: number };

/** Một dòng nhập trong dialog — mỗi dòng thành một khoản. */
type Row = {
  key: string;
  category: string;
  /** Đơn giá, chuỗi chữ số. */
  digits: string;
  quantity: string;
  negative: boolean;
  note: string;
};

let rowSeq = 0;

function emptyRow(): Row {
  rowSeq += 1;
  return { key: `row-${rowSeq}`, category: '', digits: '', quantity: '1', negative: false, note: '' };
}

/** Số ngày trong [from, to], tính cả hai đầu (lịch UTC cho khỏi lệch múi giờ). */
function rangeDays(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

function unitOf(row: Row): number {
  return (Number(row.digits) || 0) * (row.negative ? -1 : 1);
}

function qtyOf(row: Row): number {
  return Math.max(1, Math.floor(Number(row.quantity) || 1));
}

function amountOf(row: Row): number {
  return unitOf(row) * qtyOf(row);
}

export default function EntryDialog({
  open,
  onClose,
  debtorId,
  entry,
  categories,
  today,
  onSaved,
  initialDate,
}: Props) {
  const editing = Boolean(entry);
  const [mode, setMode] = useState<Mode>('single');
  const [date, setDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Khoản đang gắn khoảng thì mở lại đúng chế độ khoảng để sửa được cả hai đầu.
    setMode(entry?.startDate ? 'range' : 'single');
    setDate(entry?.date ?? initialDate ?? today);
    setFromDate(entry?.startDate ?? entry?.date ?? today);
    setToDate(entry?.date ?? today);
    setRows([
      entry
        ? {
            ...emptyRow(),
            category: entry.category,
            // Đơn giá hiển thị riêng; khoản cũ (chưa có unitAmount) thì lấy tổng.
            digits: String(Math.abs(entry.unitAmount ?? entry.amount)),
            quantity: String(entry.quantity ?? 1),
            negative: entry.amount < 0,
            note: entry.note ?? '',
          }
        : emptyRow(),
    ]);
    setError(null);
  }, [open, entry, today, initialDate]);

  // Khoảng ngày chỉ để mô tả phạm vi — vẫn MỘT bản ghi cho mỗi khoản.
  const days = useMemo(() => (mode === 'range' ? rangeDays(fromDate, toDate) : 1), [mode, fromDate, toDate]);
  const total = rows.reduce((sum, row) => sum + amountOf(row), 0);

  function patchRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.key !== key)));
  }

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

    for (const [index, row] of rows.entries()) {
      const label = rows.length > 1 ? `Khoản ${index + 1}: ` : '';
      if (!row.category.trim()) return setError(`${label}nhập danh mục`);
      if (!row.digits || Number(row.digits) === 0) return setError(`${label}nhập đơn giá khác 0`);
      if (!Number.isInteger(Number(row.quantity)) || qtyOf(row) < 1 || qtyOf(row) > 1000) {
        return setError(`${label}số lượng phải là số nguyên từ 1 đến 1000`);
      }
    }

    const items = rows.map((row) => ({
      category: row.category.trim(),
      unitAmount: unitOf(row),
      quantity: qtyOf(row),
      note: row.note.trim(),
    }));

    setSaving(true);
    const result = entry
      ? await apiFetch<SaveResponse>(`/api/entries/${entry.id}`, {
          method: 'PATCH',
          body: JSON.stringify(
            mode === 'range'
              ? // Sửa: ngày kết thúc nằm ở `date`, ngày bắt đầu ở `startDate`.
                { ...items[0], date: toDate, startDate: fromDate }
              : { ...items[0], date, startDate: null },
          ),
        })
      : await apiFetch<SaveResponse>(`/api/debtors/${debtorId}/entries`, {
          method: 'POST',
          body: JSON.stringify(mode === 'range' ? { fromDate, toDate, items } : { date, items }),
        });
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? 'Không lưu được khoản này');
      return;
    }

    const created = result.data?.createdCount ?? 1;
    if (entry) onSaved('Đã cập nhật khoản');
    else if (created > 1) onSaved(`Đã thêm ${created} khoản`);
    else onSaved('Đã thêm khoản');
    onClose();
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" component="form" onSubmit={submit}>
      <DialogTitle>{editing ? 'Sửa khoản' : 'Thêm khoản'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

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

          {/* ---------- Danh sách khoản ---------- */}
          <Stack spacing={2}>
            {rows.map((row, index) => (
              <Box
                key={row.key}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" color="text.secondary">
                      {rows.length > 1 ? `Khoản ${index + 1}` : 'Khoản'}
                    </Typography>
                    {!editing && rows.length > 1 && (
                      <Tooltip title="Bỏ dòng này">
                        <IconButton
                          size="small"
                          aria-label={`Bỏ khoản ${index + 1}`}
                          onClick={() => removeRow(row.key)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  <Autocomplete
                    freeSolo
                    options={categories}
                    value={row.category}
                    onChange={(_, value) => patchRow(row.key, { category: value ?? '' })}
                    onInputChange={(_, value) => patchRow(row.key, { category: value })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Danh mục"
                        placeholder="Mua cơm, mua thuốc…"
                        required
                        size="small"
                      />
                    )}
                  />

                  <Stack direction="row" spacing={1.5}>
                    <Box sx={{ flex: 1 }}>
                      <AmountField
                        value={row.digits}
                        onChange={(digits) => patchRow(row.key, { digits })}
                        label="Đơn giá"
                        required
                        error={undefined}
                      />
                    </Box>
                    <TextField
                      label="Số lượng"
                      type="number"
                      value={row.quantity}
                      onChange={(event) => patchRow(row.key, { quantity: event.target.value })}
                      slotProps={{ htmlInput: { min: 1, max: 1000, inputMode: 'numeric' } }}
                      sx={{ width: 110 }}
                    />
                  </Stack>

                  <TextField
                    label="Ghi chú"
                    value={row.note}
                    onChange={(event) => patchRow(row.key, { note: event.target.value })}
                    size="small"
                    inputProps={{ maxLength: 500 }}
                    fullWidth
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={row.negative}
                        onChange={(event) => patchRow(row.key, { negative: event.target.checked })}
                      />
                    }
                    label="Khoản giảm nợ (trả trước)"
                  />
                </Stack>
              </Box>
            ))}
          </Stack>

          {!editing && (
            <Button startIcon={<AddIcon />} onClick={addRow} sx={{ alignSelf: 'flex-start' }}>
              Thêm khoản khác
            </Button>
          )}

          <Alert severity={rows.some((row) => row.negative) ? 'warning' : 'info'} icon={false}>
            {mode === 'range' ? (
              <>
                {rows.length > 1 ? `${rows.length} khoản` : 'Một khoản'} cho khoảng {formatDateVn(fromDate)} →{' '}
                {formatDateVn(toDate)}
                {days > 0 ? ` (${days} ngày)` : ''}
                <br />
                Tổng sẽ ghi: <strong>{formatVnd(total)}₫</strong>
              </>
            ) : (
              <>
                {rows.length > 1 ? `${rows.length} khoản` : 'Sẽ ghi'}: <strong>{formatVnd(total)}₫</strong> ngày{' '}
                {formatDateVn(date)}
              </>
            )}
          </Alert>

          {mode === 'range' && (
            <Typography variant="caption" color="text.secondary">
              Mỗi khoản là một bản ghi phủ cả khoảng, ghi vào ngày kết thúc. Muốn thêm khoản riêng cho một ngày trong
              khoảng thì thêm một khoản &quot;Một ngày&quot; với đúng ngày đó.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Huỷ
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Đang lưu…' : rows.length > 1 && !editing ? `Lưu ${rows.length} khoản` : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
