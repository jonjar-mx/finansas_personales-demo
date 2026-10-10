import { useCallback, useEffect, useState } from 'react';
import { addMonths, format, subMonths } from 'date-fns';
import { financeApi, getApiErrorMessage } from '../api/financeApi';
import { BudgetContext } from './BudgetContextValue';

export const BudgetProvider = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [accountBalanceTransactions, setAccountBalanceTransactions] = useState([]);
  const [dashboardTotals, setDashboardTotals] = useState({
    budgeted: 0,
    spent: 0,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const monthString = format(currentMonth, 'yyyy-MM');

  const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const viewedMonthEnd = endOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(new Date());
  const accountBalanceCutoff = viewedMonthEnd > currentMonthEnd ? currentMonthEnd : viewedMonthEnd;
  const accountBalanceCutoffString = format(accountBalanceCutoff, 'yyyy-MM-dd');

  const loadAccounts = useCallback(async () => {
    const accountRows = await financeApi.getAccounts();
    setAccounts(accountRows);
    return accountRows;
  }, []);

  const loadCategories = useCallback(async () => {
    const categoryRows = await financeApi.getCategories();
    setCategories(categoryRows);
    return categoryRows;
  }, []);

  const loadMonthData = useCallback(async () => {
    const [dashboard, transactionRows, alertRows] = await Promise.all([
      financeApi.getDashboard(monthString),
      financeApi.getTransactions({ month: monthString }),
      financeApi.getAlerts({ month: monthString, includeCompleted: true }),
    ]);

    setBudgets(dashboard.budgets.map((budget) => ({
      id: budget.budgetId,
      categoryId: budget.categoryId,
      category: budget.category,
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      progress: budget.progress,
    })));
    setDashboardTotals(dashboard.totals);
    setTransactions(transactionRows);
    setAlerts(alertRows);

    void financeApi.getTransactions({ to: accountBalanceCutoffString })
      .then(setAccountBalanceTransactions)
      .catch((err) => setError(getApiErrorMessage(err)));
  }, [accountBalanceCutoffString, monthString]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await Promise.all([loadAccounts(), loadCategories(), loadMonthData()]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadAccounts, loadCategories, loadMonthData]);

  const refreshMonth = useCallback(async () => {
    setError('');

    try {
      await loadMonthData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, [loadMonthData]);

  const runMutation = useCallback(async (mutation, { refresh = refreshMonth } = {}) => {
    setSaving(true);
    setError('');

    try {
      const result = await mutation();
      await refresh();
      return result;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refreshMonth]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const createAccount = (account) => runMutation(
    () => financeApi.createAccount({
      ...account,
      isOwn: account.isOwn === true,
      isCredit: account.accountType === 'credit_card' || account.isCredit === true,
      creditLimit: Number(account.creditLimit || 0),
      accountType: account.accountType || (account.isCredit ? 'credit_card' : account.isOwn ? 'bank' : 'external'),
      isLiquid: account.isLiquid === true,
    }),
    { refresh: loadAccounts }
  );

  const updateAccount = (id, account) => runMutation(
    () => {
      const payload = {
        ...account,
        isCredit: account.accountType === 'credit_card' || account.isCredit === true,
        creditLimit: Number(account.creditLimit || 0),
        accountType: account.accountType || (account.isCredit ? 'credit_card' : account.isOwn ? 'bank' : 'external'),
        isLiquid: account.isLiquid === true,
      };

      if (account.isOwn !== undefined) {
        payload.isOwn = account.isOwn === true;
      }

      return financeApi.updateAccount(id, payload);
    },
    { refresh: loadAccounts }
  );

  const deleteAccount = (id) => runMutation(
    () => financeApi.deleteAccount(id),
    { refresh: refreshAll }
  );

  const addAccountMember = (id, member) => runMutation(
    () => financeApi.addAccountMember(id, member),
    { refresh: loadAccounts }
  );

  const updateAccountMember = (id, userId, member) => runMutation(
    () => financeApi.updateAccountMember(id, userId, member),
    { refresh: loadAccounts }
  );

  const removeAccountMember = (id, userId) => runMutation(
    () => financeApi.removeAccountMember(id, userId),
    { refresh: loadAccounts }
  );

  const createCategory = (category) => runMutation(
    () => financeApi.createCategory({
      ...category,
      sortOrder: Number(category.sortOrder || 0),
    }),
    { refresh: refreshAll }
  );

  const updateCategory = (id, category) => runMutation(
    () => financeApi.updateCategory(id, {
      ...category,
      sortOrder: Number(category.sortOrder || 0),
    }),
    { refresh: refreshAll }
  );

  const deleteCategory = (id) => runMutation(
    () => financeApi.deleteCategory(id),
    { refresh: refreshAll }
  );

  const saveBudget = (budget) => runMutation(() => financeApi.createBudget({
    categoryId: budget.categoryId,
    month: budget.month || monthString,
    amount: Number(budget.amount),
  }));

  const updateBudget = (id, budget) => runMutation(() => financeApi.updateBudget(id, {
    amount: Number(budget.amount),
  }));

  const deleteBudget = (id) => runMutation(() => financeApi.deleteBudget(id));

  const normalizeTransactionPayload = (transaction) => ({
    date: transaction.date,
    paidBy: transaction.paidBy,
    paidTo: transaction.paidTo,
    ticket: transaction.ticket || null,
    ticketLink: transaction.ticketLink || null,
    currency: transaction.currency || '$MX',
    transactionType: transaction.transactionType || transaction.type || 'expense',
    notes: transaction.notes || null,
    items: transaction.items.map((item) => ({
      categoryId: item.categoryId,
      item: item.item,
      units: Number(item.units),
      unitPrice: Number(item.unitPrice),
    })),
  });

  const createTransaction = (transaction) => runMutation(
    () => financeApi.createTransaction(normalizeTransactionPayload(transaction)),
    { refresh: refreshAll }
  );

  const updateTransaction = (id, transaction) => runMutation(
    () => financeApi.updateTransaction(id, normalizeTransactionPayload(transaction)),
    { refresh: refreshAll }
  );

  const deleteTransaction = (id) => runMutation(() => financeApi.deleteTransaction(id));

  const normalizeAlertPayload = (alert) => ({
    title: alert.title,
    description: alert.description || null,
    alertType: alert.alertType || 'payment',
    dueDate: alert.dueDate,
    amount: alert.amount === '' || alert.amount === null || alert.amount === undefined ? null : Number(alert.amount),
    accountId: alert.accountId || null,
    isPaid: alert.isPaid === true,
    isRecurring: alert.isRecurring === true,
    recurrence: alert.isRecurring === true ? (alert.recurrence || 'monthly') : null,
  });

  const createAlert = (alert) => runMutation(() => financeApi.createAlert(normalizeAlertPayload(alert)));
  const updateAlert = (id, alert) => runMutation(() => financeApi.updateAlert(id, normalizeAlertPayload(alert)));
  const deleteAlert = (id) => runMutation(() => financeApi.deleteAlert(id));

  const value = {
    currentMonth,
    setCurrentMonth,
    monthString,
    accounts,
    categories,
    budgets,
    transactions,
    alerts,
    accountBalanceTransactions,
    dashboardTotals,
    loading,
    saving,
    error,
    clearError: () => setError(''),
    refreshAll,
    refreshMonth,
    createAccount,
    updateAccount,
    deleteAccount,
    addAccountMember,
    updateAccountMember,
    removeAccountMember,
    createCategory,
    updateCategory,
    deleteCategory,
    saveBudget,
    updateBudget,
    deleteBudget,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createAlert,
    updateAlert,
    deleteAlert,
    nextMonth: () => setCurrentMonth((month) => addMonths(month, 1)),
    prevMonth: () => setCurrentMonth((month) => subMonths(month, 1)),
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};
