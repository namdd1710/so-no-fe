'use client';

import AddIcon from '@mui/icons-material/Add';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DebtorDialog from './DebtorDialog';
import MoneyText from '@/components/ledger/MoneyText';
import { softIconButtonSx, softPaperSx } from '@/components/ui/softBlock';
import { apiFetch } from '@/lib/client-api';
import { formatDateVn } from '@/lib/format';
import type { DebtorSummary } from '@/lib/types';

type Props = { initial: DebtorSummary[] };

type Snack = { open: boolean; message: string; severity: 'success' | 'error' | 'info' };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
    // Dựng link từ origin đang mở thay vì shareUrl của BE (BE dùng APP_BASE_URL, dễ còn localhost).
    const shareUrl = `${window.location.origin}/s/${debtor.accessCode}`;
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
      <Stack spacing={2.5} sx={{ pb: { xs: 10, sm: 0 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5">Con nợ</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeDebtors.length} người đang theo dõi · tổng chưa thu{' '}
              <MoneyText amount={totalUnsettled} suffix="₫" fontWeight={600} color="primary" />
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, debtor: null })}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, display: { xs: 'none', sm: 'inline-flex' } }}
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

        {debtors.length > 0 && (
          <Stack spacing={1.5}>
            {debtors.map((debtor) => (
              <Paper key={debtor.id} elevation={0} sx={{ ...softPaperSx, p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: 16 }}>
                    {initials(debtor.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Link href={`/admin/debtors/${debtor.id}`} style={{ color: 'inherit', fontWeight: 600 }}>
                            {debtor.name}
                          </Link>
                          {!debtor.active && <Chip size="small" label="Đã lưu trữ" />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {debtor.phone || 'Không có SĐT'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {debtor.lastSettledAt
                            ? `Đã chốt đến ${formatDateVn(debtor.lastSettledAt)}`
                            : 'Chưa chốt lần nào'}
                        </Typography>
                      </Box>
                      <MoneyText
                        amount={debtor.unsettled}
                        suffix="₫"
                        fontWeight={700}
                        color="primary"
                        sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' } }}
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ mt: 1 }}>
                      <Tooltip title="Copy link gửi con nợ">
                        <IconButton
                          size="small"
                          onClick={() => copyLink(debtor)}
                          aria-label={`Copy link của ${debtor.name}`}
                          sx={softIconButtonSx}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={debtor.active ? 'Lưu trữ' : 'Bỏ lưu trữ'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleArchive(debtor)}
                          aria-label={debtor.active ? 'Lưu trữ' : 'Bỏ lưu trữ'}
                          sx={softIconButtonSx}
                        >
                          {debtor.active ? (
                            <ArchiveOutlinedIcon fontSize="small" />
                          ) : (
                            <UnarchiveOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
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
