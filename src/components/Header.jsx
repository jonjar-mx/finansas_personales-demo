import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InsightsIcon from '@mui/icons-material/Insights';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';
import { useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon fontSize="small" /> },
  { label: 'Budgets', path: '/budgets', icon: <SavingsIcon fontSize="small" /> },
  { label: 'Alertas', path: '/alerts', icon: <AccessAlarmIcon fontSize="small" /> },
  { label: 'Cuentas', path: '/accounts', icon: <AccountBalanceIcon fontSize="small" /> },
  { label: 'Detalles de cuenta', path: '/accounts/all/detail', icon: <InsightsIcon fontSize="small" /> },
  { label: 'Categories', path: '/categories', icon: <CategoryIcon fontSize="small" /> },
  { label: 'Configuracion de cuenta', path: '/settings', icon: <ManageAccountsIcon fontSize="small" /> },
];

export default function Header() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isMenuOpen = Boolean(menuAnchor);

  const openMenu = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#0d1b2f',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 64, sm: 72 },
            py: { xs: 1, sm: 0 },
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#38bdf8',
                color: '#0d1b2f',
                flexShrink: 0,
              }}
            >
              <AccountBalanceWalletIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }} noWrap>
                Finanzas personales
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }} noWrap>
                Presupuesto mensual
              </Typography>
            </Box>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              display: { xs: 'none', md: 'block' },
              maxWidth: 180,
              color: 'rgba(255,255,255,0.78)',
            }}
            noWrap
          >
            {user?.displayName || user?.email}
          </Typography>

          <IconButton
            color="inherit"
            aria-label="Abrir menu"
            aria-controls={isMenuOpen ? 'main-navigation-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isMenuOpen ? 'true' : undefined}
            onClick={openMenu}
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Menu
            id="main-navigation-menu"
            anchorEl={menuAnchor}
            open={isMenuOpen}
            onClose={closeMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 230,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                },
              },
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path === '/accounts/all/detail' && pathname.startsWith('/accounts/') && pathname.endsWith('/detail'));

              return (
                <MenuItem
                  key={item.path}
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  onClick={closeMenu}
                  sx={{ gap: 1, minHeight: 44 }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              );
            })}
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ gap: 1, minHeight: 44 }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Salir</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
