import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WalletIcon from '@mui/icons-material/Wallet';
import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetContext } from '../context/BudgetContextValue';
import {
  Alert,
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';
import { buildAccountAnalytics, buildAccountBalance, buildAccountTotals, getAccountType, getIsLiquid, isDebtAccount } from '../utils/accountAnalytics';
import MonthFilter from '../components/MonthFilter';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const summaryCardStyles = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
};

export default function BudgetDashboard() {
  const {
    currentMonth,
    accounts,
    alerts,
    budgets,
    transactions,
    accountBalanceTransactions,
    dashboardTotals,
    categories,
    error,
    saving,
    updateAlert,
    deleteAlert,
    nextMonth,
    prevMonth,
  } = useContext(BudgetContext);
  const navigate = useNavigate();
  const [isBudgetSummaryOpen, setIsBudgetSummaryOpen] = useState(true);
  const [isAlertsCalendarOpen, setIsAlertsCalendarOpen] = useState(false);

  const accountKpis = useMemo(() => accounts
    .map((account) => {
      const accountName = String(account.name || '').trim();
      const monthlyTotals = buildAccountBalance(accountName, transactions, { includeInternal: false });
      const balanceTotals = buildAccountBalance(accountName, accountBalanceTransactions);
      const balance = balanceTotals.income - balanceTotals.expenses;

      const analytics = buildAccountAnalytics({ accountNames: new Set([accountName]), transactions, categories });

      return {
        id: account.id,
        name: account.name,
        isOwn: account.isOwn === true,
        isShared: account.accessRole && account.accessRole !== 'owner',
        accessRole: account.accessRole,
        balance,
        income: monthlyTotals.income,
        expenses: monthlyTotals.expenses,
        accountType: getAccountType(account),
        isLiquid: getIsLiquid(account),
        isDebt: isDebtAccount(account),
        isCredit: getAccountType(account) === 'credit_card',
        creditLimit: Number(account.creditLimit || 0),
        creditAvailable: getAccountType(account) === 'credit_card' ? Number(account.creditLimit || 0) + balance : 0,
        expensePreview: analytics.expenses,
      };
    }), [accountBalanceTransactions, accounts, categories, transactions]);

  const visibleAccountKpis = useMemo(() => accountKpis.filter((account) => account.isOwn || account.isShared), [accountKpis]);
  const ownAccountKpis = useMemo(() => visibleAccountKpis.filter((account) => account.isOwn), [visibleAccountKpis]);
  const sharedAccountKpis = useMemo(() => visibleAccountKpis.filter((account) => !account.isOwn && account.isShared), [visibleAccountKpis]);


  const accountKpiTotals = useMemo(() => {
    const financialTotals = buildAccountTotals(ownAccountKpis);

    return ownAccountKpis.reduce((current, account) => ({
      ...financialTotals,
      balance: current.balance + account.balance,
      income: current.income + account.income,
      expenses: current.expenses + account.expenses,
      creditLimit: current.creditLimit + (account.isCredit ? account.creditLimit : 0),
      creditAvailable: current.creditAvailable + (account.isCredit ? account.creditAvailable : 0),
      creditAccounts: current.creditAccounts + (account.isCredit ? 1 : 0),
    }), { balance: 0, income: 0, expenses: 0, creditLimit: 0, creditAvailable: 0, creditAccounts: 0, ...financialTotals });
  }, [ownAccountKpis]);


  const allAccountExpensePreview = useMemo(() => buildAccountAnalytics({
    accountNames: new Set(accounts.filter((account) => account.isOwn).map((account) => String(account.name || '').trim())),
    transactions,
    categories,
  }).expenses, [accounts, categories, transactions]);

  const spentOutsideBudget = useMemo(() => {
    const budgetedCategoryIds = new Set(budgets.map((budget) => budget.categoryId));

    return transactions
      .filter((transaction) => (transaction.transactionType || transaction.type) === 'expense')
      .reduce((total, transaction) => total + transaction.items.reduce((itemTotal, item) => (
        budgetedCategoryIds.has(item.categoryId) ? itemTotal : itemTotal + Number(item.totalPrice || 0)
      ), 0), 0);
  }, [budgets, transactions]);

  const paymentAlerts = useMemo(() => {
    const today = startOfToday();
    const storedAlerts = alerts
      .filter((alert) => !alert.isPaid)
      .map((alert) => ({
        id: alert.id,
        title: alert.title,
        detail: alert.accountName || alert.description || alertTypeLabels[alert.alertType] || 'Alerta',
        dueDate: alert.dueDate,
        amount: alert.amount,
        type: alert.alertType,
        isStoredAlert: true,
        source: alert,
        days: differenceInCalendarDays(parseISO(alert.dueDate), today),
      }));

    const budgetAlerts = budgets
      .filter((budget) => budget.progress >= 90)
      .map((budget) => ({
        id: 'budget-' + budget.id,
        title: budget.progress > 100 ? budget.category + ' excedido' : budget.category + ' cerca del limite',
        detail: 'Presupuesto usado al ' + Math.round(budget.progress) + '%',
        dueDate: null,
        amount: Math.max(0, budget.remaining),
        type: 'budget',
        isStoredAlert: false,
        source: null,
        days: budget.progress > 100 ? -1 : 0,
      }));

    return [...storedAlerts, ...budgetAlerts]
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);
  }, [alerts, budgets]);

  const openAccountDetail = (accountId) => {
    navigate(`/accounts/${accountId}/detail`);
  };

  const openAllAccountBudgetScope = (budgetScope) => {
    navigate(`/accounts/all/detail?budgetScope=${budgetScope}`);
  };

  const toggleAlertPaid = (alert) => {
    if (!alert.source) return;
    updateAlert(alert.id, { ...alert.source, isPaid: !alert.source.isPaid });
  };

  const editAlert = (alert) => {
    if (!alert.isStoredAlert) return;
    navigate(`/alerts?edit=${alert.id}`);
  };

  return (
    <Stack spacing={{ xs: 2.5, md: 3.5 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          bgcolor: 'background.paper',
          color: 'text.primary',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
              Dashboard
            </Typography>
          </Box>

          <MonthFilter
            monthLabel={format(currentMonth, 'MMMM yyyy')}
            labelVariant="h4"
            labelSx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, lineHeight: 1.15 }}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>
      </Paper>

      <Paper sx={summaryCardStyles}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <WalletIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
                  presupuesto
                </Typography>
                <Typography variant="h6">Resumen de presupuesto</Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              <Chip label={currencyFormatter.format(dashboardTotals.remaining) + ' remaining'} />
              <Tooltip title={isBudgetSummaryOpen ? 'Colapsar resumen' : 'Expandir resumen'}>
                <IconButton
                  size="small"
                  onClick={() => setIsBudgetSummaryOpen((current) => !current)}
                  aria-label={isBudgetSummaryOpen ? 'Colapsar resumen de presupuesto' : 'Expandir resumen de presupuesto'}
                  aria-expanded={isBudgetSummaryOpen}
                >
                  {isBudgetSummaryOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Collapse in={isBudgetSummaryOpen} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              <SummaryMetric icon={<WalletIcon sx={{ color: 'primary.main' }} />} label="Budgeted" value={dashboardTotals.budgeted} />
              <SummaryMetric
                icon={<TrendingDownIcon sx={{ color: 'warning.main' }} />}
                label="Spent in budget"
                value={dashboardTotals.spent}
                onClick={() => openAllAccountBudgetScope('in_budget')}
              />
              <SummaryMetric
                icon={<TrendingDownIcon sx={{ color: 'error.main' }} />}
                label="Spent outside budget"
                value={spentOutsideBudget}
                onClick={() => openAllAccountBudgetScope('out_budget')}
              />
              <SummaryMetric icon={<SavingsIcon sx={{ color: 'secondary.main' }} />} label="Remaining" value={dashboardTotals.remaining} />
            </Box>
          </Collapse>
        </Stack>
      </Paper>

      <Paper
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <AccessAlarmIcon sx={{ color: 'warning.main' }} />
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
                  calendario
                </Typography>
                <Typography variant="h6">Pagos y alertas proximas</Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              <Chip label={paymentAlerts.length + ' pendientes'} />
              <Tooltip title={isAlertsCalendarOpen ? 'Colapsar calendario' : 'Expandir calendario'}>
                <IconButton
                  size="small"
                  onClick={() => setIsAlertsCalendarOpen((current) => !current)}
                  aria-label={isAlertsCalendarOpen ? 'Colapsar calendario de alarmas' : 'Expandir calendario de alarmas'}
                  aria-expanded={isAlertsCalendarOpen}
                >
                  {isAlertsCalendarOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Collapse in={isAlertsCalendarOpen} timeout="auto" unmountOnExit>
            {paymentAlerts.length === 0 ? (
              <Typography color="text.secondary">No hay pagos ni alertas pendientes este mes.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                {paymentAlerts.map((alert) => (
                  <PaymentAlertPreview
                    key={alert.id}
                    alert={alert}
                    saving={saving}
                    onTogglePaid={toggleAlertPaid}
                    onEdit={editAlert}
                    onDelete={deleteAlert}
                  />
                ))}
              </Box>
            )}
          </Collapse>
        </Stack>
      </Paper>

      <Paper
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1}
          >
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
                cuentas
              </Typography>
              <Typography variant="h6">KPIs de cuentas</Typography>
            </Box>
            <Chip label={ownAccountKpis.length + ' propias · ' + sharedAccountKpis.length + ' compartidas'} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }} />
          </Stack>

          {visibleAccountKpis.length === 0 ? (
            <Typography color="text.secondary">No hay cuentas propias ni compartidas.</Typography>
          ) : (
            <Stack spacing={2}>
              <Paper
                role="button"
                tabIndex={0}
                onClick={() => openAccountDetail('all')}
                onKeyDown={(event) => { if (event.key === 'Enter') openAccountDetail('all'); }}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                      <WalletIcon sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>Cuentas propias</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {currencyFormatter.format(accountKpiTotals.balance)}
                    </Typography>
                  </Stack>

                  {allAccountExpensePreview.length > 0 && <ExpensePreview data={allAccountExpensePreview} />}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                      gap: 1.5,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <TrendingUpIcon sx={{ color: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Ingresos del mes</Typography>
                        <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(accountKpiTotals.income)}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <TrendingDownIcon sx={{ color: 'warning.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Gastos del mes</Typography>
                        <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(accountKpiTotals.expenses)}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <SavingsIcon sx={{ color: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Liquidez disponible</Typography>
                        <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(accountKpiTotals.liquidBalance)}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <TrendingDownIcon sx={{ color: 'error.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Deuda</Typography>
                        <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(accountKpiTotals.debt)}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <WalletIcon sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Patrimonio estimado</Typography>
                        <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(accountKpiTotals.netWorth)}</Typography>
                      </Box>
                    </Stack>
                    {accountKpiTotals.creditAccounts > 0 && (
                      <>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <CreditCardIcon sx={{ color: 'secondary.main' }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">Limite de credito</Typography>
                            <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(accountKpiTotals.creditLimit)}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <CreditCardIcon sx={{ color: 'success.main' }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">Credito disponible</Typography>
                            <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(accountKpiTotals.creditAvailable)}</Typography>
                          </Box>
                        </Stack>
                      </>
                    )}
                  </Box>
                </Stack>
              </Paper>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                {visibleAccountKpis.map((account) => (
                <Paper
                  key={account.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openAccountDetail(account.id)}
                  onKeyDown={(event) => { if (event.key === 'Enter') openAccountDetail(account.id); }}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                        <AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>{account.name}</Typography>
                        <Chip
                          label={account.isOwn ? 'Propia' : 'Compartida'}
                          size="small"
                          color={account.isOwn ? 'primary' : 'default'}
                          variant={account.isOwn ? 'filled' : 'outlined'}
                        />
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {currencyFormatter.format(account.balance)}
                      </Typography>
                    </Stack>

                    {account.expensePreview.length > 0 && <ExpensePreview data={account.expensePreview} />}

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                        gap: 1.5,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.25}>
                        <TrendingUpIcon sx={{ color: 'success.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Ingresos del mes</Typography>
                          <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(account.income)}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1.25}>
                        <TrendingDownIcon sx={{ color: 'warning.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Gastos del mes</Typography>
                          <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(account.expenses)}</Typography>
                        </Box>
                      </Stack>
                      {account.isCredit && (
                        <>
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <CreditCardIcon sx={{ color: 'secondary.main' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Limite de credito</Typography>
                              <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(account.creditLimit)}</Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <CreditCardIcon sx={{ color: 'success.main' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Credito disponible</Typography>
                              <Typography sx={{ fontWeight: 800 }}>{currencyFormatter.format(account.creditAvailable)}</Typography>
                            </Box>
                          </Stack>
                        </>
                      )}
                    </Box>
                  </Stack>
                </Paper>
                ))}
              </Box>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}


function SummaryMetric({ icon, label, value, onClick }) {
  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => { if (onClick && event.key === 'Enter') onClick(); }}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { borderColor: 'primary.main' } : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h5" sx={{ overflowWrap: 'anywhere' }}>{currencyFormatter.format(value)}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}


function ExpensePreview({ data }) {
  return (
    <Box sx={{ height: 96, width: '100%', display: 'grid', placeItems: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={24} outerRadius={44} paddingAngle={2} isAnimationActive={false}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} stroke={entry.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

const alertTypeLabels = {
  payment: 'Pago',
  card_cutoff: 'Corte de tarjeta',
  service: 'Servicio',
  budget: 'Presupuesto',
};

function PaymentAlertPreview({ alert, saving, onTogglePaid, onEdit, onDelete }) {
  const isOverdue = alert.days < 0;
  const isToday = alert.days === 0;

  return (
    <Paper
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isOverdue ? 'error.main' : isToday ? 'warning.main' : 'divider',
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{alert.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {alert.detail}{alert.dueDate ? ' · ' + format(parseISO(alert.dueDate), 'MMM d') : ''}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
          <Chip
            size="small"
            label={isOverdue ? 'Vencida' : isToday ? 'Hoy' : alert.days + ' dias'}
            color={isOverdue ? 'error' : isToday ? 'warning' : 'default'}
            sx={{ fontWeight: 700 }}
          />
          {alert.amount !== null && alert.amount !== undefined && (
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{currencyFormatter.format(alert.amount)}</Typography>
          )}
          {alert.isStoredAlert && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={alert.source?.isPaid ? 'Marcar pendiente' : 'Marcar pagada'}>
                <IconButton size="small" color="success" onClick={() => onTogglePaid(alert)} disabled={saving}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar alerta">
                <IconButton size="small" onClick={() => onEdit(alert)} disabled={saving}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar alerta">
                <IconButton size="small" color="error" onClick={() => onDelete(alert.id)} disabled={saving}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
