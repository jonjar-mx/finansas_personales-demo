
export const ACCOUNT_TYPES = ['cash', 'bank', 'credit_card', 'loan', 'investment', 'external'];

export const ACCOUNT_TYPE_LABELS = {
  cash: 'Efectivo',
  bank: 'Banco',
  credit_card: 'Tarjeta de credito',
  loan: 'Prestamo',
  investment: 'Inversion',
  external: 'Externa',
};

export function getAccountType(account) {
  if (ACCOUNT_TYPES.includes(account?.accountType)) return account.accountType;
  if (account?.isCredit === true) return 'credit_card';
  if (account?.isOwn === false) return 'external';
  return 'bank';
}

export function getIsLiquid(account) {
  if (typeof account?.isLiquid === 'boolean') return account.isLiquid;
  return ['cash', 'bank'].includes(getAccountType(account));
}

export function getAccountTypeLabel(account) {
  return ACCOUNT_TYPE_LABELS[getAccountType(account)] || ACCOUNT_TYPE_LABELS.bank;
}

export function isDebtAccount(account) {
  return ['credit_card', 'loan'].includes(getAccountType(account));
}

export function buildAccountBalance(accountName, transactions, { includeInternal = true } = {}) {
  return transactions.reduce((current, transaction) => {
    if (!includeInternal && isInternalTransaction(transaction)) return current;

    const amount = Number(transaction.amount || 0);
    const paidBy = String(transaction.paidBy || '').trim();
    const paidTo = String(transaction.paidTo || '').trim();

    return {
      income: current.income + (paidTo === accountName ? amount : 0),
      expenses: current.expenses + (paidBy === accountName ? amount : 0),
    };
  }, { income: 0, expenses: 0 });
}

export function isInternalTransaction(transaction) {
  return ['transfer', 'credit_payment'].includes(transaction?.transactionType || transaction?.type);
}

export function buildAccountTotals(accounts) {
  return accounts.reduce((current, account) => {
    const balance = Number(account.balance || 0);
    const debt = isDebtAccount(account) ? Math.max(0, -balance) : 0;
    const asset = isDebtAccount(account) ? 0 : balance;

    return {
      liquidBalance: current.liquidBalance + (getIsLiquid(account) && !isDebtAccount(account) ? balance : 0),
      debt: current.debt + debt,
      netWorth: current.netWorth + asset - debt,
      liquidAccounts: current.liquidAccounts + (getIsLiquid(account) ? 1 : 0),
    };
  }, { liquidBalance: 0, debt: 0, netWorth: 0, liquidAccounts: 0 });
}

const fallbackColors = [
  '#38bdf8',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#14b8a6',
  '#f97316',
  '#e879f9',
];

export function categoryColorMap(categories) {
  return categories.reduce((current, category) => {
    const color = category.color || fallbackColorForCategory(category.name);

    if (category.id) current.byId[String(category.id)] = color;
    if (!current.byName[category.name]) current.byName[category.name] = color;

    return current;
  }, { byId: {}, byName: {} });
}

export function isAccountInScope(transactionAccountName, accountNames) {
  return accountNames.has(String(transactionAccountName || '').trim());
}

export function buildAccountAnalytics({ accountNames, transactions, categories }) {
  const colorMap = categoryColorMap(categories);
  const expensesByCategory = new Map();
  const incomeByCategory = new Map();
  const expenseRows = [];
  const incomeRows = [];

  transactions.forEach((transaction) => {
    if (isInternalTransaction(transaction)) return;

    const paidByMatches = isAccountInScope(transaction.paidBy, accountNames);
    const paidToMatches = isAccountInScope(transaction.paidTo, accountNames);

    transaction.items.forEach((item) => {
      const category = item.category || 'Sin categoria';
      const amount = Number(item.totalPrice || 0);
      const color = colorMap.byId[String(item.categoryId || '')] || colorMap.byName[category] || fallbackColorForCategory(category);

      if (paidByMatches) {
        addPieValue(expensesByCategory, category, amount, color);
        expenseRows.push({
          id: `${transaction.id}-${item.id}-expense`,
          transactionId: transaction.id,
          date: transaction.date,
          ticket: transaction.ticket || transaction.id,
          account: transaction.paidBy,
          counterparty: transaction.paidTo,
          categoryId: item.categoryId || '',
          category,
          item: item.item,
          units: item.units,
          unitPrice: item.unitPrice,
          amount,
          color,
        });
      }

      if (paidToMatches) {
        addPieValue(incomeByCategory, category, amount, color);
        incomeRows.push({
          id: `${transaction.id}-${item.id}-income`,
          transactionId: transaction.id,
          date: transaction.date,
          ticket: transaction.ticket || transaction.id,
          account: transaction.paidTo,
          counterparty: transaction.paidBy,
          categoryId: item.categoryId || '',
          category,
          item: item.item,
          units: item.units,
          unitPrice: item.unitPrice,
          amount,
          color,
        });
      }
    });
  });

  const expenses = mapToSortedData(expensesByCategory);
  const income = mapToSortedData(incomeByCategory);

  return {
    expenses,
    income,
    expenseRows,
    incomeRows,
    expenseTotal: total(expenses),
    incomeTotal: total(income),
  };
}

function fallbackColorForCategory(name) {
  const normalizedName = String(name || 'Sin categoria').trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalizedName.length; index += 1) {
    hash = ((hash << 5) - hash + normalizedName.charCodeAt(index)) | 0;
  }

  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

function addPieValue(map, name, amount, color) {
  const current = map.get(name) || { name, value: 0, color };
  current.value += amount;
  map.set(name, current);
}

function mapToSortedData(map) {
  return [...map.values()]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function total(items) {
  return items.reduce((sum, item) => sum + item.value, 0);
}
