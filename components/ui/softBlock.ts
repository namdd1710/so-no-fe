import type { SxProps, Theme } from '@mui/material/styles';

/** White/paper block on canvas — no outline border. Max radius 4px. */
export const softPaperSx: SxProps<Theme> = {
  bgcolor: 'background.paper',
  borderRadius: 1, // theme.shape.borderRadius (4px)
  boxShadow: '0 1px 3px rgba(21, 101, 192, 0.08)',
  border: 'none',
};

/** Soft icon actions (copy / edit / archive) — góc vuông nhẹ, không pill. */
export const softIconButtonSx: SxProps<Theme> = {
  borderRadius: 1,
  bgcolor: 'action.hover',
  color: 'primary.main',
  '&:hover': { bgcolor: 'action.selected' },
};

/** Status ToggleButtonGroup: active = solid primary. */
export const statusToggleGroupSx: SxProps<Theme> = {
  flexWrap: 'wrap',
  gap: 0.5,
  '& .MuiToggleButtonGroup-grouped': {
    border: 0,
    borderRadius: '4px !important',
    px: 1.5,
    textTransform: 'none',
  },
  '& .Mui-selected': {
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    '&:hover': { bgcolor: 'primary.dark' },
  },
};

/** Month/date fields: filled look, no heavy outline. */
export const filledFilterFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'action.hover',
    borderRadius: 1,
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: 'primary.light' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
  },
};
