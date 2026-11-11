'use client';

import AddIcon from '@mui/icons-material/Add';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Fab from '@mui/material/Fab';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DebtorDialog from './DebtorDialog';
import MoneyText from '@/components/ledger/MoneyText';
import { apiFetch } from '@/lib/client-api';
import { formatDateVn } from '@/lib/format';
import type { DebtorSummary } from '@/lib/types';

type Props = { initial: DebtorSummary[] };

type Snack = { open: boolean; message: string; severity: 'success' | 'error' | 'info' };

export default function DebtorsClient({ initial }: Props) {
  const router = useRouter();
  const [debtors, setDebtors] = useState<DebtorSummary[]>(initial);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; debtor: DebtorSummary | null }>({ open: false, debtor: null });
  const [snack, setSnack] = useState<Snack>({ open: false, message: '', severity: 'success' });

  const notify = (message: string, severity: Snack['severity'] = 'success') => setSnack({ open: true, message, severity });

  const load = useCallback(
    async (withArchived: boolean) => {
      setLoading(true);
      const result = await apiFetch<{ debtors: DebtorSummary[] }>(`/api/debtors?includeArchived=${withArchived}`);
      setLoading(false);
      if (!result.ok) {
        if (result.status === 401) router.replace('/admin/login');
        else notify(result.message ?? 'Không tải được danh sách', 'error');
        return;
      }
      setDebtors(result.data?.debtors ?? []);
    },
    [router],
  );

  useEffect(() => {
    if (includeArchived !== undefined) void load(includeArchived);
    // Chỉ tải lại khi đổi bộ lọc; lần đầu đã có dữ liệu server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  async function copyLink(debtor: DebtorSummary) {
    const shareUrl = debtor.shareUrl || `${window.location.origin}/s/${debtor.accessCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify('Đã copy link của ' + debtor.name);
    } catch {
      notify('Trình duyệt không cho copy. Link: ' + shareUrl, 'info');
    }
  }

  async function toggleArchive(debtor: DebtorSummary) {
    const result = await apiFetch(`/api/debtors/${debtor.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: debtor.active }),
    });
    if (!result.ok) return notify(result.message ?? 'Không cập nhật được', 'error');
    notify(debtor.active ? 'Đã lưu trữ con nợ' : 'Đã bỏ lưu trữ');
    void load(includeArchived);
  }

  const activeDebtors = debtors.filter((debtor) => debtor.active);
  const totalUnsettled = activeDebtors.reduce((sum, debtor) => sum + debtor.unsettled, 0);

  return (
    <>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5">Con nợ</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeDebtors.length} người đang theo dõi · tổng chưa thu <MoneyText amount={totalUnsettled} suffix="₫" fontWeight={600} />
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, debtor: null })}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            Thêm con nợ
          </Button>
        </Stack>

        <FormControlLabel
          control={<Switch checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />}
          label="Hiện cả con nợ đã lưu trữ"
        />

        {loading && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Đang tải…
            </Typography>
          </Stack>
        )}

        {!loading && debtors.length === 0 && (
          <Alert severity="info">
            Chưa có con nợ nào. Bấm <strong>Thêm con nợ</strong> để tạo sổ đầu tiên — hệ thống sẽ sinh link cố định để gửi cho họ.
          </Alert>
        )}

        {/* Desktop: bảng */}
        {debtors.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tên</TableCell>
                  <TableCell align="right">Chưa thanh toán</TableCell>
                  <TableCell>Chốt gần nhất</TableCell>
                  <TableCell align="right">Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {debtors.map((debtor) => (
                  <TableRow key={debtor.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Link href={`/admin/debtors/${debtor.id}`} style={{ color: 'inherit', fontWeight: 600 }}>
                          {debtor.name}
                        </Link>
                        {!debtor.active && <Chip size="small" label="Đã lưu trữ" />}
                      </Stack>
                      {debtor.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {debtor.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <MoneyText amount={debtor.unsettled} suffix="₫" fontWeight={600} />
                    </TableCell>
                    <TableCell>
                      {debtor.lastSettledAt ? (
                        <Chip size="small" variant="outlined" label={formatDateVn(debtor.lastSettledAt)} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Chưa chốt
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Copy link gửi con nợ">
                        <IconButton size="small" onClick={() => copyLink(debtor)} aria-label={`Copy link của ${debtor.name}`}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={debtor.active ? 'Lưu trữ' : 'Bỏ lưu trữ'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleArchive(debtor)}
                          aria-label={debtor.active ? 'Lưu trữ' : 'Bỏ lưu trữ'}
                        >
                          {debtor.active ? <ArchiveOutlinedIcon fontSize="small" /> : <UnarchiveOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Mobile: danh sách card */}
        {debtors.length > 0 && (
          <Stack spacing={1.5} sx={{ display: { xs: 'flex', sm: 'none' } }}>
            {debtors.map((debtor) => (
              <Paper key={debtor.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Link href={`/admin/debtors/${debtor.id}`} style={{ color: 'inherit', fontWeight: 600 }}>
                        {debtor.name}
                      </Link>
                      {!debtor.active && <Chip size="small" label="Lưu trữ" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {debtor.phone || 'Không có SĐT'}
                    </Typography>
                  </Box>
                  <MoneyText amount={debtor.unsettled} suffix="₫" fontWeight={700} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {debtor.lastSettledAt ? `Đã chốt đến ${formatDateVn(debtor.lastSettledAt)}` : 'Chưa chốt lần nào'}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => copyLink(debtor)} aria-label="Copy link">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => toggleArchive(debtor)} aria-label="Lưu trữ">
                      {debtor.active ? <ArchiveOutlinedIcon fontSize="small" /> : <UnarchiveOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      <Fab
        color="primary"
        aria-label="Thêm con nợ"
        onClick={() => setDialog({ open: true, debtor: null })}
        sx={{ position: 'fixed', bottom: 24, right: 24, display: { xs: 'flex', sm: 'none' } }}
      >
        <AddIcon />
      </Fab>

      <DebtorDialog
        open={dialog.open}
        debtor={dialog.debtor}
        onClose={() => setDialog({ open: false, debtor: null })}
        onSaved={(message, id) => {
          notify(message);
          void load(includeArchived);
          if (id && !dialog.debtor) router.push(`/admin/debtors/${id}`);
        }}
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
