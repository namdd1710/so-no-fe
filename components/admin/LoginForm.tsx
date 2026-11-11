'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/client-api';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await apiFetch<{ ok: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? 'Đăng nhập thất bại');
      return;
    }

    router.replace('/admin');
    router.refresh();
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, width: '100%', maxWidth: 400 }}>
        <form onSubmit={submit}>
          <Stack spacing={2.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <LockOutlinedIcon />
            </Avatar>

            <Box textAlign="center">
              <Typography variant="h5" component="h1">
                Sổ Nợ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đăng nhập để quản lý sổ nợ
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}

            <TextField
              type="password"
              label="Mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              autoComplete="current-password"
              required
              fullWidth
            />

            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
              {loading ? 'Đang kiểm tra…' : 'Đăng nhập'}
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Chỉ dành cho quản trị viên. Không có chức năng đăng ký.
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
