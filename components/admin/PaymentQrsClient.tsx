'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { softPaperSx } from '@/components/ui/softBlock';
import { apiFetch } from '@/lib/client-api';
import type { PaymentQrJson } from '@/lib/types';

type Props = { initial: PaymentQrJson[] };

type Snack = { open: boolean; message: string; severity: 'success' | 'error' | 'info' };

/** ~1,1 MB nhị phân — khớp giới hạn `MAX_QR_IMAGE_CHARS` của BE. */
const MAX_BASE64 = 1_600_000;

export default function PaymentQrsClient({ initial }: Props) {
  const [items, setItems] = useState<PaymentQrJson[]>(initial);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<Snack>({ open: false, message: '', severity: 'success' });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const notify = (message: string, severity: Snack['severity'] = 'success') =>
    setSnack({ open: true, message, severity });

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File phải là ảnh (PNG, JPG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      if (result.length > MAX_BASE64) {
        setError('Ảnh quá lớn, chọn ảnh dưới 1 MB');
        return;
      }
      setError(null);
      setImage(result);
      setFileName(file.name);
    };
    reader.onerror = () => setError('Không đọc được file ảnh');
    reader.readAsDataURL(file);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!image) return setError('Chọn ảnh QR từ máy trước');
    if (!bankName.trim()) return setError('Nhập tên ngân hàng/ví');

    setSaving(true);
    const result = await apiFetch<{ paymentQr: PaymentQrJson }>('/api/payment-qrs', {
      method: 'POST',
      body: JSON.stringify({ bankName, accountName, accountNumber, note, image }),
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      setError(result.message ?? 'Không lưu được ảnh QR');
      return;
    }
    setItems((prev) => [result.data!.paymentQr, ...prev]);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setNote('');
    setImage(null);
    setFileName(null);
    notify('Đã thêm ảnh QR');
  }

  async function toggleActive(item: PaymentQrJson) {
    setBusyId(item.id);
    const result = await apiFetch<{ paymentQr: PaymentQrJson }>(`/api/payment-qrs/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !item.active }),
    });
    setBusyId(null);
    if (!result.ok || !result.data) return notify(result.message ?? 'Không cập nhật được', 'error');
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? result.data!.paymentQr : entry)));
    notify(item.active ? 'Đã tạm ẩn ảnh QR' : 'Đã bật lại ảnh QR');
  }

  async function remove(item: PaymentQrJson) {
    if (!window.confirm(`Xoá ảnh QR của ${item.bankName}?`)) return;
    setBusyId(item.id);
    const result = await apiFetch(`/api/payment-qrs/${item.id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!result.ok) return notify(result.message ?? 'Không xoá được', 'error');
    setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    notify('Đã xoá ảnh QR');
  }

  return (
    <>
      <Stack spacing={2.5} sx={{ pb: { xs: 4, sm: 0 } }}>
        <Box>
          <Typography variant="h5">Mã QR nhận tiền</Typography>
          <Typography variant="body2" color="text.secondary">
            Ảnh QR tải lên được lưu dạng base64 trong DB; con nợ mở trang của mình sẽ thấy tất cả ảnh đang bật.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ ...softPaperSx, p: 2 }} component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Thêm ảnh QR
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
              <Box
                sx={{
                  width: { xs: '100%', sm: 160 },
                  height: 160,
                  flexShrink: 0,
                  borderRadius: 1,
                  border: 1,
                  borderStyle: image ? 'solid' : 'dashed',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {image ? (
                  <Box component="img" src={image} alt="Xem trước ảnh QR" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <AddPhotoAlternateIcon sx={{ color: 'text.secondary', fontSize: 40 }} />
                )}
              </Box>

              <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <Button variant="outlined" startIcon={<AddPhotoAlternateIcon />} onClick={() => fileRef.current?.click()}>
                    Chọn ảnh từ máy
                  </Button>
                  {fileName && (
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {fileName}
                    </Typography>
                  )}
                  <Box
                    component="input"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={pickFile}
                    sx={{ display: 'none' }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label="Ngân hàng / ví"
                    value={bankName}
                    onChange={(event) => setBankName(event.target.value)}
                    placeholder="MoMo, Vietcombank…"
                    size="small"
                    required
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 60 } }}
                  />
                  <TextField
                    label="Người thụ hưởng"
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    placeholder="DO DUC NAM"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 80 } }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label="Số tài khoản / SĐT"
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 40 } }}
                  />
                  <TextField
                    label="Ghi chú"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ví dụ: chỉ nhận buổi tối"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 200 } }}
                  />
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}

                <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: 'flex-start' }}>
                  {saving ? 'Đang lưu…' : 'Lưu ảnh QR'}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {items.length === 0 ? (
          <Alert severity="info">
            Chưa có ảnh QR nào. Tải lên ít nhất một ảnh để trang của con nợ hiện mã chuyển khoản.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {items.map((item) => (
              <Paper key={item.id} elevation={0} sx={{ ...softPaperSx, p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
                  <Box
                    component="img"
                    src={item.image}
                    alt={`QR ${item.bankName}`}
                    sx={{
                      width: { xs: '100%', sm: 128 },
                      maxWidth: 180,
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: '#fff',
                      opacity: item.active ? 1 : 0.45,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {item.bankName}
                      </Typography>
                      {!item.active && <Chip size="small" label="Đang ẩn" />}
                    </Stack>
                    {item.accountName && <Typography variant="body2">{item.accountName}</Typography>}
                    {item.accountNumber && (
                      <Typography variant="body2" color="text.secondary">
                        {item.accountNumber}
                      </Typography>
                    )}
                    {item.note && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.note}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={item.active}
                            disabled={busyId === item.id}
                            onChange={() => toggleActive(item)}
                          />
                        }
                        label={<Typography variant="body2">Hiện cho con nợ</Typography>}
                      />
                      <Button
                        size="small"
                        color="inherit"
                        startIcon={<DeleteOutlineIcon />}
                        disabled={busyId === item.id}
                        onClick={() => remove(item)}
                      >
                        Xoá
                      </Button>
                      {busyId === item.id && <CircularProgress size={16} />}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

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
