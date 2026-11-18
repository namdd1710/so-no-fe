'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import AmountField from '@/components/ledger/AmountField';
import { softPaperSx } from '@/components/ui/softBlock';
import { apiFetch } from '@/lib/client-api';
import { formatVnd } from '@/lib/format';
import type { CategoryJson } from '@/lib/types';

type Props = { initial: CategoryJson[] };

type Snack = { open: boolean; message: string; severity: 'success' | 'error' | 'info' };

export default function CategoriesClient({ initial }: Props) {
  const [items, setItems] = useState<CategoryJson[]>(initial);
  const [name, setName] = useState('');
  const [digits, setDigits] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id: string; name: string; digits: string } | null>(null);
  const [snack, setSnack] = useState<Snack>({ open: false, message: '', severity: 'success' });

  const notify = (message: string, severity: Snack['severity'] = 'success') =>
    setSnack({ open: true, message, severity });

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return needle ? sorted.filter((item) => item.name.toLowerCase().includes(needle)) : sorted;
  }, [items, query]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Nhập tên danh mục');
    if (!digits || Number(digits) === 0) return setError('Nhập đơn giá khác 0');

    setSaving(true);
    const result = await apiFetch<{ category: CategoryJson }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), unitPrice: Number(digits) }),
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      setError(result.message ?? 'Không lưu được danh mục');
      return;
    }
    setItems((prev) => [...prev, result.data!.category]);
    setName('');
    setDigits('');
    notify('Đã thêm danh mục');
  }

  async function saveEdit() {
    if (!edit) return;
    if (!edit.name.trim()) return setError('Nhập tên danh mục');
    if (!edit.digits || Number(edit.digits) === 0) return setError('Nhập đơn giá khác 0');

    setSaving(true);
    const result = await apiFetch<{ category: CategoryJson }>(`/api/categories/${edit.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: edit.name.trim(), unitPrice: Number(edit.digits) }),
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      setError(result.message ?? 'Không lưu được danh mục');
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === edit.id ? result.data!.category : item)));
    setEdit(null);
    setError(null);
    notify('Đã cập nhật danh mục');
  }

  async function remove(item: CategoryJson) {
    if (!window.confirm(`Xoá danh mục "${item.name}"? Các khoản đã ghi vẫn giữ nguyên tên này.`)) return;
    setBusyId(item.id);
    const result = await apiFetch(`/api/categories/${item.id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!result.ok) return notify(result.message ?? 'Không xoá được danh mục', 'error');
    setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    notify('Đã xoá danh mục');
  }

  return (
    <>
      <Stack spacing={2.5} sx={{ pb: { xs: 4, sm: 0 } }}>
        <Box>
          <Typography variant="h5">Danh mục khoản</Typography>
          <Typography variant="body2" color="text.secondary">
            Danh sách dùng chung cho mọi con nợ. Khi thêm khoản chỉ cần chọn danh mục rồi nhập số lượng — đơn giá tự
            điền theo danh mục.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ ...softPaperSx, p: 2 }} component="form" onSubmit={create}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Thêm danh mục
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
              <TextField
                label="Tên danh mục"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Cơm máng lợn, Bún bò…"
                size="small"
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: 60 } }}
              />
              <Box sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}>
                <AmountField value={digits} onChange={setDigits} label="Đơn giá" required />
              </Box>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={saving}
                sx={{ flexShrink: 0, height: 40 }}
              >
                Lưu
              </Button>
            </Stack>
            {error && !edit && <Alert severity="error">{error}</Alert>}
          </Stack>
        </Paper>

        {items.length > 6 && (
          <TextField
            label="Tìm danh mục"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            size="small"
          />
        )}

        {items.length === 0 ? (
          <Alert severity="info">Chưa có danh mục nào. Thêm món đầu tiên để dùng khi nhập khoản.</Alert>
        ) : (
          <Paper elevation={0} sx={{ ...softPaperSx, p: { xs: 0.5, sm: 1 } }}>
            {shown.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                Không có danh mục nào khớp “{query}”.
              </Typography>
            )}
            {shown.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ px: { xs: 1, sm: 1.5 }, py: 1, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}
              >
                <Typography variant="body1" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {formatVnd(item.unitPrice)}₫
                </Typography>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  disabled={busyId === item.id}
                  onClick={() => {
                    setError(null);
                    setEdit({ id: item.id, name: item.name, digits: String(item.unitPrice) });
                  }}
                >
                  Sửa
                </Button>
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<DeleteOutlineIcon />}
                  disabled={busyId === item.id}
                  onClick={() => remove(item)}
                  aria-label={`Xoá danh mục ${item.name}`}
                >
                  Xoá
                </Button>
                {busyId === item.id && <CircularProgress size={16} />}
              </Stack>
            ))}
          </Paper>
        )}
      </Stack>

      <Dialog open={Boolean(edit)} onClose={saving ? undefined : () => setEdit(null)} fullWidth maxWidth="xs">
        <DialogTitle>Sửa danh mục</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Tên danh mục"
              value={edit?.name ?? ''}
              onChange={(event) => setEdit((current) => (current ? { ...current, name: event.target.value } : current))}
              size="small"
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 60 } }}
            />
            <AmountField
              value={edit?.digits ?? ''}
              onChange={(value) => setEdit((current) => (current ? { ...current, digits: value } : current))}
              label="Đơn giá"
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEdit(null)} disabled={saving}>
            Huỷ
          </Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

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
