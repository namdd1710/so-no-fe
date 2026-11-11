'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'error' | 'warning';
  /** Nếu có, dialog hiện thêm ô nhập lý do. */
  reason?: { label: string; defaultValue: string };
  busy?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  confirmColor = 'primary',
  reason,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(reason?.defaultValue ?? '');

  useEffect(() => {
    if (open) setValue(reason?.defaultValue ?? '');
  }, [open, reason?.defaultValue]);

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description && <DialogContentText sx={{ mb: reason ? 2 : 0 }}>{description}</DialogContentText>}
        {reason && (
          <TextField
            label={reason.label}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            fullWidth
            autoFocus
            inputProps={{ maxLength: 200 }}
            sx={{ mt: 1 }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Đóng
        </Button>
        <Button color={confirmColor} variant="contained" onClick={() => onConfirm(value)} disabled={busy}>
          {busy ? 'Đang xử lý…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
