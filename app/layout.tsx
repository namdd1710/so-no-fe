import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import ThemeRegistry from '@/components/ThemeRegistry';

export const metadata: Metadata = {
  title: 'Sổ Nợ',
  description: 'Ghi sổ nợ theo ngày và chia sẻ sổ cho từng người.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1116' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data-mui-color-scheme" defaultMode="system" />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
