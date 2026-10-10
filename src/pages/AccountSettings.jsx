import LockResetIcon from '@mui/icons-material/LockReset';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SaveIcon from '@mui/icons-material/Save';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContextValue';

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function AccountSettings() {
  const { user, updateProfile, changePassword, error, clearError } = useAuth();
  const [profileForm, setProfileForm] = useState({ displayName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setProfileForm({
      displayName: user?.displayName || '',
      email: user?.email || '',
    });
  }, [user]);

  const updateProfileField = (field) => (event) => {
    clearMessages();
    setProfileForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const updatePasswordField = (field) => (event) => {
    clearMessages();
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const clearMessages = () => {
    clearError();
    setLocalError('');
    setProfileMessage('');
    setPasswordMessage('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setLocalError('');
    setProfileMessage('');

    try {
      await updateProfile({
        displayName: profileForm.displayName.trim(),
        email: profileForm.email.trim(),
      });
      setProfileMessage('Datos de cuenta actualizados.');
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setLocalError('');
    setPasswordMessage('');

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setLocalError('La nueva contrasena y la confirmacion no coinciden.');
        return;
      }

      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordMessage('Contrasena actualizada.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Box>
        <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
          configuracion
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 800 }}>
          Configuracion de cuenta
        </Typography>
      </Box>

      {(error || localError) && <Alert severity="error">{localError || error}</Alert>}

      <Paper
        component="form"
        onSubmit={saveProfile}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <ManageAccountsIcon color="primary" />
            <Typography variant="h6">Datos de usuario</Typography>
          </Stack>

          {profileMessage && <Alert severity="success">{profileMessage}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
            <TextField label="Nombre" value={profileForm.displayName} onChange={updateProfileField('displayName')} required fullWidth />
            <TextField label="Correo" type="email" value={profileForm.email} onChange={updateProfileField('email')} required fullWidth />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={profileSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              disabled={profileSaving || !profileForm.displayName.trim() || !profileForm.email.trim()}
              sx={{ minHeight: 48 }}
            >
              Guardar datos
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        component="form"
        onSubmit={savePassword}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <LockResetIcon color="primary" />
            <Typography variant="h6">Cambiar contrasena</Typography>
          </Stack>

          {passwordMessage && <Alert severity="success">{passwordMessage}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            <TextField label="Contrasena actual" type="password" value={passwordForm.currentPassword} onChange={updatePasswordField('currentPassword')} required fullWidth inputProps={{ minLength: 8 }} />
            <TextField label="Nueva contrasena" type="password" value={passwordForm.newPassword} onChange={updatePasswordField('newPassword')} required fullWidth inputProps={{ minLength: 8 }} />
            <TextField label="Confirmar contrasena" type="password" value={passwordForm.confirmPassword} onChange={updatePasswordField('confirmPassword')} required fullWidth inputProps={{ minLength: 8 }} />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Typography color="text.secondary">
              Si olvidaste la contrasena, usa la opcion Recuperar contrasena en la pantalla de entrada.
            </Typography>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={passwordSaving ? <CircularProgress size={18} color="inherit" /> : <LockResetIcon />}
              disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              sx={{ minHeight: 48 }}
            >
              Cambiar contrasena
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
