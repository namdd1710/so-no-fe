'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import DebtorDialog from './DebtorDialog';
import DayFolderList from '@/components/ledger/DayFolderList';
import EntryDialog from '@/components/ledger/EntryDialog';
import MoneyText from '@/components/ledger/MoneyText';
import SettleDialog from '@/components/ledger/SettleDialog';
import {
  filledFilterFieldSx,
  softIconButtonSx,
  softPaperSx,
  statusToggleGroupSx,
} from '@/components/ui/softBlock';
import { apiFetch } from '@/lib/client-api';
import { formatDateVn, formatDateTimeVn, formatMonthVn, formatVnd } from '@/lib/format';
import type { EntryJson, LedgerResponse, SettlementJson } from '@/lib/types';

type Props = { initial: LedgerResponse };

type Status = 'unsettled' | 'settled' | 'all';

type Snack = { open: boolean; message: string; severity: 'success' | 'error' | 'info' };

type FilterState = {
  status: Status;
  month: string;
  from: string;
  to: string;
  page: number;
};

function buildQuery(next: FilterState) {
  const params = new URLSearchParams();
  params.set('status', next.status);
  params.set('page', String(next.page));
  params.set('pageSize', '10');
  if (next.from || next.to) {
    if (next.from) params.set('from', next.from);
    if (next.to) params.set('to', next.to);
  } else if (next.month) {
    params.set('month', next.month);
  }
  return `?${params.toString()}`;
}

function periodLabel(month: string, from: string, to: string) {
  if (from || to) {
    if (from && to) return `${formatDateVn(from)} → ${formatDateVn(to)}`;
    if (from) return `từ ${formatDateVn(from)}`;
    return `đến ${formatDateVn(to)}`;
  }
  if (month) return formatMonthVn(month);
  return 'tất cả';
}

