import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useContext, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Checkbox,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AuthContext } from '../context/AuthContextValue';
import { BudgetContext } from '../context/BudgetContextValue';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, getAccountType, getAccountTypeLabel, getIsLiquid } from '../utils/accountAnalytics';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const ACCOUNT_ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  expender: 'Expender',
  reader: 'Reader',
};

const ACCOUNT_SHARE_ROLES = ['admin', 'expender', 'reader'];

const emptyAccount = {
  name: '',
  businessName: '',
  address: '',
  phone: '',
  email: '',
  isOwn: false,
  accountType: 'bank',
  isLiquid: true,
  isCredit: false,
  creditLimit: '',
};

export default function Accounts() {
  const { user } = useContext(AuthContext);
  const { accounts, loading, saving, error, createAccount, updateAccount, deleteAccount, addAccountMember, updateAccountMember, removeAccountMember } = useContext(BudgetContext);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [editingAccount, setEditingAccount] = useState(null);
  const [shareForm, setShareForm] = useState({ email: '', role: 'reader' });

  const ownCount = useMemo(() => accounts.filter((account) => account.isOwn).length, [accounts]);
  const creditCount = useMemo(() => accounts.filter((account) => getAccountType(account) === 'credit_card').length, [accounts]);
  const liquidCount = useMemo(() => accounts.filter((account) => getIsLiquid(account)).length, [accounts]);
  const maxOwnAccounts = user?.capabilities?.limits?.ownAccounts ?? null;
  const canShareAccounts = user?.capabilities?.canShareAccounts === true;
  const ownAccountLimitReached = maxOwnAccounts !== null && ownCount >= maxOwnAccounts;
  const canEditAccountOwnership = !editingAccount || editingAccount.accessRole === 'owner';
  const accountLimitBlocksSave = !editingAccount && accountForm.isOwn && ownAccountLimitReached;

  const updateAccountForm = (field, value) => {
    setAccountForm((current) => {
      if (field === 'accountType') {
        const isCredit = value === 'credit_card';
        return {
          ...current,
          accountType: value,
          isCredit,
          isLiquid: ['cash', 'bank'].includes(value),
          creditLimit: isCredit ? current.creditLimit : '',
        };
      }

      return { ...current, [field]: value };
    });
  };

  const normalizeAccount = (account) => ({
    name: account.name.trim(),
    businessName: account.businessName.trim() || null,
    address: account.address.trim() || null,
    phone: account.phone.trim() || null,
    email: account.email.trim() || null,
    isOwn: account.isOwn === true,
    accountType: account.accountType,
    isLiquid: account.isLiquid === true,
    isCredit: account.accountType === 'credit_card',
    creditLimit: account.accountType === 'credit_card' ? String(account.creditLimit || 0) : '',
  });

  const resetForm = () => {
    setAccountForm(emptyAccount);
    setEditingAccount(null);
    setShareForm({ email: '', role: 'reader' });
  };

  const editAccount = (account) => {
    const accountType = getAccountType(account);
    setEditingAccount(account);
    setAccountForm({
      name: account.name || '',
      businessName: account.businessName || '',
      address: account.address || '',
      phone: account.phone || '',
      email: account.email || '',
      isOwn: account.isOwn === true,
      accountType,
      isLiquid: getIsLiquid(account),
      isCredit: accountType === 'credit_card',
      creditLimit: accountType === 'credit_card' ? String(account.creditLimit ?? '') : '',
    });
    setShareForm({ email: '', role: 'reader' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shareAccount = async () => {
    if (!editingAccount || !shareForm.email.trim()) return;
    await addAccountMember(editingAccount.id, { email: shareForm.email.trim(), role: shareForm.role });
    setShareForm({ email: '', role: 'reader' });
  };

  const changeMemberRole = async (member, role) => {
    if (!editingAccount || member.role === 'owner') return;
    await updateAccountMember(editingAccount.id, member.userId, { role });
  };

  const deleteMember = async (member) => {
    if (!editingAccount || member.role === 'owner') return;
    await removeAccountMember(editingAccount.id, member.userId);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    if (!accountForm.name.trim() || accountLimitBlocksSave) return;

    const normalizedAccount = normalizeAccount(accountForm);

    if (editingAccount && editingAccount.accessRole !== 'owner') {
      delete normalizedAccount.isOwn;
    }

    if (editingAccount) {
      await updateAccount(editingAccount.id, normalizedAccount);
    } else {
      await createAccount(normalizeAccount(accountForm));
    }
    resetForm();
  };

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-end' }}
        spacing={1}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
            account_book
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 800 }}>
            Cuentas
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={accounts.length + ' cuentas'} />
          <Chip label={ownCount + ' propias'} color="primary" variant="outlined" />
          <Chip label={creditCount + ' credito'} color="secondary" variant="outlined" />
          <Chip label={liquidCount + ' liquidas'} color="success" variant="outlined" />
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {maxOwnAccounts !== null && (
        <Alert severity={ownAccountLimitReached ? 'warning' : 'info'}>
          Plan Free: {ownCount}/{maxOwnAccounts} cuentas propias usadas. Las transacciones no tienen limite, pero la retencion aplica por antiguedad.
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={saveAccount}
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
            <AccountBalanceWalletIcon color="primary" />
            <Typography variant="h6">{editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}</Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <TextField label="Nombre" value={accountForm.name} onChange={(event) => updateAccountForm('name', event.target.value)} required />
            <TextField label="Razon social" value={accountForm.businessName} onChange={(event) => updateAccountForm('businessName', event.target.value)} />
            <TextField label="Direccion" value={accountForm.address} onChange={(event) => updateAccountForm('address', event.target.value)} />
            <TextField label="Telefono" value={accountForm.phone} onChange={(event) => updateAccountForm('phone', event.target.value)} />
            <TextField label="Correo" value={accountForm.email} onChange={(event) => updateAccountForm('email', event.target.value)} />
            <TextField select label="Tipo de cuenta" value={accountForm.accountType} onChange={(event) => updateAccountForm('accountType', event.target.value)}>
              {ACCOUNT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{ACCOUNT_TYPE_LABELS[type]}</MenuItem>
              ))}
            </TextField>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Checkbox checked={accountForm.isOwn} onChange={(event) => updateAccountForm('isOwn', event.target.checked)} disabled={!canEditAccountOwnership} />
              <Typography>Propia</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Checkbox checked={accountForm.isLiquid} onChange={(event) => updateAccountForm('isLiquid', event.target.checked)} />
              <Typography>Liquida</Typography>
            </Stack>
            <TextField
              label="Limite de credito"
              type="number"
              value={accountForm.creditLimit}
              onChange={(event) => updateAccountForm('creditLimit', event.target.value)}
              disabled={accountForm.accountType !== 'credit_card'}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            />
          </Box>

          {editingAccount && (
            <>
              <Divider />
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <GroupIcon color="primary" />
                  <Box>
                    <Typography variant="h6">Compartir cuenta</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tu permiso: {ACCOUNT_ROLE_LABELS[editingAccount.accessRole] || editingAccount.accessRole}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {(editingAccount.members || []).map((member) => (
                    <Chip
                      key={member.userId}
                      label={`${member.email} · ${ACCOUNT_ROLE_LABELS[member.role] || member.role}`}
                      color={member.role === 'owner' ? 'primary' : member.role === 'admin' ? 'secondary' : 'default'}
                      variant={member.role === 'reader' ? 'outlined' : 'filled'}
                    />
                  ))}
                </Stack>

                {editingAccount.canManage && canShareAccounts && editingAccount.canShare ? (
                  <Stack spacing={1.25}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 180px auto' },
                        gap: 1,
                      }}
                    >
                      <TextField
                        label="Email del usuario"
                        value={shareForm.email}
                        onChange={(event) => setShareForm((current) => ({ ...current, email: event.target.value }))}
                        size="small"
                      />
                      <TextField
                        select
                        label="Rol"
                        value={shareForm.role}
                        onChange={(event) => setShareForm((current) => ({ ...current, role: event.target.value }))}
                        size="small"
                      >
                        {ACCOUNT_SHARE_ROLES.map((role) => (
                          <MenuItem key={role} value={role}>{ACCOUNT_ROLE_LABELS[role]}</MenuItem>
                        ))}
                      </TextField>
                      <Button type="button" variant="outlined" startIcon={<PersonAddIcon />} onClick={shareAccount} disabled={saving || !shareForm.email.trim()}>
                        Compartir
                      </Button>
                    </Box>

                    {(editingAccount.members || []).filter((member) => member.role !== 'owner').map((member) => (
                      <Stack key={member.userId} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <Typography sx={{ flex: 1, overflowWrap: 'anywhere' }}>{member.email}</Typography>
                        <TextField
                          select
                          size="small"
                          label="Rol"
                          value={member.role}
                          onChange={(event) => changeMemberRole(member, event.target.value)}
                          sx={{ minWidth: 160 }}
                        >
                          {ACCOUNT_SHARE_ROLES.map((role) => (
                            <MenuItem key={role} value={role}>{ACCOUNT_ROLE_LABELS[role]}</MenuItem>
                          ))}
                        </TextField>
                        <Button type="button" color="error" variant="outlined" onClick={() => deleteMember(member)} disabled={saving}>
                          Quitar
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">{canShareAccounts ? 'Solo owner y admin pueden compartir o cambiar permisos de esta cuenta.' : 'Compartir cuentas esta disponible solo en el plan Familia.'}</Alert>
                )}
              </Stack>
            </>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
            {editingAccount && (
              <Button type="button" variant="outlined" size="large" onClick={resetForm} sx={{ minHeight: 48 }}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              disabled={saving || !accountForm.name.trim() || accountLimitBlocksSave}
              sx={{ minHeight: 48 }}
            >
              {editingAccount ? 'Actualizar cuenta' : 'Guardar cuenta'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          display: { xs: 'none', md: 'block' },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: 'background.paper' }}>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Permiso</TableCell>
              <TableCell>Razon social</TableCell>
              <TableCell>Direccion</TableCell>
              <TableCell>Telefono</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Liquidez</TableCell>
              <TableCell align="right">Limite credito</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10}>Cargando cuentas...</TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>Las cuentas nuevas tambien se crean al guardar una transaccion.</TableCell>
              </TableRow>
            ) : accounts.map((account) => (
              <TableRow key={account.id} hover>
                <TableCell sx={{ fontWeight: 800 }}>{account.name}</TableCell>
                <TableCell><Chip label={ACCOUNT_ROLE_LABELS[account.accessRole] || account.accessRole} size="small" color={account.accessRole === 'owner' ? 'primary' : account.accessRole === 'admin' ? 'secondary' : 'default'} variant={account.accessRole === 'reader' ? 'outlined' : 'filled'} /></TableCell>
                <TableCell>{account.businessName || '-'}</TableCell>
                <TableCell>{account.address || '-'}</TableCell>
                <TableCell>{account.phone || '-'}</TableCell>
                <TableCell>{account.email || '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    <Chip label={account.isOwn ? 'Propia' : 'Externa'} size="small" color={account.isOwn ? 'primary' : 'default'} variant={account.isOwn ? 'filled' : 'outlined'} />
                    <Chip label={getAccountTypeLabel(account)} size="small" color={getAccountType(account) === 'credit_card' ? 'secondary' : 'default'} icon={getAccountType(account) === 'credit_card' ? <CreditCardIcon /> : undefined} />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={getIsLiquid(account) ? 'Liquida' : 'No liquida'} size="small" color={getIsLiquid(account) ? 'success' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell align="right">{getAccountType(account) === 'credit_card' ? currencyFormatter.format(account.creditLimit || 0) : '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit account">
                    <IconButton onClick={() => editAccount(account)} size="small" disabled={saving || !account.canManage}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete account">
                    <IconButton onClick={() => deleteAccount(account.id)} size="small" color="error" disabled={saving || account.accessRole !== 'owner'}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {loading ? (
          <Typography color="text.secondary">Cargando cuentas...</Typography>
        ) : accounts.length === 0 ? (
          <Typography color="text.secondary">Las cuentas nuevas tambien se crean al guardar una transaccion.</Typography>
        ) : accounts.map((account) => (
          <Paper
            key={account.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                    {account.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    {account.businessName || account.email || 'Sin datos adicionales'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                  <Chip label={ACCOUNT_ROLE_LABELS[account.accessRole] || account.accessRole} size="small" color={account.accessRole === 'owner' ? 'primary' : 'default'} variant={account.accessRole === 'reader' ? 'outlined' : 'filled'} />
                  <Chip label={account.isOwn ? 'Propia' : 'Externa'} size="small" color={account.isOwn ? 'primary' : 'default'} variant={account.isOwn ? 'filled' : 'outlined'} />
                  <Chip label={getIsLiquid(account) ? 'Liquida' : 'No liquida'} size="small" color={getIsLiquid(account) ? 'success' : 'default'} variant="outlined" />
                </Stack>
              </Stack>

              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                <Chip label={getAccountTypeLabel(account)} size="small" color={getAccountType(account) === 'credit_card' ? 'secondary' : 'default'} icon={getAccountType(account) === 'credit_card' ? <CreditCardIcon /> : undefined} />
                {account.phone && <Chip label={account.phone} size="small" variant="outlined" />}
                {account.email && <Chip label={account.email} size="small" variant="outlined" />}
                {account.address && <Chip label={account.address} size="small" variant="outlined" />}
                {getAccountType(account) === 'credit_card' && <Chip label={'Limite ' + currencyFormatter.format(account.creditLimit || 0)} size="small" color="secondary" variant="outlined" />}
              </Stack>

              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Edit account">
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => editAccount(account)}
                    disabled={saving || !account.canManage}
                  >
                    Edit
                  </Button>
                </Tooltip>
                <Tooltip title="Delete account">
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon fontSize="small" />}
                    onClick={() => deleteAccount(account.id)}
                    disabled={saving || account.accessRole !== 'owner'}
                  >
                    Delete
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
