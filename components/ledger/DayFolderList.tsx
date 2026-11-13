'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MoneyText from '@/components/ledger/MoneyText';
import { dayRowSx, softIconButtonSx } from '@/components/ui/softBlock';

/**
 * Nhãn cho khoản theo khoảng: "02/10 → 30/10/2026".
 * Ngày bắt đầu viết ngắn (dd/MM) để nhãn không bị cắt trong cột hẹp.
 */
function rangeLabel(entry: { startDate?: string | null; endDate?: string | null }): string {
  if (!entry.startDate) return 'Khoảng ngày';
  const start = formatDateVn(entry.startDate).slice(0, 5);
  return `${start} → ${formatDateVn(entry.endDate)}`;
}

/**
 * Ô số/tiền: có vách ngăn mảnh bên trái để biết số nào thuộc cột nào,
 * và kéo hết chiều cao hàng để các vách nối liền nhau.
 */
const numberCellSx = {
  alignSelf: 'stretch',
  display: 'flex',
  alignItems: 'center',
  borderLeft: 1,
  borderColor: 'divider',
  pl: 1.5,
};
import { formatDateVn, formatVnd, weekdayVn } from '@/lib/format';

export type DayFolderEntry = {
  id: string;
  category: string;
  /** Tổng = unitAmount × quantity. */
  amount: number;
  /** Đơn giá (×1) — có thể thiếu với dữ liệu cũ. */
  unitAmount?: number;
  /** Số lượng — có thể thiếu với dữ liệu cũ (coi như 1). */
  quantity?: number;
  /** `range` = một khoản trải trên một khoảng ngày. */
  entryType?: 'single' | 'range';
  /** Ngày bắt đầu của khoảng (chỉ khoản `range` mới có). */
  startDate?: string | null;
  /** Ngày kết thúc của khoảng. */
  endDate?: string | null;
  /** `false` = thuộc kỳ đã chốt, không chọn để xoá được. */
  editable?: boolean;
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
   * `embedded` — hàng tint nằm trong 1 khối Paper trắng lớn (admin + trang public).
   * `card` — mỗi ngày một soft card riêng, dùng khi không có khối bao ngoài.
   */
  variant?: 'embedded' | 'card';
  /** Admin: thêm một khoản mới cho đúng ngày này. */
  onAddToDay?: (date: string) => void;
  /** Admin: sửa ở cấp ngày (dời ngày / đổi loại). */
  onEditDay?: (group: DayFolderGroup<T>) => void;
  /** Chọn nhiều khoản để xoá hàng loạt (chỉ admin truyền vào). */
  selection?: {
    selected: Set<string>;
    toggle: (id: string) => void;
    toggleMany: (ids: string[], next: boolean) => void;
  };
};