export default function DebtorDetailClient({ initial }: Props) {
  const router = useRouter();
  const [ledger, setLedger] = useState<LedgerResponse>(initial);
  const [status, setStatus] = useState<Status>(initial.status ?? 'unsettled');
  const [month, setMonth] = useState(initial.month ?? '');
  const [from, setFrom] = useState(initial.from ?? '');
  const [to, setTo] = useState(initial.to ?? '');
  const [page, setPage] = useState(initial.pagination?.page ?? 1);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<Snack>({ open: false, message: '', severity: 'success' });

  const [entryDialog, setEntryDialog] = useState<{ open: boolean; entry: EntryJson | null }>({ open: false, entry: null });
  const [settleOpen, setSettleOpen] = useState(false);
  const [debtorDialogOpen, setDebtorDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EntryJson | null>(null);
  const [voidTarget, setVoidTarget] = useState<SettlementJson | null>(null);
  const [busy, setBusy] = useState(false);

  const { debtor, totals, watermark, groups, settlements, today, pagination } = ledger;
  const activeSettlements = settlements.filter((settlement) => settlement.status === 'active');
  const pageSize = pagination?.pageSize ?? 10;

  const notify = (message: string, severity: Snack['severity'] = 'success') => setSnack({ open: true, message, severity });

  async function load(next: FilterState) {
    setLoading(true);
    const result = await apiFetch<LedgerResponse>(`/api/debtors/${debtor.id}${buildQuery(next)}`);
    setLoading(false);

    if (!result.ok || !result.data) {
      if (result.status === 401) return router.replace('/admin/login');
      notify(result.message ?? 'Không tải được sổ', 'error');
      return;
    }

    setLedger(result.data);
    setStatus(result.data.status ?? next.status);
    setMonth(result.data.month ?? '');
    setFrom(result.data.from ?? '');
    setTo(result.data.to ?? '');
    setPage(result.data.pagination?.page ?? next.page);
  }

  function currentFilters(overrides: Partial<FilterState> = {}): FilterState {
    return {
      status,
      month,
      from,
      to,
      page,
      ...overrides,
    };
  }

  function changeStatus(next: Status | null) {
    if (!next) return;
    setStatus(next);
    setPage(1);
    void load(currentFilters({ status: next, page: 1 }));
  }

  function changeMonth(value: string) {
    setMonth(value);
    setFrom('');
    setTo('');
    setPage(1);
    void load(currentFilters({ month: value, from: '', to: '', page: 1 }));
  }

  function changeFrom(value: string) {
    setFrom(value);
    setMonth('');
    setPage(1);
    void load(currentFilters({ from: value, month: '', page: 1 }));
  }

  function changeTo(value: string) {
    setTo(value);
    setMonth('');
    setPage(1);
    void load(currentFilters({ to: value, month: '', page: 1 }));
  }

  function changePage(_event: unknown, nextZeroBased: number) {
    const nextPage = nextZeroBased + 1;
    setPage(nextPage);
    void load(currentFilters({ page: nextPage }));
  }

  function reload() {
    void load(currentFilters());
  }

  async function copyLink() {
    // Link phải dựng từ origin đang mở, không lấy shareUrl của BE: BE dựng link bằng
    // APP_BASE_URL, và biến đó dễ bị bỏ quên ở localhost → copy ra link chết.
    const shareUrl = `${window.location.origin}/s/${debtor.accessCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify('Đã copy link của con nợ');
    } catch {
      notify(`Trình duyệt không cho copy. Link: ${shareUrl}`, 'info');
    }
  }

  async function toggleArchive() {
    const result = await apiFetch(`/api/debtors/${debtor.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: debtor.active }),
    });
    if (!result.ok) return notify(result.message ?? 'Không cập nhật được', 'error');
    notify(debtor.active ? 'Đã lưu trữ con nợ' : 'Đã bỏ lưu trữ');
    reload();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    const result = await apiFetch(`/api/entries/${deleteTarget.id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) {
      notify(result.message ?? 'Không xoá được khoản', 'error');
      return;
    }
    setDeleteTarget(null);
    notify('Đã xoá khoản');
    reload();
  }

  async function confirmVoid(reason: string) {
    if (!voidTarget) return;
    setBusy(true);
    const result = await apiFetch(`/api/settlements/${voidTarget.id}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    if (!result.ok) {
      notify(result.message ?? 'Không huỷ được lần chốt', 'error');
      return;
    }
    setVoidTarget(null);
    notify('Đã huỷ lần chốt — tổng đã tính lại từ dữ liệu gốc');
    reload();
  }

  function entryActions(entry: EntryJson) {
    if (!entry.editable) {
      return (
        <Tooltip title={`Khoản thuộc kỳ đã chốt. Huỷ chốt kỳ ${formatDateVn(watermark)} để sửa.`}>
          <Typography variant="caption" color="text.secondary">
            Đã chốt
          </Typography>
        </Tooltip>
      );
    }
    return (
      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
        <Tooltip title="Sửa">
          <IconButton size="small" onClick={() => setEntryDialog({ open: true, entry })} aria-label="Sửa khoản">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xoá">
          <IconButton size="small" onClick={() => setDeleteTarget(entry)} aria-label="Xoá khoản">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  const emptyMessage = (() => {
    const period = periodLabel(month, from, to);
    if (status === 'unsettled') {
      return period === 'tất cả'
        ? 'Không có khoản chưa thanh toán.'
        : `Không có khoản chưa thanh toán trong ${period}.`;
    }
    if (status === 'settled') {
      return period === 'tất cả'
        ? 'Không có khoản đã thanh toán.'
        : `Không có khoản đã thanh toán trong ${period}.`;
    }
    return period === 'tất cả' ? 'Chưa có khoản nào. Bấm “Thêm khoản” để bắt đầu.' : `Không có khoản nào trong ${period}.`;
  })();

  return (
    <>
      <Stack spacing={2}>
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowBackIcon fontSize="small" color="primary" />
          <Typography variant="body2" color="primary" fontWeight={600}>
            Danh sách con nợ
          </Typography>
        </Link>

        {/* Một khối trắng như mockup: tên → tổng/CTA → lọc → ngày */}
        <Paper elevation={0} sx={{ ...softPaperSx, p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2.25}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h5" component="h1" sx={{ wordBreak: 'break-word' }}>
                    {debtor.name}
                  </Typography>
                  {!debtor.active && <Chip size="small" label="Đã lưu trữ" />}
                </Stack>
                {debtor.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {debtor.phone}
                  </Typography>
                )}
                {debtor.note && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {debtor.note}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={0.75}>
                <Tooltip title="Copy link gửi con nợ">
                  <IconButton onClick={copyLink} aria-label="Copy link" sx={softIconButtonSx}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sửa thông tin">
                  <IconButton onClick={() => setDebtorDialogOpen(true)} aria-label="Sửa con nợ" sx={softIconButtonSx}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={debtor.active ? 'Lưu trữ con nợ' : 'Bỏ lưu trữ'}>
                  <IconButton onClick={toggleArchive} aria-label="Lưu trữ con nợ" sx={softIconButtonSx}>
                    {debtor.active ? <ArchiveOutlinedIcon fontSize="small" /> : <UnarchiveOutlinedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
              sx={{ bgcolor: 'rgba(21, 101, 192, 0.06)', borderRadius: 1, px: 2, py: 1.5 }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Chưa thanh toán
                </Typography>
                <MoneyText variant="h5" component="p" amount={totals.unsettled} suffix="₫" color="primary" fontWeight={700} />
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                  <Chip size="small" label={`${totals.unsettledCount} khoản`} />
                  {watermark ? (
                    <Chip size="small" color="success" variant="outlined" label={`Đã chốt đến ${formatDateVn(watermark)}`} />
                  ) : (
                    <Chip size="small" variant="outlined" label="Chưa chốt lần nào" />
                  )}
                  <Chip size="small" variant="outlined" label={`Đã trả ${formatVnd(totals.settled)}₫`} />
                </Stack>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEntryDialog({ open: true, entry: null })}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Thêm khoản
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSettleOpen(true)}
                  disabled={totals.settlePreviewCount === 0}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Chốt · {formatVnd(totals.settlePreview)}₫
                </Button>
              </Stack>
            </Stack>

            {watermark && (
              <Alert severity="info" sx={{ borderRadius: 1 }}>
                Sổ đã chốt đến <strong>{formatDateVn(watermark)}</strong>. Khoản trong kỳ đã chốt bị khoá — huỷ ở{' '}
                <em>Lịch sử thanh toán</em> nếu cần.
              </Alert>
            )}

            <Divider />

            <Stack spacing={1.75}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={status}
                onChange={(_event, next) => changeStatus(next)}
                aria-label="Lọc trạng thái thanh toán"
                sx={statusToggleGroupSx}
              >
                <ToggleButton value="unsettled">Chưa thanh toán</ToggleButton>
                <ToggleButton value="settled">Đã thanh toán</ToggleButton>
                <ToggleButton value="all">Tất cả</ToggleButton>
              </ToggleButtonGroup>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                <TextField
                  type="month"
                  size="small"
                  label="Lọc theo tháng"
                  value={month}
                  onChange={(event) => changeMonth(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: { xs: '100%', sm: 190 }, ...filledFilterFieldSx }}
                />
                <TextField
                  type="date"
                  size="small"
                  label="Từ ngày"
                  value={from}
                  onChange={(event) => changeFrom(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: { xs: '100%', sm: 170 }, ...filledFilterFieldSx }}
                />
                <TextField
                  type="date"
                  size="small"
                  label="Đến ngày"
                  value={to}
                  onChange={(event) => changeTo(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: { xs: '100%', sm: 170 }, ...filledFilterFieldSx }}
                />
                <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="baseline"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {loading && <CircularProgress size={16} />}
                  <Typography variant="body2" color="text.secondary">
                    Tổng phát sinh {periodLabel(month, from, to)}:
                  </Typography>
                  <MoneyText amount={totals.monthTotal} suffix="₫" fontWeight={700} color="primary" sx={{ fontSize: '1.15rem' }} />
                </Stack>
              </Stack>
            </Stack>

            {groups.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 1 }}>
                {emptyMessage}
              </Alert>
            ) : (
              <>
                <DayFolderList groups={groups} renderActions={entryActions} variant="embedded" />
                <TablePagination
                  component="div"
                  count={pagination?.totalGroups ?? 0}
                  page={Math.max(0, (page ?? 1) - 1)}
                  onPageChange={changePage}
                  rowsPerPage={pageSize}
                  rowsPerPageOptions={[pageSize]}
                  labelRowsPerPage="Mỗi trang"
                  labelDisplayedRows={({ from: rowFrom, to: rowTo, count }) =>
                    `${rowFrom}–${rowTo} / ${count !== -1 ? count : `hơn ${rowTo}`} ngày`
                  }
                  sx={{
                    width: '100%',
                    overflow: 'auto',
                    borderTop: 1,
                    borderColor: 'divider',
                    '.MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.5, px: 0 },
                  }}
                />
              </>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...softPaperSx, p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Lịch sử thanh toán
          </Typography>
          {settlements.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Chưa có lần chốt nào.
            </Typography>
          ) : (
            <Stack divider={<Divider />}>
              {settlements.map((settlement) => {
                const isLatestActive = activeSettlements[0]?.id === settlement.id;
                return (
                  <Stack key={settlement.id} direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ py: 1.25, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <MoneyText amount={settlement.amount} suffix="₫" fontWeight={600} />
                        {settlement.status === 'void' && <Chip size="small" color="warning" label="Đã huỷ" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {settlement.periodStart ? `sau ${formatDateVn(settlement.periodStart)}` : 'từ đầu sổ'} →{' '}
                        {formatDateVn(settlement.periodEnd)} · {settlement.entryCount} khoản · chốt lúc{' '}
                        {formatDateTimeVn(settlement.createdAt)}
                      </Typography>
                      {settlement.status === 'void' && settlement.voidReason && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lý do: {settlement.voidReason}
                        </Typography>
                      )}
                    </Box>
                    {isLatestActive && (
                      <Button size="small" color="warning" onClick={() => setVoidTarget(settlement)} sx={{ mt: 1 }}>
                        Huỷ chốt
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Stack>

      <EntryDialog
        open={entryDialog.open}
        entry={entryDialog.entry}
        debtorId={debtor.id}
        categories={ledger.categories}
        today={today}
        onClose={() => setEntryDialog({ open: false, entry: null })}
        onSaved={(message) => {
          notify(message);
          reload();
        }}
      />

      <SettleDialog
        open={settleOpen}
        debtorId={debtor.id}
        today={today}
        watermark={watermark}
        onClose={() => setSettleOpen(false)}
        onSettled={() => {
          notify('Đã chốt thanh toán');
          reload();
        }}
        onRejected={(message) => {
          notify(message, 'error');
          reload();
        }}
      />

      <DebtorDialog
        open={debtorDialogOpen}
        debtor={debtor}
        onClose={() => setDebtorDialogOpen(false)}
        onSaved={(message) => {
          notify(message);
          reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoá khoản này?"
        description={
          deleteTarget
            ? `${deleteTarget.category} · ${formatVnd(deleteTarget.amount)}₫ ngày ${formatDateVn(deleteTarget.date)}. Khoản sẽ bị ẩn khỏi tổng (xoá mềm, vẫn giữ dấu vết).`
            : undefined
        }
        confirmLabel="Xoá khoản"
        confirmColor="error"
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={Boolean(voidTarget)}
        title="Huỷ lần chốt này?"
        description={
          voidTarget
            ? `Kỳ đến ${formatDateVn(voidTarget.periodEnd)} với ${formatVnd(voidTarget.amount)}₫. Không xoá dữ liệu — các khoản trở lại trạng thái chưa thanh toán.`
            : undefined
        }
        confirmLabel="Huỷ chốt"
        confirmColor="warning"
        reason={{ label: 'Lý do', defaultValue: 'Ghi nhầm' }}
        busy={busy}
        onClose={() => setVoidTarget(null)}
        onConfirm={confirmVoid}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((current) => ({ ...current, open: false }))}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
