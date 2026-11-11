import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5" component="h1">
              Không tìm thấy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đường dẫn không tồn tại hoặc đã bị gỡ.
            </Typography>
            <Button component={Link} href="/admin" variant="contained">
              Về trang quản lý
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
