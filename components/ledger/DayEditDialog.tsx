'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { DateField } from '@/components/ui/DateField';
import { statusToggleGroupSx } from '@/components/ui/softBlock';
import { apiFetch } from '@/lib/client-api';
import { formatDateVn } from '@/lib/format';
import type { EntryJson, EntryType } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  debtorId: string;
  /** Ngày đang sửa (khoá nhóm). */
  date: string;
  /** Các khoản đang nằm trong ngày đó. */
  entries: EntryJson[];
  today: string;
  onSaved: (message: string) => void;
};

/**
 * Sửa ở cấp NGÀY: dời cả ngày sang ngày khác, và khi ngày chỉ có một khoản thì
 * đổi được loại (một ngày ↔ khoảng ngày).
 */
export default function DayEditDialog({ open, onClose, debtorId, date, entries, today, onSaved }: Props) {
  const single = entries.length === 1;
  const only = entries[0];

  const [toDate, setToDate] = useState(date);
  const [mode, setMode] = useState<EntryType>('single');
  const [startDate, setStartDate] = useState(date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setToDate(date);
    setMode(only?.entryType === 'range' ? 'range' : 'single');
    setStartDate(only?.startDate ?? date);
    setError(null);
  }, [open, date, only]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!toDate) return setError('Chọn ngày mới');
    if (toDate > today) return setError('Không được chọn ngày ở tương lai');
    if (single && mode === 'range') {
      if (!startDate) return setError('Chọn ngày bắt đầu của khoảng');
      if (startDate > toDate) return setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
    }

    const body: Record<string, unknown> = { fromDate: date, toDate };
    if (single) {
      body.entryType = mode;
      body.startDate = mode === 'range' ? startDate : null;
    }

    setSaving(true);
    const result = await apiFetch<{ moved: number }>(`/api/debtors/${debtorId}/entries/day`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? 'Không sửa được ngày này');
      return;
    }

    onSaved(
      date === toDate
        ? 'Đã cập nhật ngày'
        : `Đã dời ${result.data?.moved ?? entries.length} khoản sang ${formatDateVn(toDate)}`,
    );
    onClose();
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>Sửa ngày {formatDateVn(date)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <DateField
            label="Chuyển sang ngày"
            value={toDate}
            onChange={setToDate}
            max={today}
            fullWidth
            required
          />

          {single ? (
            <>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={mode}
                onChange={(_event, next: EntryType | null) => {
                  if (next) setMode(next);
                }}
                aria-label="Loại khoản"
                sx={statusToggleGroupSx}
              >
                <ToggleButton value="single">Một ngày</ToggleButton>
                <ToggleButton value="range">Khoảng ngày</ToggleButton>
              </ToggleButtonGroup>

              {mode === 'range' && (
                <DateField
                  label="Ngày bắt đầu khoảng"
                  value={startDate}
                  onChange={setStartDate}
                  max={toDate}
                  fullWidth
                  required
                />
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Ngày này có {entries.length} khoản nên chỉ dời được ngày; muốn đổi loại hay số lượng thì sửa từng khoản.
            </Typography>
          )}

          <Alert severity="info" icon={false}>
            {date === toDate ? (
              <>Ngày giữ nguyên {formatDateVn(date)}.</>
            ) : (
              <>
                {entries.length} khoản của {formatDateVn(date)} sẽ chuyển sang{' '}
                <strong>{formatDateVn(toDate)}</strong>.
              </>
            )}
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
