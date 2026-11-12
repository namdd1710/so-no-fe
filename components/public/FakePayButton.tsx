'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

const FAKE_PAY_LINES = [
  // original picks
  'Mở đâu mà húp?',
  'Hệ thống đã ghi nhận… giấc mơ của bạn.',
  'Loading 99%… lỗi: bạn chưa trả.',
  'Đã trừ nợ thành công (ở vũ trụ song song).',
  'Bấm nữa cũng không hết nợ đâu.',
  'Cảm ơn đã quan tâm. Tiền đâu?',
  // A
  'Tiền đâu em?',
  'Ừ rồi sao?',
  'Ai cho trả ở đây?',
  // B
  'Cảm ơn bạn đã quan tâm chức năng này.',
  'Rất tiếc, tính năng chưa phục vụ đúng người.',
  'Vui lòng thanh toán theo hướng dẫn của chủ sổ.',
  'Yêu cầu của bạn đã được… bỏ qua một cách tôn trọng.',
  'Hệ thống ghi nhận thiện chí. Số dư thì chưa.',
  // C
  'Nhìn sổ đi, đừng nhìn nút.',
  'Còn nợ thì còn thấy nút này.',
];

function pickLine() {
  return FAKE_PAY_LINES[Math.floor(Math.random() * FAKE_PAY_LINES.length)]!;
}

/** Thời gian chạy thanh tiến trình: mỗi nhịp 70ms thêm 3–9% → xong sau ~1–1.6s. */
const TICK_MS = 70;

/** Nút “Thanh toán” giả trên trang công khai — chỉ troll, không gọi settle API. */
export default function FakePayButton() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState('');
  const [paid, setPaid] = useState(false);

  const loading = progress < 100;

  // Chạy thanh tiến trình mỗi lần mở; xong 100% mới hiện câu troll.
  useEffect(() => {
    if (!open) return;
    setProgress(0);
    setLine('');

    let value = 0;
    const timer = setInterval(() => {
      value = Math.min(100, value + 3 + Math.random() * 6);
      setProgress(Math.round(value));
      if (value >= 100) {
        clearInterval(timer);
        setPaid(true);
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [open]);

  // Đã đầy thanh thì mới bốc câu troll — như thể vừa xử lý xong giao dịch.
  useEffect(() => {
    if (open && progress >= 100) setLine((current) => current || pickLine());
  }, [open, progress]);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setProgress(0);
  }

  return (
    <>
      <Button variant={paid ? 'outlined' : 'contained'} color="primary" fullWidth onClick={handleOpen}>
        {paid ? 'Đã thanh toán' : 'Thanh toán'}
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>{loading ? 'Đang thanh toán…' : 'Thanh toán'}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                aria-label="Tiến trình thanh toán"
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary">
                Đang xử lý giao dịch · {progress}%
              </Typography>
            </Stack>
          ) : (
            <DialogContentText>{line}</DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="contained" disabled={loading}>
            {loading ? 'Đang xử lý…' : 'Biết rồi 😭'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
