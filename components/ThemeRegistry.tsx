'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import theme from './theme';

/** Provider MUI phía client + reset CSS của MUI. */
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
