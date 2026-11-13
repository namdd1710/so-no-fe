'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { formatDateVn, formatMonthVn, todayVn } from '@/lib/format';

/**
 * Ô chọn ngày/tháng tự vẽ bằng MUI.
 *
 * Lý do không dùng `<input type="date">`: popup lịch của trình duyệt là native
 * Chromium, không style được, hiện theo locale máy (thường mm/dd/yyyy) và trông
 * xám xịt lệch hẳn với phần còn lại của app. Ở đây không dùng date library nào —
 * chỉ cộng/trừ bằng UTC cho khỏi lệch múi giờ.
 */

const pad = (value: number) => String(value).padStart(2, '0');

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function toIso(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(day)}`;
}

function parseIso(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Ô trống đầu tháng; tuần bắt đầu Thứ 2. */
function leadingBlanks(year: number, month1: number): number {
  const weekday = new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay(); // 0 = CN
  return (weekday + 6) % 7;
}

const fieldSx = {
  '& .MuiInputBase-input': { cursor: 'pointer' },
} as const;

const popoverPaperSx = {
  p: 1.5,
  mt: 0.5,
  width: 272,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
} as const;

const dayCellSx = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  fontSize: 13,
  fontWeight: 500,
  color: 'text.primary',
  '&:hover': { bgcolor: 'action.hover' },
  '&.Mui-disabled': { color: 'text.disabled', '&:hover': { bgcolor: 'transparent' } },
} as const;

type BaseProps = {
  label: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
};

export type DateFieldProps = BaseProps & {
  /** 'YYYY-MM-DD' hoặc '' (chưa chọn). */
  value: string;
  onChange: (value: string) => void;
  /** Chặn chọn trước ngày này ('YYYY-MM-DD'). */
  min?: string;
  /** Chặn chọn sau ngày này ('YYYY-MM-DD'). */
  max?: string;
  placeholder?: string;
};

export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  size = 'small',
  fullWidth,
  required,
  helperText,
  error,
  disabled,
  sx,
  placeholder = 'dd/mm/yyyy',
}: DateFieldProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const today = todayVn();
  const selected = parseIso(value);
  const format = (year: number, month: number, day: number) => toIso(year, month, day);

  const initial = selected ?? parseIso(today)!;
  const [view, setView] = useState({ year: initial.year, month: initial.month });

  function openPicker(event: React.MouseEvent<HTMLElement>) {
    if (disabled) return;
    const current = parseIso(value) ?? parseIso(today)!;
    setView({ year: current.year, month: current.month });
    setAnchor(event.currentTarget);
  }

  function step(delta: number) {
    const next = new Date(Date.UTC(view.year, view.month - 1 + delta, 1));
    setView({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 });
  }

  const cells = useMemo(() => {
    const blanks = leadingBlanks(view.year, view.month);
    const total = daysInMonth(view.year, view.month);
    const list: (number | null)[] = Array.from({ length: blanks }, () => null);
    for (let day = 1; day <= total; day += 1) list.push(day);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [view]);

  return (
    <>
      <TextField
        label={label}
        value={selected ? formatDateVn(value) : ''}
        placeholder={placeholder}
        onClick={openPicker}
        size={size}
        fullWidth={fullWidth}
        required={required}
        helperText={helperText}
        error={error}
        disabled={disabled}
        sx={{ ...fieldSx, ...sx }}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                {value && !disabled && (
                  <IconButton
                    size="small"
                    aria-label="Xoá ngày"
                    title="Xoá ngày"
                    onClick={(event) => {
                      // Đừng mở lịch khi bấm nút xoá.
                      event.stopPropagation();
                      onChange('');
                    }}
                    edge="end"
                    sx={{ mr: 0.25, color: 'text.secondary' }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <EventOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
          inputLabel: { shrink: true },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: popoverPaperSx } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Button
            size="small"
            aria-label="Tháng trước"
            onClick={() => step(-1)}
            sx={{ minWidth: 28, px: 0.5, color: 'text.secondary' }}
          >
            <ChevronLeftIcon fontSize="small" />
          </Button>
          <Typography variant="subtitle2" fontWeight={600}>
            Tháng {view.month}/{view.year}
          </Typography>
          <Button
            size="small"
            aria-label="Tháng sau"
            onClick={() => step(1)}
            sx={{ minWidth: 28, px: 0.5, color: 'text.secondary' }}
          >
            <ChevronRightIcon fontSize="small" />
          </Button>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
          {WEEKDAYS.map((weekday) => (
            <Typography
              key={weekday}
              variant="caption"
              align="center"
              color="text.secondary"
              sx={{ py: 0.5, fontSize: 11 }}
            >
              {weekday}
            </Typography>
          ))}

          {cells.map((day, index) => {
            if (day === null) return <Box key={`blank-${index}`} />;
            const iso = format(view.year, view.month, day);
            const isSelected = iso === value;
            const isToday = iso === today;
            const outOfRange = (min && iso < min) || (max && iso > max);
            return (
              <ButtonBase
                key={iso}
                disabled={Boolean(outOfRange)}
                onClick={() => {
                  onChange(iso);
                  setAnchor(null);
                }}
                sx={{
                  ...dayCellSx,
                  ...(isToday && !isSelected
                    ? { border: '1px solid', borderColor: 'primary.main', color: 'primary.main' }
                    : null),
                  ...(isSelected ? { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } } : null),
                }}
              >
                {day}
              </ButtonBase>
            );
          })}
        </Box>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button
            size="small"
            onClick={() => {
              if (max && today > max) return;
              if (min && today < min) return;
              onChange(today);
              setAnchor(null);
            }}
          >
            Hôm nay
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              onChange('');
              setAnchor(null);
            }}
            sx={{ color: 'text.secondary' }}
          >
            Xoá
          </Button>
        </Stack>
      </Popover>
    </>
  );
}

export type MonthFieldProps = BaseProps & {
  /** 'YYYY-MM' hoặc '' (chưa chọn). */
  value: string;
  onChange: (value: string) => void;
};

/** Ô chọn tháng (dùng cho lọc "Xem theo tháng"). */
export function MonthField({
  label,
  value,
  onChange,
  size = 'small',
  fullWidth,
  required,
  helperText,
  error,
  disabled,
  sx,
}: MonthFieldProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const today = todayVn();
  const selected = /^\d{4}-\d{2}$/.test(value) ? value : '';
  const [viewYear, setViewYear] = useState(Number(today.slice(0, 4)));

  function openPicker(event: React.MouseEvent<HTMLElement>) {
    if (disabled) return;
    setViewYear(Number((selected || today).slice(0, 4)));
    setAnchor(event.currentTarget);
  }

  return (
    <>
      <TextField
        label={label}
        value={selected ? formatMonthVn(selected) : ''}
        placeholder="mm/yyyy"
        onClick={openPicker}
        size={size}
        fullWidth={fullWidth}
        required={required}
        helperText={helperText}
        error={error}
        disabled={disabled}
        sx={{ ...fieldSx, ...sx }}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                {selected && !disabled && (
                  <IconButton
                    size="small"
                    aria-label="Xoá tháng"
                    title="Xoá tháng"
                    onClick={(event) => {
                      event.stopPropagation();
                      onChange('');
                    }}
                    edge="end"
                    sx={{ mr: 0.25, color: 'text.secondary' }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <EventOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
          inputLabel: { shrink: true },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { ...popoverPaperSx, width: 232 } } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Button
            size="small"
            aria-label="Năm trước"
            onClick={() => setViewYear((year) => year - 1)}
            sx={{ minWidth: 28, px: 0.5, color: 'text.secondary' }}
          >
            <ChevronLeftIcon fontSize="small" />
          </Button>
          <Typography variant="subtitle2" fontWeight={600}>
            {viewYear}
          </Typography>
          <Button
            size="small"
            aria-label="Năm sau"
            onClick={() => setViewYear((year) => year + 1)}
            sx={{ minWidth: 28, px: 0.5, color: 'text.secondary' }}
          >
            <ChevronRightIcon fontSize="small" />
          </Button>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
          {Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const iso = `${viewYear}-${pad(month)}`;
            const isSelected = iso === selected;
            return (
              <ButtonBase
                key={iso}
                onClick={() => {
                  onChange(iso);
                  setAnchor(null);
                }}
                sx={{
                  ...dayCellSx,
                  width: 'auto',
                  height: 34,
                  fontSize: 12.5,
                  ...(isSelected
                    ? { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }
                    : null),
                }}
              >
                Tháng {month}
              </ButtonBase>
            );
          })}
        </Box>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button
            size="small"
            onClick={() => {
              onChange(today.slice(0, 7));
              setAnchor(null);
            }}
          >
            Tháng này
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              onChange('');
              setAnchor(null);
            }}
            sx={{ color: 'text.secondary' }}
          >
            Xoá
          </Button>
        </Stack>
      </Popover>
    </>
  );
}

export default DateField;
