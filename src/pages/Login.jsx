import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockResetIcon from '@mui/icons-material/LockReset';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';

export default function Login() {
  const { isAuthenticated, login, register, requestPasswordReset, error, clearError } = useAuth();
  const [mode, setMode] = useState('login');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (field) => (event) => {
    clearError();
    setNotice('');
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else if (mode === 'register') {
        await register({ email: form.email, password: form.password, displayName: form.displayName });
      } else {
        await requestPasswordReset({ email: form.email });
        setNotice('Si el correo coincide con una cuenta, se enviara una contrasena temporal.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#07111f', display: 'grid', alignItems: 'center', py: 4 }}>
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 2,
            bgcolor: '#0d1b2f',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <Stack spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#38bdf8',
                  color: '#0d1b2f',
                }}
              >
                <AccountBalanceWalletIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Finanzas personales
              </Typography>
            </Stack>

            <Tabs
              value={mode}
              onChange={(_, value) => {
                clearError();
                setNotice('');
                setMode(value);
              }}
              variant="fullWidth"
              textColor="inherit"
              TabIndicatorProps={{ sx: { bgcolor: '#38bdf8' } }}
            >
              <Tab value="login" label="Entrar" />
              <Tab value="register" label="Crear usuario" />
              <Tab value="reset" label="Recuperar" />
            </Tabs>

            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}

            {mode === 'reset' && (
              <Alert severity="info">Ingresa el correo de la cuenta para solicitar una contrasena temporal.</Alert>
            )}

            {mode === 'register' && (
              <TextField
                label="Nombre"
                placeholder="Tu nombre"
                value={form.displayName}
                onChange={handleChange('displayName')}
                required
                fullWidth
              />
            )}

            <TextField
              label="Email"
              type="email"
              placeholder="tu@dominio.com"
              value={form.email}
              onChange={handleChange('email')}
              required
              fullWidth
            />
            {mode !== 'reset' && (
              <TextField
                label="Password"
                type="password"
                placeholder="Tu password"
                value={form.password}
                onChange={handleChange('password')}
                required
                fullWidth
                inputProps={{ minLength: 8 }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : mode === 'login' ? <LoginIcon /> : mode === 'register' ? <PersonAddIcon /> : <LockResetIcon />}
              disabled={saving}
              sx={{ bgcolor: '#38bdf8', color: '#0d1b2f', fontWeight: 800, '&:hover': { bgcolor: '#7dd3fc' } }}
            >
              {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear usuario' : 'Enviar temporal'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