/** Accordion danh sách khoản theo ngày — mặc định thu gọn hết. */
export default function DayFolderList<T extends DayFolderEntry = DayFolderEntry>({
  groups,
  renderActions,
  variant = 'card',
  selection,
  onAddToDay,
  onEditDay,
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
  const selectable = Boolean(selection);
  // Cột chọn khoản (checkbox) chỉ có khi admin truyền `selection`.
  const lead = selectable ? '36px ' : '';
  // Bảng desktop: [chọn] | danh mục | ghi chú | số lượng | giá | tổng | (sửa/xoá).
  // MỌI cột đều cố định bề rộng: cột `auto` sẽ co về 0 ở hàng tiêu đề (không có
  // icon) và làm nhãn lệch hẳn so với số liệu bên dưới.
  const ACTION_W = 76;
  const columns = `${lead}minmax(0, 1.2fr) minmax(0, 1.5fr) 56px 112px 128px`;
  const desktopGrid = hasActions ? `${columns} ${ACTION_W}px` : columns;
  const selectableIds = groups.flatMap((group) =>
    group.entries.filter((entry) => entry.editable !== false).map((entry) => entry.id),
  );

  return (
    <Stack spacing={embedded ? 1 : 1.5}>
      <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {selection && (
            <>
              <Button
                size="small"
                variant="text"
                color="primary"
                onClick={() => selection.toggleMany(selectableIds, true)}
                disabled={selectableIds.length === 0 || selection.selected.size === selectableIds.length}
              >
                Chọn cả trang
              </Button>
              <Button
                size="small"
                variant="text"
                color="primary"
                onClick={() => selection.toggleMany(selectableIds, false)}
                disabled={selection.selected.size === 0}
              >
                Bỏ chọn
              </Button>
            </>
          )}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="text" color="primary" onClick={expandAll}>
            Mở tất cả
          </Button>
          <Button size="small" variant="text" color="primary" onClick={collapseAll}>
            Đóng tất cả
          </Button>
        </Stack>
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
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <MoneyText amount={group.total} suffix="₫" fontWeight={700} color="primary" />
                {onEditDay && (
                  <Tooltip title={`Sửa ngày ${formatDateVn(group.date)}`}>
                    <IconButton
                      size="small"
                      aria-label={`Sửa ngày ${formatDateVn(group.date)}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditDay(group);
                      }}
                      sx={softIconButtonSx}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onAddToDay && (
                  <Tooltip title={`Thêm khoản cho ngày ${formatDateVn(group.date)}`}>
                    <IconButton
                      size="small"
                      aria-label={`Thêm khoản cho ngày ${formatDateVn(group.date)}`}
                      onClick={(event) => {
                        // Đừng để cú bấm vừa thêm khoản vừa mở/đóng ngày.
                        event.stopPropagation();
                        onAddToDay(group.date);
                      }}
                      sx={softIconButtonSx}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0, bgcolor: 'background.paper' }}>
              {/* Tiêu đề cột — desktop thôi, mobile xếp dọc nên không cần. */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'grid' },
                  gridTemplateColumns: desktopGrid,
                  columnGap: 2,
                  alignItems: 'center',
                  px: 2,
                  pt: 1.25,
                  pb: 0.25,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                {selectable && <Box />}
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Danh mục
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Ghi chú
                </Typography>
                <Box sx={{ ...numberCellSx, justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    SL
                  </Typography>
                </Box>
                <Box sx={{ ...numberCellSx, justifyContent: 'flex-end' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Giá
                  </Typography>
                </Box>
                <Box sx={{ ...numberCellSx, justifyContent: 'flex-end' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Tổng
                  </Typography>
                </Box>
                {hasActions && <Box />}
              </Box>

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
                    {selection && (
                      <Checkbox
                        size="small"
                        checked={selection.selected.has(entry.id)}
                        onChange={() => selection.toggle(entry.id)}
                        disabled={entry.editable === false}
                        slotProps={{ input: { 'aria-label': `Chọn khoản ${entry.category}` } }}
                        sx={{ p: 0.25 }}
                      />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                        {entry.category}
                      </Typography>
                      {entry.entryType === 'range' && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={rangeLabel(entry)}
                          sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {entry.note || '—'}
                    </Typography>
                    <Box sx={{ ...numberCellSx, justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {entry.quantity ?? 1}
                      </Typography>
                    </Box>
                    <Box sx={{ ...numberCellSx, justifyContent: 'flex-end' }}>
                      <MoneyText
                        amount={entry.unitAmount ?? entry.amount}
                        suffix="₫"
                        color="text.secondary"
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      />
                    </Box>
                    <Box sx={{ ...numberCellSx, justifyContent: 'flex-end' }}>
                      <MoneyText amount={entry.amount} suffix="₫" fontWeight={600} />
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
                      {selection && (
                        <Checkbox
                          size="small"
                          checked={selection.selected.has(entry.id)}
                          onChange={() => selection.toggle(entry.id)}
                          disabled={entry.editable === false}
                          slotProps={{ input: { 'aria-label': `Chọn khoản ${entry.category}` } }}
                          sx={{ p: 0.25, mt: -0.5 }}
                        />
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                          {entry.category}
                        </Typography>
                        {entry.entryType === 'range' && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={rangeLabel(entry)}
                            sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                          />
                        )}
                        {entry.note ? (
                          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                            {entry.note}
                          </Typography>
                        ) : null}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <MoneyText amount={entry.amount} suffix="₫" fontWeight={600} display="block" />
                        {(entry.quantity ?? 1) > 1 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {entry.quantity} × {formatVnd(entry.unitAmount ?? entry.amount)}₫
                          </Typography>
                        )}
                      </Box>
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
