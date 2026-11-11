'use client';

import Typography, { type TypographyProps } from '@mui/material/Typography';
import { formatVnd } from '@/lib/format';

type Props = Omit<TypographyProps, 'children'> & {
  amount: number;
  suffix?: string;
};

/** Số tiền VND, khoản âm hiển thị đỏ (BRIEF §5.4). */
export default function MoneyText({ amount, suffix = '', sx, ...rest }: Props) {
  return (
    <Typography
      component="span"
      {...rest}
      sx={{
        fontVariantNumeric: 'tabular-nums',
        color: amount < 0 ? 'error.main' : 'inherit',
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      {formatVnd(amount)}
      {suffix}
    </Typography>
  );
}
