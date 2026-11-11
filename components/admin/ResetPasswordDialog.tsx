'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-api';

type Props = {
  open: boolean;
  onClose: () => void;
  onChanged: (message: string) => void;
};

const MIN_LENGTH = 8;

/**
 * Đổi mật khẩu khi quên — bắt buộc có "khoá khôi phục"
 * (giá trị của biến env ADMIN_RECOVERY_KEY do admin tự đặt).
 */
export default function ResetPasswordDialog({ open, onClose, onChanged }: Props) {
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRecoveryKey('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!recoveryKey.trim()) return setError('Nhập khoá khôi phục');
    if (newPassword.length < MIN_LENGTH) return setError(`Mật khẩu mới phải có ít nhất ${MIN_LENGTH} ký tự`);
    if (newPassword !== confirmPassword) return setError('Mật khẩu nhập lại không khớp');

    setSaving(true);
    const result = await apiFetch<{ message: string }>('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ recoveryKey: recoveryKey.trim(), newPassword }),
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? 'Không đổi được mật khẩu');
      return;
    }

    onChanged(result.data?.message ?? 'Đã đổi mật khẩu. Hãy đăng nhập lại.');
    onClose();
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>Đổi mật khẩu khi quên</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Alert severity="info">
            Cần đúng <strong>khoá khôi phục</strong> — chính là giá trị biến môi trường{' '}
            <Typography component="code" variant="caption" sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
              ADMIN_RECOVERY_KEY
            </Typography>{' '}
            bạn đã đặt. Sai khoá thì không đổi được.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Khoá khôi phục"
            type="password"
            value={recoveryKey}
            onChange={(event) => setRecoveryKey(event.target.value)}
            autoComplete="off"
            autoFocus
            required
            fullWidth
          />
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            helperText={`Ít nhất ${MIN_LENGTH} ký tự`}
            autoComplete="new-password"
            required
            fullWidth
          />
          <TextField
            label="Nhập lại mật khẩu mới"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Huỷ
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Đang đổi…' : 'Đổi mật khẩu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
