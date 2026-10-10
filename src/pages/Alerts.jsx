import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { useContext, useEffect, useMemo, useState } from 'react';
import { BudgetContext } from '../context/BudgetContextValue';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import MonthFilter from '../components/MonthFilter';
import AsyncFreeSoloSelect from '../components/AsyncFreeSoloSelect';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const alertTypeLabels = {
  payment: 'Pago',
  card_cutoff: 'Corte de tarjeta',
  service: 'Servicio',
  budget: 'Presupuesto',
};

const recurrenceLabels = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

const getAccountLabel = (account) => account?.name || '';
const getAccountValue = (account) => account?.id || '';
const getSelectedAccountLabel = (value, accounts) => accounts.find((account) => account.id === value)?.name || '';

export default function Alerts() {
  const {
    currentMonth,
    setCurrentMonth,
    monthString,
    accounts,
    alerts,
    loading,
    saving,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    nextMonth,
    prevMonth,
  } = useContext(BudgetContext);
  const [editingAlert, setEditingAlert] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const editAlertId = searchParams.get('edit') || '';
  const { register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues: getDefaultValues(monthString) });
  const isRecurring = watch('isRecurring');
  const selectedAccountId = watch('accountId') || '';
  const accountOptions = useMemo(() => [{ id: '', name: 'Sin cuenta' }, ...accounts], [accounts]);

  useEffect(() => {
    if (!editAlertId) return;

    const alertToEdit = alerts.find((alert) => alert.id === editAlertId);
    if (alertToEdit) setEditingAlert(alertToEdit);
  }, [alerts, editAlertId]);

  useEffect(() => {
    if (editingAlert) {
      reset({
        title: editingAlert.title,
        alertType: editingAlert.alertType,
        dueDate: editingAlert.dueDate,
        amount: editingAlert.amount ?? '',
        accountId: editingAlert.accountId || '',
        description: editingAlert.description || '',
        isPaid: editingAlert.isPaid,
        isRecurring: editingAlert.isRecurring,
        recurrence: editingAlert.recurrence || 'monthly',
      });
      return;
    }

    reset(getDefaultValues(monthString));
  }, [editingAlert, monthString, reset]);

  const sortedAlerts = useMemo(() => [...alerts].sort((a, b) => {
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  }), [alerts]);

  const onSubmit = async (alert) => {
    const payload = {
      ...alert,
      isPaid: alert.isPaid === true,
      isRecurring: alert.isRecurring === true,
    };

    if (editingAlert) {
      await updateAlert(editingAlert.id, payload);
      setEditingAlert(null);
      setSearchParams({});
    } else {
      await createAlert(payload);
    }

    const alertMonth = payload.dueDate.slice(0, 7);
    if (alertMonth !== monthString) {
      setCurrentMonth(new Date(`${alertMonth}-01T00:00:00`));
      return;
    }

    reset(getDefaultValues(monthString));
  };

  const cancelEdit = () => {
    setEditingAlert(null);
    setSearchParams({});
    reset(getDefaultValues(monthString));
  };

  const togglePaid = (alert) => updateAlert(alert.id, { ...alert, isPaid: !alert.isPaid });

  return (
    <Stack spacing={{ xs: 2.5, md: 3.5 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-end' }}
        spacing={1}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
            alertas
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 800 }}>
            Calendario de pagos
          </Typography>
        </Box>
        <MonthFilter
          monthLabel={format(currentMonth, 'MMMM yyyy')}
          labelSx={{ color: 'text.secondary', fontWeight: 500 }}
          countLabel={alerts.length + ' alertas'}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <AccessAlarmIcon color="primary" />
            <Typography variant="h6">{editingAlert ? 'Editar alerta' : 'Nueva alerta'}</Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.1fr 180px 180px 160px' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <TextField label="Titulo" fullWidth {...register('title', { required: true })} />
            <TextField select label="Tipo" fullWidth {...register('alertType', { required: true })}>
              {Object.entries(alertTypeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <TextField label="Fecha" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} {...register('dueDate', { required: true })} />
            <TextField label="Monto" type="number" fullWidth slotProps={{ htmlInput: { min: 0, step: '0.01' } }} {...register('amount', { min: 0 })} />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <AsyncFreeSoloSelect
              label="Cuenta"
              value={selectedAccountId}
              options={accountOptions}
              onChange={(value) => setValue('accountId', value, { shouldDirty: true })}
              getOptionLabel={getAccountLabel}
              getOptionValue={getAccountValue}
              getValueLabel={getSelectedAccountLabel}
              allowCustomValue={false}
            />
            <TextField label="Notas" fullWidth {...register('description')} />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <FormControlLabel control={<Checkbox {...register('isRecurring')} />} label="Recurrente" />
            {isRecurring && (
              <TextField select label="Frecuencia" sx={{ minWidth: 180 }} {...register('recurrence')}>
                {Object.entries(recurrenceLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </TextField>
            )}
            <FormControlLabel control={<Checkbox {...register('isPaid')} />} label="Completada" />
            <Box sx={{ flexGrow: 1 }} />
            <Button type="submit" variant="contained" size="large" disabled={saving} sx={{ minHeight: 48 }}>
              {editingAlert ? 'Actualizar' : 'Guardar alerta'}
            </Button>
            {editingAlert && <Button variant="outlined" size="large" onClick={cancelEdit} sx={{ minHeight: 48 }}>Cancelar</Button>}
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Typography color="text.secondary">Cargando alertas...</Typography>
      ) : sortedAlerts.length === 0 ? (
        <Typography color="text.secondary">No hay alertas para este mes.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          {sortedAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} saving={saving} onEdit={(nextAlert) => { setEditingAlert(nextAlert); setSearchParams({ edit: nextAlert.id }); }} onDelete={deleteAlert} onTogglePaid={togglePaid} />)}
        </Box>
      )}
    </Stack>
  );
}

