'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/navigation';

export default function MonthFilter({ value, basePath }: { value: string; basePath: string }) {
  const router = useRouter();

  function go(next: string) {
    router.push(next ? `${basePath}?month=${next}` : basePath);
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <TextField
        type="month"
        size="small"
        label="Xem theo tháng"
        value={value}
        onChange={(event) => go(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 180 }}
      />
      {value && (
        <Button size="small" onClick={() => go('')}>
          Xem tất cả
        </Button>
      )}
    </Stack>
  );
}
