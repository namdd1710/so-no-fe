'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MoneyText from '@/components/ledger/MoneyText';
import { dayRowSx } from '@/components/ui/softBlock';
import { formatDateVn, weekdayVn } from '@/lib/format';

export type DayFolderEntry = {
  id: string;
  category: string;
  amount: number;
  note: string;
};

export type DayFolderGroup<T extends DayFolderEntry = DayFolderEntry> = {
  date: string;
  total: number;
  count: number;
  entries: T[];
};

type Props<T extends DayFolderEntry = DayFolderEntry> = {
  groups: DayFolderGroup<T>[];
  /** Admin: sửa/xoá. Public omits. */
  renderActions?: (entry: T) => ReactNode;
  /**
   * `embedded` — hàng tint nằm trong 1 khối Paper lớn (giống mockup).
   * `card` — mỗi ngày một soft card riêng (trang public).
   */
  variant?: 'embedded' | 'card';
};

/** Accordion danh sách khoản theo ngày — mặc định thu gọn hết. */
export default function DayFolderList<T extends DayFolderEntry = DayFolderEntry>({
  groups,
  renderActions,
  variant = 'card',
}: Props<T>) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const embedded = variant === 'embedded';

  const groupsSignature = useMemo(() => groups.map((group) => group.date).join('|'), [groups]);

  useEffect(() => {
    setExpanded({});
  }, [groupsSignature]);

  if (groups.length === 0) return null;

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const group of groups) next[group.date] = true;
    setExpanded(next);
  };

  const collapseAll = () => setExpanded({});

  const hasActions = Boolean(renderActions);
  const desktopGrid = hasActions
    ? 'minmax(0, 1.2fr) minmax(0, 1.5fr) auto auto'
    : 'minmax(0, 1.2fr) minmax(0, 1.5fr) auto';

  return (
    <Stack spacing={embedded ? 1 : 1.5}>
      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
        <Button size="small" variant="text" color="primary" onClick={expandAll}>
          Mở tất cả
        </Button>
        <Button size="small" variant="text" color="primary" onClick={collapseAll}>
          Đóng tất cả
        </Button>
      </Stack>

      {groups.map((group) => {
        const isExpanded = Boolean(expanded[group.date]);
        return (
          <Accordion
            key={group.date}
            disableGutters
            elevation={0}
            expanded={isExpanded}
            onChange={(_event, next) => {
              setExpanded((prev) => ({ ...prev, [group.date]: next }));
            }}
            sx={
              embedded
                ? dayRowSx
                : {
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    boxShadow: '0 4px 24px rgba(21, 101, 192, 0.10)',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: 0 },
                  }
            }
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon color="primary" />}
              aria-controls={`day-${group.date}-content`}
              id={`day-${group.date}-header`}
              sx={{
                px: 2,
                minHeight: 52,
                borderRadius: 1,
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(21, 101, 192, 0.08)' : 'action.hover',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'light' ? 'rgba(21, 101, 192, 0.12)' : 'action.selected',
                },
                '& .MuiAccordionSummary-content': {
                  my: 1.1,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  pr: 1,
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" component="span" fontWeight={600}>
                  {formatDateVn(group.date)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {weekdayVn(group.date)} · {group.count} khoản
                </Typography>
              </Box>
              <MoneyText amount={group.total} suffix="₫" fontWeight={700} color="primary" />
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0, bgcolor: 'background.paper' }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {group.entries.map((entry, index) => (
                  <Box
                    key={entry.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: desktopGrid,
                      columnGap: 2,
                      alignItems: 'center',
                      px: 2,
                      py: 1.25,
                      borderTop: 1,
                      borderColor: 'divider',
                      ...(index === 0 ? { borderTopColor: 'transparent' } : null),
                    }}
                  >
                    <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                      {entry.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {entry.note || '—'}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <MoneyText amount={entry.amount} suffix="₫" />
                    </Box>
                    {hasActions && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{renderActions?.(entry)}</Box>
                    )}
                  </Box>
                ))}
              </Box>

              <Stack sx={{ display: { xs: 'flex', sm: 'none' } }}>
                {group.entries.map((entry, index) => (
                  <Box
                    key={entry.id}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderTop: index === 0 ? 0 : 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                          {entry.category}
                        </Typography>
                        {entry.note ? (
                          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                            {entry.note}
                          </Typography>
                        ) : null}
                      </Box>
                      <MoneyText amount={entry.amount} suffix="₫" fontWeight={600} display="block" />
                    </Stack>
                    {hasActions && (
                      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                        {renderActions?.(entry)}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
