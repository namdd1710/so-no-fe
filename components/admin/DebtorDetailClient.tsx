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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import DebtorDialog from './DebtorDialog';
import EntryDialog from '@/components/ledger/EntryDialog';
import MoneyText from '@/components/ledger/MoneyText';
import SettleDialog from '@/components/ledger/SettleDialog';
import { apiFetch } from '@/lib/client-api';
import { formatDateVn, formatDateTimeVn, formatMonthVn, formatVnd, weekdayVn } from '@/lib/format';
import type { EntryJson, LedgerResponse, SettlementJson } from '@/lib/types';

type Props = { initial: LedgerResponse };

type Snack = { open: boolean; message: string; severity: 'success' | 'error' | 'info' };

export default function DebtorDetailClient({ initial }: Props) {
  const router = useRouter();
  const [ledger, setLedger] = useState<LedgerResponse>(initial);
  const [month, setMonth] = useState(initial.month ?? '');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<Snack>({ open: false, message: '', severity: 'success' });

  const [entryDialog, setEntryDialog] = useState<{ open: boolean; entry: EntryJson | null }>({ open: false, entry: null });
  const [settleOpen, setSettleOpen] = useState(false);
  const [debtorDialogOpen, setDebtorDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EntryJson | null>(null);
  const [voidTarget, setVoidTarget] = useState<SettlementJson | null>(null);
  const [busy, setBusy] = useState(false);

  const { debtor, totals, watermark, groups, settlements, today } = ledger;
  const activeSettlements = settlements.filter((settlement) => settlement.status === 'active');

  const notify = (message: string, severity: Snack['severity'] = 'success') => setSnack({ open: true, message, severity });

  async function load(nextMonth: string) {
    setLoading(true);
    const query = nextMonth ? `?month=${encodeURIComponent(nextMonth)}` : '';
    const result = await apiFetch<LedgerResponse>(`/api/debtors/${debtor.id}${query}`);
    setLoading(false);

    if (!result.ok || !result.data) {
      if (result.status === 401) return router.replace('/admin/login');
      notify(result.message ?? 'Không tải được sổ', 'error');
      return;
    }
    setLedger(result.data);
  }

  function changeMonth(value: string) {
    setMonth(value);
    void load(value);
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
    void load(month);
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
    void load(month);
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
    void load(month);
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

  return (
    <>
      <Stack spacing={2.5}>
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'inherit' }}>
          <ArrowBackIcon fontSize="small" />
          <Typography variant="body2">Danh sách con nợ</Typography>
        </Link>

        {/* ---------- Header ---------- */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
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
              <Stack direction="row" spacing={0.25}>
                <Tooltip title="Copy link gửi con nợ">
                  <IconButton onClick={copyLink} aria-label="Copy link">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sửa thông tin">
                  <IconButton onClick={() => setDebtorDialogOpen(true)} aria-label="Sửa con nợ">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={debtor.active ? 'Lưu trữ con nợ' : 'Bỏ lưu trữ'}>
                  <IconButton onClick={toggleArchive} aria-label="Lưu trữ con nợ">
                    {debtor.active ? <ArchiveOutlinedIcon fontSize="small" /> : <UnarchiveOutlinedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, px: 2, py: 1.75 }}>
              <Typography variant="overline" color="text.secondary">
                Chưa thanh toán
              </Typography>
              <MoneyText variant="h4" component="p" amount={totals.unsettled} suffix="₫" />
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip size="small" label={`${totals.unsettledCount} khoản`} />
                {watermark ? (
                  <Chip size="small" color="success" variant="outlined" label={`Đã chốt đến ${formatDateVn(watermark)}`} />
                ) : (
                  <Chip size="small" variant="outlined" label="Chưa chốt lần nào" />
                )}
                <Chip size="small" variant="outlined" label={`Đã trả ${formatVnd(totals.settled)}₫`} />
              </Stack>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEntryDialog({ open: true, entry: null })}
                fullWidth
              >
                Thêm khoản
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSettleOpen(true)}
                disabled={totals.settlePreviewCount === 0}
                fullWidth
                sx={{ whiteSpace: 'nowrap' }}
              >
                Chốt đã thanh toán · {formatVnd(totals.settlePreview)}₫
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {watermark && (
          <Alert severity="info">
            Sổ đã chốt đến <strong>{formatDateVn(watermark)}</strong>. Các khoản trong kỳ đã chốt bị khoá sửa/xoá — huỷ lần
            chốt đó ở mục <em>Lịch sử thanh toán</em> nếu cần chỉnh.
          </Alert>
        )}

        {/* ---------- Lọc tháng ---------- */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              type="month"
              size="small"
              label="Lọc theo tháng"
              value={month}
              onChange={(event) => changeMonth(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />
            {month && (
              <Button size="small" onClick={() => changeMonth('')}>
                Xem tất cả
              </Button>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              {loading && <CircularProgress size={16} />}
              <Typography variant="body2" color="text.secondary">
                Tổng phát sinh {month ? formatMonthVn(month) : 'tất cả'}:
              </Typography>
              <MoneyText amount={totals.monthTotal} suffix="₫" fontWeight={600} />
            </Stack>
          </Stack>
        </Paper>

        {/* ---------- Danh sách khoản theo ngày ---------- */}
        {groups.length === 0 ? (
          <Alert severity="info">
            {month ? `Không có khoản nào trong ${formatMonthVn(month)}.` : 'Chưa có khoản nào. Bấm “Thêm khoản” để bắt đầu.'}
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {groups.map((group) => (
              <Paper key={group.date} variant="outlined" sx={{ overflow: 'hidden' }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ px: 2, py: 1.25, bgcolor: 'action.hover' }}
                >
                  <Box>
                    <Typography variant="subtitle2" component="span">
                      {formatDateVn(group.date)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {weekdayVn(group.date)} · {group.count} khoản
                    </Typography>
                  </Box>
                  <MoneyText amount={group.total} suffix="₫" fontWeight={700} />
                </Stack>

                {/* Desktop: bảng */}
                <Table size="small" sx={{ display: { xs: 'none', sm: 'table' } }}>
                  <TableBody>
                    {group.entries.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell sx={{ width: '32%', fontWeight: 500 }}>{entry.category}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>{entry.note}</TableCell>
                        <TableCell align="right" sx={{ width: 130 }}>
                          <MoneyText amount={entry.amount} suffix="₫" />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 96 }}>
                          {entryActions(entry)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Mobile: Stack (BRIEF §7) */}
                <Stack divider={<Divider />} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  {group.entries.map((entry) => (
                    <Box key={entry.id} sx={{ px: 2, py: 1.25 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                            {entry.category}
                          </Typography>
                          {entry.note && (
                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                              {entry.note}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <MoneyText amount={entry.amount} suffix="₫" fontWeight={600} display="block" />
                        </Box>
                      </Stack>
                      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                        {entryActions(entry)}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* ---------- Lịch sử thanh toán ---------- */}
        <Paper variant="outlined" sx={{ p: 2 }}>
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
          void load(month);
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
          void load(month);
        }}
        onRejected={(message) => {
          notify(message, 'error');
          void load(month);
        }}
      />

      <DebtorDialog
        open={debtorDialogOpen}
        debtor={debtor}
        onClose={() => setDebtorDialogOpen(false)}
        onSaved={(message) => {
          notify(message);
          void load(month);
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
