import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SavingsIcon from '@mui/icons-material/Savings';
import { useContext, useEffect, useMemo, useState } from 'react';
import { BudgetContext } from '../context/BudgetContextValue';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import MonthFilter from '../components/MonthFilter';
import AsyncFreeSoloSelect from '../components/AsyncFreeSoloSelect';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const getCategoryLabel = (category) => category?.name || '';
const getCategoryValue = (category) => category?.id || '';
const getSelectedCategoryLabel = (value, categories) => categories.find((category) => category.id === value)?.name || '';

export default function Budgets() {
  const {
    currentMonth,
    monthString,
    categories,
    budgets,
    loading,
    saving,
    error,
    saveBudget,
    updateBudget,
    deleteBudget,
    nextMonth,
    prevMonth,
  } = useContext(BudgetContext);
  const [editingBudget, setEditingBudget] = useState(null);
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      categoryId: '',
      amount: '',
    },
  });
  const selectedCategoryId = watch('categoryId') || '';
  const categoryOptions = useMemo(() => categories, [categories]);

  useEffect(() => {
    if (editingBudget) {
      reset({
        categoryId: editingBudget.categoryId,
        amount: editingBudget.amount,
      });
      return;
    }

    reset({
      categoryId: categories[0]?.id || '',
      amount: '',
    });
  }, [categories, editingBudget, reset]);

  const onSubmit = async (budget) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, budget);
      setEditingBudget(null);
    } else {
      await saveBudget({ ...budget, month: monthString });
    }

    reset({
      categoryId: categories[0]?.id || '',
      amount: '',
    });
  };

  const cancelEdit = () => {
    setEditingBudget(null);
    reset({
      categoryId: categories[0]?.id || '',
      amount: '',
    });
  };

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
            budgets
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 800 }}>
            Presupuestos
          </Typography>
        </Box>
        <MonthFilter
          monthLabel={format(currentMonth, 'MMMM yyyy')}
          labelSx={{ color: 'text.secondary', fontWeight: 500 }}
          countLabel={budgets.length + ' presupuestos'}
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
            <SavingsIcon color="primary" />
            <Typography variant="h6">
              {editingBudget ? 'Edit monthly budget' : 'Add monthly budget'}
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 1fr) minmax(180px, 0.8fr) auto auto' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <AsyncFreeSoloSelect
              label="Category"
              value={selectedCategoryId}
              options={categoryOptions}
              onChange={(value) => setValue('categoryId', value, { shouldDirty: true })}
              getOptionLabel={getCategoryLabel}
              getOptionValue={getCategoryValue}
              getValueLabel={getSelectedCategoryLabel}
              allowCustomValue={false}
              required
              fullWidth
              disabled={Boolean(editingBudget)}
            />
            <TextField
              label="Amount"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              {...register('amount', { required: true, min: 0 })}
            />
            <Button type="submit" variant="contained" size="large" disabled={saving || categories.length === 0} sx={{ minHeight: 48 }}>
              {editingBudget ? 'Update' : 'Save budget'}
            </Button>
            {editingBudget && (
              <Button variant="outlined" size="large" onClick={cancelEdit} sx={{ minHeight: 48 }}>
                Cancel
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

      {loading ? (
        <Typography color="text.secondary">Loading budgets...</Typography>
      ) : budgets.length === 0 ? (
        <Typography color="text.secondary">No hay presupuestos para este mes.</Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {budgets.map((budget) => {
            const isOverBudget = budget.progress > 100;

            return (
              <Paper
                key={budget.id}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6">{budget.category}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currencyFormatter.format(budget.spent)} of {currencyFormatter.format(budget.amount)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        label={isOverBudget ? 'Over' : 'On track'}
                        color={isOverBudget ? 'error' : 'success'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Tooltip title="Edit budget">
                        <IconButton onClick={() => setEditingBudget(budget)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete budget">
                        <IconButton onClick={() => deleteBudget(budget.id)} size="small" color="error" disabled={saving}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(budget.progress, 100)}
                    color={isOverBudget ? 'error' : 'primary'}
                    sx={{ height: 10, borderRadius: 999 }}
                  />
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(budget.progress)}% used
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isOverBudget ? 'error.main' : 'text.primary' }}>
                      {currencyFormatter.format(budget.remaining)} remaining
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
