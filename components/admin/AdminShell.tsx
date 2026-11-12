'use client';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/PeopleAlt';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/client-api';

const DRAWER_WIDTH = 232;

const NAV_ITEMS = [{ label: 'Con nợ', href: '/admin', icon: <PeopleIcon /> }];

function ThemeToggle() {
  const { mode, setMode, systemMode } = useColorScheme();
  const resolved = mode === 'system' ? systemMode ?? 'light' : mode;
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <Tooltip title={resolved === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}>
      <IconButton color="inherit" onClick={() => setMode(next)} aria-label="Đổi giao diện sáng/tối">
        {resolved === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    router.replace('/admin/login');
    router.refresh();
  }

  const nav = (
    <Box sx={{ width: DRAWER_WIDTH }} role="presentation" onClick={() => setMobileOpen(false)}>
      <Toolbar sx={{ gap: 1 }}>
        <MenuBookIcon color="primary" />
        <Typography variant="h6" color="primary" noWrap>
          Sổ Nợ
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            sx={{
              borderRadius: 1,
              mx: 1,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Mở menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            Sổ Nợ
          </Typography>
          <ThemeToggle />
          <Tooltip title="Đăng xuất">
            <IconButton color="inherit" onClick={logout} aria-label="Đăng xuất">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Chiếm chỗ thật trên desktop để nội dung không nằm dưới Drawer */}
      <Box component="nav" aria-label="Điều hướng" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: 0 }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {nav}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            width: DRAWER_WIDTH,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 'none',
              boxShadow: '1px 0 0 rgba(21, 101, 192, 0.06)',
              bgcolor: 'background.paper',
            },
          }}
        >
          {nav}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
