'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/navigation';
import { MonthField } from '@/components/ui/DateField';
import { filledFilterFieldSx } from '@/components/ui/softBlock';

export default function MonthFilter({ value, basePath }: { value: string; basePath: string }) {
  const router = useRouter();

  function go(next: string) {
    router.push(next ? `${basePath}?month=${next}` : basePath);
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <MonthField
        size="small"
        label="Xem theo tháng"
        value={value}
        onChange={go}
        sx={{ width: 180, ...filledFilterFieldSx }}
      />
      {value && (
        <Button size="small" onClick={() => go('')}>
          Xem tất cả
        </Button>
      )}
    </Stack>
  );
}
