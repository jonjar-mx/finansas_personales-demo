import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useContext, useEffect, useMemo, useState } from 'react';
import { BudgetContext } from '../context/BudgetContextValue';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
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
import { format } from 'date-fns';
import MonthFilter from '../components/MonthFilter';
import AsyncFreeSoloSelect from '../components/AsyncFreeSoloSelect';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const transactionDraftKey = 'finanzas_transaction_draft_v1';

const transactionTypeOptions = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'credit_payment', label: 'Pago de credito' },
];

const transactionTypeLabels = Object.fromEntries(
  transactionTypeOptions.map((option) => [option.value, option.label])
);

const emptyInvoice = {
  date: format(new Date(), 'yyyy-MM-dd'),
  paidBy: '',
  paidTo: '',
  ticket: '',
  ticketLink: '',
  currency: '$MX',
  transactionType: 'expense',
  notes: '',
};

const emptyItem = (categoryId = '') => ({
  id: crypto.randomUUID?.() || String(Date.now()),
  categoryId,
  item: '',
  units: '1',
  unitPrice: '',
});


function uniqueOptions(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}


function CategorySelect({ value, categories, onChange, required = false }) {
  const showClearButton = Boolean(value);

  return (
    <TextField
      select
      label="Categoria"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      slotProps={{
        input: showClearButton ? {
          endAdornment: (
            <InputAdornment position="end" sx={{ mr: 2.5 }}>
              <Tooltip title="Limpiar">
                <IconButton
                  aria-label="Limpiar categoria"
                  edge="end"
                  size="small"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange('');
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        } : undefined,
      }}
    >
      {categories.map((category) => (
        <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
      ))}
    </TextField>
  );
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function findAccountByName(accounts, name) {
  const normalizedName = String(name || '').trim();
  return accounts.find((account) => String(account.name || '').trim() === normalizedName);
}

function inferTransactionType(accounts, paidBy, paidTo) {
  const paidByAccount = findAccountByName(accounts, paidBy);
  const paidToAccount = findAccountByName(accounts, paidTo);

  if (paidByAccount?.isOwn && paidToAccount?.isOwn) {
    return ['credit_card', 'loan'].includes(paidToAccount.accountType) ? 'credit_payment' : 'transfer';
  }
  if (paidToAccount?.isOwn && !paidByAccount?.isOwn) return 'income';
  return 'expense';
}

function loadTransactionDraft() {
  try {
    const rawDraft = window.localStorage.getItem(transactionDraftKey);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft);
    if (!draft?.invoice || !Array.isArray(draft.items)) return null;

    return {
      invoice: { ...emptyInvoice, ...draft.invoice },
      items: draft.items.length > 0 ? draft.items : [emptyItem()],
      editingTransaction: draft.editingTransaction || null,
    };
  } catch {
    window.localStorage.removeItem(transactionDraftKey);
    return null;
  }
}

export default function Transactions() {
  const {
    currentMonth,
    accounts,
    categories,
    transactions,
    loading,
    saving,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    nextMonth,
    prevMonth,
  } = useContext(BudgetContext);
  const firstCategoryId = categories[0]?.id || '';
  const [invoice, setInvoice] = useState(() => loadTransactionDraft()?.invoice || emptyInvoice);
  const [items, setItems] = useState(() => loadTransactionDraft()?.items || [emptyItem(firstCategoryId)]);
  const [editingTransaction, setEditingTransaction] = useState(() => loadTransactionDraft()?.editingTransaction || null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const accountOptions = useMemo(() => uniqueOptions([
    ...accounts.map((account) => account.name),
    ...transactions.flatMap((transaction) => [transaction.paidBy, transaction.paidTo]),
  ]), [accounts, transactions]);
  const currencyOptions = useMemo(() => uniqueOptions([
    '$MX',
    'U$D',
    '$AR',
    ...transactions.map((transaction) => transaction.currency),
  ]), [transactions]);
  const itemOptions = useMemo(() => uniqueOptions(
    transactions.flatMap((transaction) => transaction.items.map((item) => item.item))
  ), [transactions]);
  const visibleTransactions = useMemo(() => (
    showAllTransactions ? transactions : transactions.slice(0, 50)
  ), [showAllTransactions, transactions]);
  const hiddenTransactionCount = showAllTransactions ? 0 : Math.max(0, transactions.length - visibleTransactions.length);

  useEffect(() => {
    if (!firstCategoryId) return;
    setItems((current) => current.map((item) => (
      item.categoryId ? item : { ...item, categoryId: firstCategoryId }
    )));
  }, [firstCategoryId]);

  useEffect(() => {
    const draft = {
      invoice,
      items,
      editingTransaction: editingTransaction ? { id: editingTransaction.id } : null,
    };

    const saveDraft = window.setTimeout(() => {
      window.localStorage.setItem(transactionDraftKey, JSON.stringify(draft));
    }, 400);

    return () => window.clearTimeout(saveDraft);
  }, [editingTransaction, invoice, items]);

  useEffect(() => {
    const hasDraftContent = invoice.paidBy.trim()
      || invoice.paidTo.trim()
      || invoice.ticket.trim()
      || invoice.ticketLink.trim()
      || invoice.notes.trim()
      || items.some((item) => item.item.trim() || item.unitPrice || item.units !== '1');

    if (!hasDraftContent) return undefined;

    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [invoice, items]);

  const invoiceTotal = useMemo(() => (
    items.reduce((sum, item) => sum + numberValue(item.units) * numberValue(item.unitPrice), 0)
  ), [items]);

  const setInvoiceField = (field, value) => {
    setInvoice((current) => {
      const next = { ...current, [field]: value };
      if (field === 'paidBy' || field === 'paidTo') {
        next.transactionType = inferTransactionType(accounts, next.paidBy, next.paidTo);
      }
      return next;
    });
  };

  const updateItem = (id, field, value) => {
    setItems((current) => current.map((item) => (
      item.id === id ? { ...item, [field]: value } : item
    )));
  };

  const addItem = () => {
    setItems((current) => [emptyItem(firstCategoryId), ...current]);
  };

  const removeItem = (id) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      return next.length > 0 ? next : [emptyItem(firstCategoryId)];
    });
  };

  const resetForm = () => {
    window.localStorage.removeItem(transactionDraftKey);
    setInvoice(emptyInvoice);
    setItems([emptyItem(firstCategoryId)]);
    setEditingTransaction(null);
  };

  const editTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setInvoice({
      date: transaction.date,
      paidBy: transaction.paidBy || '',
      paidTo: transaction.paidTo || '',
      ticket: transaction.ticket || '',
      ticketLink: transaction.ticketLink || '',
      currency: transaction.currency || '$MX',
      transactionType: transaction.transactionType || transaction.type || 'expense',
      notes: transaction.notes || '',
    });
    setItems(transaction.items.map((item) => ({
      id: item.id || emptyItem().id,
      categoryId: item.categoryId || firstCategoryId,
      item: item.item || '',
      units: String(item.units ?? '1'),
      unitPrice: String(item.unitPrice ?? ''),
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const normalizedItems = () => items
    .filter((item) => item.item.trim())
    .map((item) => ({
      categoryId: item.categoryId,
      item: item.item.trim(),
      units: numberValue(item.units),
      unitPrice: numberValue(item.unitPrice),
    }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const validItems = normalizedItems();
    if (validItems.length === 0) return;

    const payload = {
      ...invoice,
      paidBy: invoice.paidBy.trim(),
      paidTo: invoice.paidTo.trim(),
      transactionType: invoice.transactionType,
      items: validItems,
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
    } else {
      await createTransaction(payload);
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
            input_money
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 800 }}>
            Transactions
          </Typography>
        </Box>
        <MonthFilter
          monthLabel={format(currentMonth, 'MMMM yyyy')}
          labelSx={{ color: 'text.secondary', fontWeight: 500 }}
          countLabel={transactions.length + ' tickets'}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        component="form"
        onSubmit={onSubmit}
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
            <ReceiptLongIcon color="primary" />
            <Typography variant="h6">{editingTransaction ? 'Edit invoice' : 'Invoice header'}</Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={invoice.date}
              onChange={(event) => setInvoiceField('date', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <AsyncFreeSoloSelect label="Quien paga" value={invoice.paidBy} options={accountOptions} onChange={(value) => setInvoiceField('paidBy', value)} required />
            <AsyncFreeSoloSelect label="Quien recibe" value={invoice.paidTo} options={accountOptions} onChange={(value) => setInvoiceField('paidTo', value)} required />
            <AsyncFreeSoloSelect label="Moneda" value={invoice.currency} options={currencyOptions} onChange={(value) => setInvoiceField('currency', value)} required />
            <TextField select label="Tipo" fullWidth value={invoice.transactionType} onChange={(event) => setInvoiceField('transactionType', event.target.value)} required>
              {transactionTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
            <TextField label="Codigo ticket" fullWidth value={invoice.ticket} onChange={(event) => setInvoiceField('ticket', event.target.value)} />
            <TextField label="Link de ticket" fullWidth value={invoice.ticketLink} onChange={(event) => setInvoiceField('ticketLink', event.target.value)} />
            <TextField label="Notes" fullWidth value={invoice.notes} onChange={(event) => setInvoiceField('notes', event.target.value)} />
            <TextField label="Total" fullWidth value={currencyFormatter.format(invoiceTotal)} disabled />
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6">Items</Typography>
            <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={addItem} disabled={categories.length === 0}>
              Add item
            </Button>
          </Stack>

          <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">unidades</TableCell>
                  <TableCell align="right">$ por unidad</TableCell>
                  <TableCell align="right">precio total</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ minWidth: 260 }}>
                      <AsyncFreeSoloSelect label="Item" value={item.item} options={itemOptions} onChange={(value) => updateItem(item.id, 'item', value)} required />
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <CategorySelect
                        value={item.categoryId}
                        categories={categories}
                        onChange={(value) => updateItem(item.id, 'categoryId', value)}
                        required
                      />
                    </TableCell>
                    <TableCell sx={{ width: 150 }}>
                      <TextField label="unidades" type="number" value={item.units} onChange={(event) => updateItem(item.id, 'units', event.target.value)} slotProps={{ htmlInput: { step: '0.000001' } }} required />
                    </TableCell>
                    <TableCell sx={{ width: 170 }}>
                      <TextField label="$ por unidad" type="number" value={item.unitPrice} onChange={(event) => updateItem(item.id, 'unitPrice', event.target.value)} slotProps={{ htmlInput: { step: '0.000001' } }} required />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {currencyFormatter.format(numberValue(item.units) * numberValue(item.unitPrice))}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete item">
                        <IconButton color="error" onClick={() => removeItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {items.map((item, index) => (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontWeight: 800 }}>Item {index + 1}</Typography>
                    <Tooltip title="Delete item">
                      <IconButton color="error" onClick={() => removeItem(item.id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <AsyncFreeSoloSelect label="Item" value={item.item} options={itemOptions} onChange={(value) => updateItem(item.id, 'item', value)} required />
                  <CategorySelect
                        value={item.categoryId}
                        categories={categories}
                        onChange={(value) => updateItem(item.id, 'categoryId', value)}
                        required
                      />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 1.5,
                    }}
                  >
                    <TextField label="unidades" type="number" value={item.units} onChange={(event) => updateItem(item.id, 'units', event.target.value)} slotProps={{ htmlInput: { step: '0.000001' } }} required />
                    <TextField label="$ por unidad" type="number" value={item.unitPrice} onChange={(event) => updateItem(item.id, 'unitPrice', event.target.value)} slotProps={{ htmlInput: { step: '0.000001' } }} required />
                  </Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="text.secondary">precio total</Typography>
                    <Typography sx={{ fontWeight: 800 }}>
                      {currencyFormatter.format(numberValue(item.units) * numberValue(item.unitPrice))}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Typography color="text.secondary">
              This saves 1 transaction with {normalizedItems().length} item(s).
            </Typography>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<ReceiptLongIcon />}
              disabled={saving || categories.length === 0}
              sx={{ minHeight: 48 }}
            >
              {editingTransaction ? 'Update transaction' : 'Save transaction'}
            </Button>
            {editingTransaction && (
              <Button type="button" variant="outlined" size="large" onClick={resetForm} sx={{ minHeight: 48 }}>
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>


      {hiddenTransactionCount > 0 && (
        <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => setShowAllTransactions(true)}>Mostrar todos</Button>}>Mostrando los 50 tickets mas recientes de {transactions.length}.</Alert>
      )}

      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.paper' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Ticket</TableCell>
              <TableCell>Quien paga</TableCell>
              <TableCell>Quien recibe</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading transactions...</TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No hay transacciones para este mes.</TableCell>
              </TableRow>
            ) : visibleTransactions.map((transaction) => (
              <TableRow key={transaction.id} hover>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.ticket || transaction.id}</TableCell>
                <TableCell>{transaction.paidBy}</TableCell>
                <TableCell>{transaction.paidTo}</TableCell>
                <TableCell>
                  <Chip label={transactionTypeLabels[transaction.transactionType || transaction.type] || 'Gasto'} size="small" />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    {transaction.items.map((item) => (
                      <Chip key={item.id} label={`${item.item} (${item.category})`} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>
                  {currencyFormatter.format(transaction.amount)}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit transaction">
                    <IconButton onClick={() => editTransaction(transaction)} size="small" disabled={saving}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete transaction">
                    <IconButton onClick={() => deleteTransaction(transaction.id)} size="small" color="error" disabled={saving}>
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
          <Typography color="text.secondary">Loading transactions...</Typography>
        ) : transactions.length === 0 ? (
          <Typography color="text.secondary">No hay transacciones para este mes.</Typography>
        ) : visibleTransactions.map((transaction) => (
          <Paper
            key={transaction.id}
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
                    {transaction.ticket || transaction.paidTo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {transaction.date} · {transaction.paidBy} → {transaction.paidTo}
                  </Typography>
                  <Chip label={transactionTypeLabels[transaction.transactionType || transaction.type] || 'Gasto'} size="small" sx={{ mt: 0.75 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {currencyFormatter.format(transaction.amount)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {transaction.items.map((item) => (
                  <Chip key={item.id} label={`${item.item} (${item.category})`} size="small" variant="outlined" />
                ))}
              </Stack>

              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Edit transaction">
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => editTransaction(transaction)}
                    disabled={saving}
                  >
                    Edit
                  </Button>
                </Tooltip>
                <Tooltip title="Delete transaction">
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon fontSize="small" />}
                    onClick={() => deleteTransaction(transaction.id)}
                    disabled={saving}
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
