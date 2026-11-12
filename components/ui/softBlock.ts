import type { SxProps, Theme } from '@mui/material/styles';

/** Khối giấy trắng trên canvas — shadow mềm như mockup, radius max 4px. */
export const softPaperSx: SxProps<Theme> = {
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: '0 4px 24px rgba(21, 101, 192, 0.10)',
  border: 'none',
};

/** Icon action nền xanh nhạt. */
export const softIconButtonSx: SxProps<Theme> = {
  borderRadius: 1,
  bgcolor: 'rgba(21, 101, 192, 0.08)',
  color: 'primary.main',
  '&:hover': { bgcolor: 'rgba(21, 101, 192, 0.14)' },
};

/** Tab trạng thái: active = primary đặc. */
export const statusToggleGroupSx: SxProps<Theme> = {
  flexWrap: 'wrap',
  gap: 0.75,
  '& .MuiToggleButtonGroup-grouped': {
    border: '0 !important',
    margin: 0,
    borderRadius: '4px !important',
    px: 1.75,
    py: 0.75,
    textTransform: 'none',
    color: 'text.secondary',
    bgcolor: 'rgba(21, 101, 192, 0.06)',
  },
  '& .Mui-selected': {
    bgcolor: 'primary.main !important',
    color: 'primary.contrastText !important',
    '&:hover': { bgcolor: 'primary.dark !important' },
  },
};

/** Ô lọc tháng/ngày — fill xanh nhạt. */
export const filledFilterFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(21, 101, 192, 0.06)',
    borderRadius: 1,
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: 'rgba(21, 101, 192, 0.35)' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
  },
};

/** Hàng ngày kiểu mockup (nằm trong 1 khối lớn). */
export const dayRowSx: SxProps<Theme> = {
  borderRadius: 1,
  overflow: 'hidden',
  bgcolor: 'transparent',
  boxShadow: 'none',
  border: 'none',
  '&:before': { display: 'none' },
  '&.Mui-expanded': { margin: 0 },
};
