'use client';

import { createTheme } from '@mui/material/styles';

/**
 * Theme MUI dùng CSS variables → hỗ trợ dark/light, mặc định theo hệ thống
 * (BRIEF §7). `colorSchemeSelector` cho phép đặt `data-mui-color-scheme` trên
 * <html> nên không bị FOUC khi tải trang.
 */
export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1565c0' },
        secondary: { main: '#00796b' },
        background: { default: '#eef3f8', paper: '#ffffff' },
        success: { main: '#2e7d32' },
        warning: { main: '#ed6c02' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        secondary: { main: '#80cbc4' },
        background: { default: '#0e1116', paper: '#161b22' },
        success: { main: '#66bb6a' },
        warning: { main: '#ffa726' },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
    ].join(','),
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'var(--mui-palette-divider)' },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});

export default theme;