function AlertCard({ alert, saving, onEdit, onDelete, onTogglePaid }) {
  const days = differenceInCalendarDays(parseISO(alert.dueDate), startOfToday());
  const overdue = !alert.isPaid && days < 0;
  const dueSoon = !alert.isPaid && days >= 0 && days <= 7;

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: overdue ? 'error.main' : dueSoon ? 'warning.main' : 'divider',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>{alert.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {format(parseISO(alert.dueDate), 'MMM d, yyyy')}{alert.accountName ? ' · ' + alert.accountName : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={alert.isPaid ? 'Completada' : overdue ? 'Vencida' : dueSoon ? 'Próxima' : 'Pendiente'} color={alert.isPaid ? 'success' : overdue ? 'error' : dueSoon ? 'warning' : 'default'} size="small" sx={{ fontWeight: 700 }} />
            <Tooltip title={alert.isPaid ? 'Marcar pendiente' : 'Marcar completada'}>
              <IconButton onClick={() => onTogglePaid(alert)} size="small" color="success" disabled={saving}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar alerta">
              <IconButton onClick={() => onEdit(alert)} size="small"><EditIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Eliminar alerta">
              <IconButton onClick={() => onDelete(alert.id)} size="small" color="error" disabled={saving}><DeleteIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={alertTypeLabels[alert.alertType] || alert.alertType} size="small" />
          {alert.isRecurring && <Chip icon={<EventRepeatIcon />} label={recurrenceLabels[alert.recurrence] || 'Recurrente'} size="small" />}
          {alert.amount !== null && alert.amount !== undefined && <Chip label={currencyFormatter.format(alert.amount)} size="small" />}
        </Stack>

        {alert.description && <Typography variant="body2" color="text.secondary">{alert.description}</Typography>}
      </Stack>
    </Paper>
  );
}

function getDefaultValues(monthString) {
  return {
    title: '',
    alertType: 'payment',
    dueDate: monthString + '-01',
    amount: '',
    accountId: '',
    description: '',
    isPaid: false,
    isRecurring: false,
    recurrence: 'monthly',
  };
}
