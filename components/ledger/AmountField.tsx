'use client';

import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { digitsOnly, formatDigits } from '@/lib/format';

type Props = {
  /** Chuỗi chỉ gồm chữ số, ví dụ "1250000". */
  value: string;
  onChange: (digits: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  autoFocus?: boolean;
  /**
   * Chỉ đọc: không sửa được nhưng vẫn hiện chữ màu bình thường (giá lấy theo
   * danh mục) — dùng `disabled` của MUI sẽ bị xám cả số tiền lẫn nhãn.
   */
  readOnly?: boolean;
};

/**
 * Ô nhập tiền (BRIEF §7): `inputMode="numeric"` để mở bàn phím số trên điện thoại,
 * đang gõ thì hiện số trần, rời ô thì hiện "1.250.000".
 */
export default function AmountField({
  value,
  onChange,
  label = 'Số tiền',
  error,
  helperText,
  required,
  autoFocus,
  readOnly,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <TextField
      label={label}
      value={focused && !readOnly ? value : formatDigits(value)}
      onChange={(event) => onChange(digitsOnly(event.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      InputProps={{
        endAdornment: <InputAdornment position="end">₫</InputAdornment>,
        readOnly,
        sx: { fontVariantNumeric: 'tabular-nums' },
      }}
      slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'off', readOnly } }}
      error={Boolean(error)}
      helperText={error ?? helperText}
      required={required}
      autoFocus={autoFocus}
      fullWidth
    />
  );
}
