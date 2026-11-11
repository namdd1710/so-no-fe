'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';

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

/** Nút “Thanh toán” giả trên trang công khai — chỉ troll, không gọi settle API. */
export default function FakePayButton() {
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState('');

  function handleOpen() {
    setLine(pickLine());
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <Button variant="contained" color="primary" fullWidth onClick={handleOpen}>
        Thanh toán
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Thanh toán</DialogTitle>
        <DialogContent>
          <DialogContentText>{line}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="contained">
            Biết rồi 😭
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
