import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SavingsIcon from '@mui/icons-material/Savings';
import TableChartIcon from '@mui/icons-material/TableChart';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WalletIcon from '@mui/icons-material/Wallet';
import { useContext, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import { BudgetContext } from '../context/BudgetContextValue';
import {
  buildAccountAnalytics,
  buildAccountBalance,
  buildAccountTotals,
  getAccountType,
  getAccountTypeLabel,
  getIsLiquid,
  isDebtAccount,
} from '../utils/accountAnalytics';
import MonthFilter from '../components/MonthFilter';
import AsyncFreeSoloSelect from '../components/AsyncFreeSoloSelect';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});


const transactionDraftKey = 'finanzas_transaction_draft_v1';

const summaryCardStyles = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
};

const getOptionName = (option) => option?.name || '';
const getOptionId = (option) => option?.id || '';
const getSelectedOptionName = (value, options) => options.find((option) => option.id === value)?.name || '';
const budgetScopeOptions = [
  { id: '', name: 'Todo el gasto' },
  { id: 'in_budget', name: 'Spent in budget' },
  { id: 'out_budget', name: 'Spent out budget' },
];
const budgetScopeIds = new Set(budgetScopeOptions.map((option) => option.id));
const exportOptions = [
  { id: 'xlsx', label: 'XLSX', icon: <TableChartIcon fontSize="small" /> },
  { id: 'csv', label: 'CSV', icon: <InsertDriveFileIcon fontSize="small" /> },
  { id: 'json', label: 'JSON', icon: <InsertDriveFileIcon fontSize="small" /> },
  { id: 'pdf', label: 'PDF', icon: <PictureAsPdfIcon fontSize="small" /> },
];

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    accounts,
    budgets,
    categories,
    transactions,
    accountBalanceTransactions,
    error,
    monthString,
    nextMonth,
    prevMonth,
  } = useContext(BudgetContext);
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [downloadAnchor, setDownloadAnchor] = useState(null);
  const ownAccounts = useMemo(() => accounts.filter((account) => account.isOwn), [accounts]);
  const selectorAccounts = accounts;
  const accountSelectorOptions = useMemo(() => [{ id: 'all', name: 'Todas las cuentas' }, ...selectorAccounts], [selectorAccounts]);
  const isOverview = accountId === 'all';
  const account = isOverview ? null : accounts.find((item) => item.id === accountId);
  const selectedAccounts = useMemo(() => {
    if (isOverview) return ownAccounts;
    return account ? [account] : [];
  }, [account, isOverview, ownAccounts]);
  const accountNames = useMemo(() => new Set(selectedAccounts.map((item) => String(item.name || '').trim())), [selectedAccounts]);
  const analytics = useMemo(() => buildAccountAnalytics({ accountNames, transactions, categories }), [accountNames, categories, transactions]);
  const budgetedCategoryIds = useMemo(() => new Set(budgets.map((budget) => String(budget.categoryId || ''))), [budgets]);
  const requestedBudgetScope = searchParams.get('budgetScope') || '';
  const selectedBudgetScope = budgetScopeIds.has(requestedBudgetScope) ? requestedBudgetScope : '';
  const scopedExpenseRows = useMemo(
    () => filterRowsByBudgetScope(analytics.expenseRows, selectedBudgetScope, budgetedCategoryIds),
    [analytics.expenseRows, budgetedCategoryIds, selectedBudgetScope]
  );
  const scopedExpenseData = useMemo(() => buildPieDataFromRows(scopedExpenseRows), [scopedExpenseRows]);
  const scopedExpenseTotal = useMemo(() => totalRowsAmount(scopedExpenseRows), [scopedExpenseRows]);
  const incomeCategoryOptions = useMemo(() => analytics.income.map((item) => item.name), [analytics.income]);
  const expenseCategoryOptions = useMemo(() => scopedExpenseData.map((item) => item.name), [scopedExpenseData]);
  const selectedIncomeCategory = incomeCategoryOptions.includes(incomeCategoryFilter) ? incomeCategoryFilter : '';
  const selectedExpenseCategory = expenseCategoryOptions.includes(expenseCategoryFilter) ? expenseCategoryFilter : '';
  const filteredIncomeRows = useMemo(() => filterRowsByCategory(analytics.incomeRows, selectedIncomeCategory), [analytics.incomeRows, selectedIncomeCategory]);
  const filteredExpenseRows = useMemo(
    () => filterRowsByCategory(scopedExpenseRows, selectedExpenseCategory),
    [scopedExpenseRows, selectedExpenseCategory]
  );
  const accountKpis = useMemo(() => selectedAccounts.map((item) => buildAccountKpi(item, transactions, accountBalanceTransactions)), [accountBalanceTransactions, selectedAccounts, transactions]);
  const accountKpiTotals = useMemo(() => {
    const financialTotals = buildAccountTotals(accountKpis);

    return accountKpis.reduce((current, item) => ({
      ...financialTotals,
      balance: current.balance + item.balance,
      income: current.income + item.income,
      expenses: current.expenses + item.expenses,
      creditLimit: current.creditLimit + (item.isCredit ? item.creditLimit : 0),
      creditAvailable: current.creditAvailable + (item.isCredit ? item.creditAvailable : 0),
      creditAccounts: current.creditAccounts + (item.isCredit ? 1 : 0),
    }), { balance: 0, income: 0, expenses: 0, creditLimit: 0, creditAvailable: 0, creditAccounts: 0, ...financialTotals });
  }, [accountKpis]);
  const title = isOverview ? 'Todas las cuentas' : account?.name || 'Cuenta no encontrada';
  const selectedAccount = accountKpis[0];
  const exportPayload = useMemo(() => buildExportPayload({
    title,
    monthString,
    selectedIncomeCategory,
    selectedExpenseCategory,
    selectedBudgetScope,
    incomeRows: filteredIncomeRows,
    expenseRows: filteredExpenseRows,
    incomeChartData: buildPieDataFromRows(filteredIncomeRows),
    expenseChartData: buildPieDataFromRows(filteredExpenseRows),
    accountKpiTotals,
  }), [
    accountKpiTotals,
    filteredExpenseRows,
    filteredIncomeRows,
    monthString,
    selectedBudgetScope,
    selectedExpenseCategory,
    selectedIncomeCategory,
    title,
  ]);

  const handleAccountChange = (value) => {
    const search = searchParams.toString();
    navigate("/accounts/" + (value || 'all') + "/detail" + (search ? `?${search}` : ''));
  };

  const handleBudgetScopeChange = (value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set('budgetScope', value);
    } else {
      nextParams.delete('budgetScope');
    }

    setSearchParams(nextParams);
  };

  const handleDownload = async (format) => {
    setDownloadAnchor(null);

    if (format === 'xlsx') {
      await downloadXlsx(exportPayload);
      return;
    }

    if (format === 'csv') {
      downloadCsv(exportPayload);
      return;
    }

    if (format === 'json') {
      downloadJson(exportPayload);
      return;
    }

    if (format === 'pdf') {
      await downloadPdf(reportRef.current, exportPayload.fileBaseName);
    }
  };

  const openTransactionEditor = (transactionId) => {
    const transaction = transactions.find((item) => item.id === transactionId);
    if (!transaction) return;

    const wantsToEdit = window.confirm('¿Quieres editar esta transaccion?');
    if (!wantsToEdit) return;

    window.localStorage.setItem(transactionDraftKey, JSON.stringify(buildTransactionDraft(transaction)));
    navigate('/transactions');
  };

  if (!isOverview && !account) {
    return (
      <Stack spacing={2}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>Dashboard</Button>
        <Alert severity="warning">Cuenta no encontrada.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-end' }} spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
            detalle_cuenta
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 800 }}>
            {title}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <AsyncFreeSoloSelect
            label="Cuenta"
            value={isOverview ? 'all' : accountId}
            options={accountSelectorOptions}
            onChange={handleAccountChange}
            getOptionLabel={getOptionName}
            getOptionValue={getOptionId}
            getValueLabel={getSelectedOptionName}
            allowCustomValue={false}
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 240 } }}
          />
          <MonthFilter
            monthLabel={monthString}
            labelSx={{ color: 'text.secondary', fontWeight: 500 }}
            countLabel={`${analytics.incomeRows.length + analytics.expenseRows.length} movimientos`}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={(event) => setDownloadAnchor(event.currentTarget)}>Descargar</Button>
          <Menu
            anchorEl={downloadAnchor}
            open={Boolean(downloadAnchor)}
            onClose={() => setDownloadAnchor(null)}
          >
            {exportOptions.map((option) => (
              <MenuItem key={option.id} onClick={() => handleDownload(option.id)}>
                <ListItemIcon>{option.icon}</ListItemIcon>
                <ListItemText>{option.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>Dashboard</Button>
        </Stack>
      </Stack>

      <Stack ref={reportRef} spacing={{ xs: 2.5, md: 3 }}>
      <Paper sx={{ ...summaryCardStyles, boxShadow: 'none' }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5}>
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
                kpis_cuenta
              </Typography>
              <Typography variant="h6">Resumen financiero</Typography>
            </Box>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {isOverview ? (
                <>
                  <Chip label={`${accountKpis.length} propias`} color="primary" variant="outlined" />
                  {accountKpiTotals.liquidAccounts > 0 && <Chip label={`${accountKpiTotals.liquidAccounts} liquidas`} color="success" variant="outlined" />}
                  {accountKpiTotals.creditAccounts > 0 && <Chip icon={<CreditCardIcon />} label={`${accountKpiTotals.creditAccounts} credito`} color="secondary" variant="outlined" />}
                  {accountKpiTotals.debt > 0 && <Chip label="Deuda" color="error" variant="outlined" />}
                </>
              ) : selectedAccount ? (
                <AccountTags account={selectedAccount} />
              ) : null}
            </Stack>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
            <KpiItem icon={<WalletIcon sx={{ color: 'primary.main' }} />} label="Monto actual" value={accountKpiTotals.balance} />
            <KpiItem icon={<TrendingUpIcon sx={{ color: 'success.main' }} />} label="Ingresos del mes" value={accountKpiTotals.income} />
            <KpiItem icon={<TrendingDownIcon sx={{ color: 'warning.main' }} />} label="Gastos del mes" value={accountKpiTotals.expenses} />
            <KpiItem icon={<SavingsIcon sx={{ color: 'success.main' }} />} label="Liquidez disponible" value={accountKpiTotals.liquidBalance} />
            <KpiItem icon={<TrendingDownIcon sx={{ color: 'error.main' }} />} label="Deuda" value={accountKpiTotals.debt} />
            <KpiItem icon={<WalletIcon sx={{ color: 'primary.main' }} />} label="Patrimonio estimado" value={accountKpiTotals.netWorth} />
            {accountKpiTotals.creditAccounts > 0 && (
              <>
                <KpiItem icon={<CreditCardIcon sx={{ color: 'secondary.main' }} />} label="Limite de credito" value={accountKpiTotals.creditLimit} />
                <KpiItem icon={<CreditCardIcon sx={{ color: 'success.main' }} />} label="Credito disponible" value={accountKpiTotals.creditAvailable} />
              </>
            )}
          </Box>
        </Stack>
      </Paper>

      {(analytics.income.length > 0 || analytics.expenses.length > 0) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          {analytics.income.length > 0 && (
            <PiePanel
              title="Ingresos"
              icon={<TrendingUpIcon sx={{ color: 'success.main' }} />}
              total={analytics.incomeTotal}
              data={analytics.income}
              selectedCategory={selectedIncomeCategory}
              onCategorySelect={setIncomeCategoryFilter}
            />
          )}
          {scopedExpenseData.length > 0 && (
            <PiePanel
              title="Egresos"
              icon={<TrendingDownIcon sx={{ color: 'warning.main' }} />}
              total={scopedExpenseTotal}
              data={scopedExpenseData}
              selectedCategory={selectedExpenseCategory}
              onCategorySelect={setExpenseCategoryFilter}
            />
          )}
        </Box>
      )}

      <DetailTable
        title="Detalle de ingresos"
        rows={filteredIncomeRows}
        totalRows={analytics.incomeRows.length}
        categoryOptions={incomeCategoryOptions}
        selectedCategory={selectedIncomeCategory}
        onCategoryChange={setIncomeCategoryFilter}
        counterpartyLabel="Origen"
        onOpenTransaction={openTransactionEditor}
      />
      <DetailTable
        title="Detalle de egresos"
        rows={filteredExpenseRows}
        totalRows={analytics.expenseRows.length}
        categoryOptions={expenseCategoryOptions}
        selectedCategory={selectedExpenseCategory}
        onCategoryChange={setExpenseCategoryFilter}
        budgetScopeOptions={budgetScopeOptions}
        selectedBudgetScope={selectedBudgetScope}
        onBudgetScopeChange={handleBudgetScopeChange}
        counterpartyLabel="Destino"
        onOpenTransaction={openTransactionEditor}
      />
      </Stack>
    </Stack>
  );
}

function filterRowsByCategory(rows, category) {
  if (!category) return rows;
  return rows.filter((row) => row.category === category);
}

function filterRowsByBudgetScope(rows, budgetScope, budgetedCategoryIds) {
  if (!budgetScope) return rows;

  return rows.filter((row) => {
    const isBudgeted = budgetedCategoryIds.has(String(row.categoryId || ''));
    return budgetScope === 'in_budget' ? isBudgeted : !isBudgeted;
  });
}

function buildPieDataFromRows(rows) {
  const rowsByCategory = rows.reduce((current, row) => {
    const category = row.category || 'Sin categoria';
    const currentCategory = current.get(category) || { name: category, value: 0, color: row.color };

    currentCategory.value += Number(row.amount || 0);
    current.set(category, currentCategory);

    return current;
  }, new Map());

  return [...rowsByCategory.values()]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function totalRowsAmount(rows) {
  return rows.reduce((total, row) => total + Number(row.amount || 0), 0);
}


function buildExportPayload({
  title,
  monthString,
  selectedIncomeCategory,
  selectedExpenseCategory,
  selectedBudgetScope,
  incomeRows,
  expenseRows,
  incomeChartData,
  expenseChartData,
  accountKpiTotals,
}) {
  const budgetScopeLabel = budgetScopeOptions.find((option) => option.id === selectedBudgetScope)?.name || 'Todo el gasto';
  const filters = {
    cuenta: title,
    mes: monthString,
    ingresosCategoria: selectedIncomeCategory || 'Todas las categorias',
    egresosCategoria: selectedExpenseCategory || 'Todas las categorias',
    presupuesto: budgetScopeLabel,
  };
  const rows = [
    ...incomeRows.map((row) => exportRow('Ingreso', row)),
    ...expenseRows.map((row) => exportRow('Egreso', row)),
  ];
  const fileBaseName = sanitizeFileName(`${title}-${monthString}-${selectedBudgetScope || 'detalle'}`);

  return {
    fileBaseName,
    filters,
    rows,
    incomeRows: incomeRows.map((row) => exportRow('Ingreso', row)),
    expenseRows: expenseRows.map((row) => exportRow('Egreso', row)),
    incomeChartData: incomeChartData.map(exportChartRow),
    expenseChartData: expenseChartData.map(exportChartRow),
    kpis: [
      { indicador: 'Monto actual', valor: accountKpiTotals.balance },
      { indicador: 'Ingresos del mes', valor: accountKpiTotals.income },
      { indicador: 'Gastos del mes', valor: accountKpiTotals.expenses },
      { indicador: 'Liquidez disponible', valor: accountKpiTotals.liquidBalance },
      { indicador: 'Deuda', valor: accountKpiTotals.debt },
      { indicador: 'Patrimonio estimado', valor: accountKpiTotals.netWorth },
      { indicador: 'Limite de credito', valor: accountKpiTotals.creditLimit },
      { indicador: 'Credito disponible', valor: accountKpiTotals.creditAvailable },
    ],
  };
}

function exportRow(type, row) {
  return {
    tipo: type,
    fecha: row.date,
    ticket: row.ticket,
    cuenta: row.account,
    contraparte: row.counterparty,
    categoria: row.category,
    item: row.item,
    unidades: Number(row.units || 0),
    precioUnitario: Number(row.unitPrice || 0),
    total: Number(row.amount || 0),
    transactionId: row.transactionId,
  };
}

function exportChartRow(row) {
  return {
    categoria: row.name,
    total: Number(row.value || 0),
  };
}

async function downloadXlsx(payload) {
  const { zipSync, strToU8 } = await import('fflate');
  const sheets = [
    { name: 'Movimientos', rows: payload.rows },
    { name: 'Resumen', rows: payload.kpis },
    { name: 'Filtros', rows: objectToRows(payload.filters) },
    { name: 'Grafico ingresos', rows: payload.incomeChartData },
    { name: 'Grafico egresos', rows: payload.expenseChartData },
  ];
  const files = buildXlsxFiles(sheets, strToU8);
  const zipped = zipSync(files);

  downloadBlob(`${payload.fileBaseName}.xlsx`, new Blob([zipped], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}

function buildXlsxFiles(sheets, strToU8) {
  const files = {
    '[Content_Types].xml': strToU8(buildContentTypesXml(sheets.length)),
    '_rels/.rels': strToU8(buildRootRelsXml()),
    'xl/workbook.xml': strToU8(buildWorkbookXml(sheets)),
    'xl/_rels/workbook.xml.rels': strToU8(buildWorkbookRelsXml(sheets.length)),
    'xl/styles.xml': strToU8(buildStylesXml()),
  };

  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(buildWorksheetXml(sheet.rows));
  });

  return files;
}

function buildContentTypesXml(sheetCount) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetOverrides}
</Types>`;
}

function buildRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildWorkbookXml(sheets) {
  const sheetXml = sheets.map((sheet, index) => (
    `<sheet name="${xmlEscape(excelSheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  )).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetXml}</sheets>
</workbook>`;
}

function buildWorkbookRelsXml(sheetCount) {
  const worksheetRels = Array.from({ length: sheetCount }, (_, index) => (
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  )).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${worksheetRels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`;
}

function buildWorksheetXml(rows) {
  const columns = columnsForRows(rows);
  const headerRow = buildExcelRow(1, columns, true);
  const dataRows = rows.map((row, index) => buildExcelRow(index + 2, columns.map((column) => row[column]), false)).join('');
  const columnWidths = columns.map((column, index) => (
    `<col min="${index + 1}" max="${index + 1}" width="${Math.min(Math.max(String(column).length + 4, 12), 36)}" customWidth="1"/>`
  )).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${columnWidths}</cols>
  <sheetData>${headerRow}${dataRows}</sheetData>
</worksheet>`;
}

function buildExcelRow(rowIndex, values, isHeader) {
  const cells = values.map((value, columnIndex) => buildExcelCell(rowIndex, columnIndex, value, isHeader)).join('');
  return `<row r="${rowIndex}">${cells}</row>`;
}

function buildExcelCell(rowIndex, columnIndex, value, isHeader) {
  const reference = `${excelColumnName(columnIndex + 1)}${rowIndex}`;
  const style = isHeader ? ' s="1"' : '';

  if (!isHeader && typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${reference}"${style}><v>${value}</v></c>`;
  }

  return `<c r="${reference}" t="inlineStr"${style}><is><t>${xmlEscape(value ?? '')}</t></is></c>`;
}

function columnsForRows(rows) {
  return [...rows.reduce((current, row) => {
    Object.keys(row).forEach((key) => current.add(key));
    return current;
  }, new Set())];
}

function excelColumnName(index) {
  let name = '';
  let current = index;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function excelSheetName(value) {
  return String(value || 'Hoja')
    .replace(/[\\/?*[\]:]/g, ' ')
    .slice(0, 31) || 'Hoja';
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadCsv(payload) {
  const rows = [
    ...objectToRows(payload.filters).map((row) => ({ seccion: 'Filtro', campo: row.campo, valor: row.valor })),
    {},
    ...payload.rows,
  ];

  downloadBlob(`${payload.fileBaseName}.csv`, new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
}

function downloadJson(payload) {
  downloadBlob(
    `${payload.fileBaseName}.json`,
    new Blob([JSON.stringify({ filtros: payload.filters, resumen: payload.kpis, graficos: { ingresos: payload.incomeChartData, egresos: payload.expenseChartData }, movimientos: payload.rows }, null, 2)], { type: 'application/json;charset=utf-8' })
  );
}

async function downloadPdf(element, fileBaseName) {
  if (!element) return;

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(element, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
  });
  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  let heightLeft = imageHeight;
  let position = 0;

  pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imageHeight;
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${fileBaseName}.pdf`);
}

function objectToRows(object) {
  return Object.entries(object).map(([campo, valor]) => ({ campo, valor }));
}

function toCsv(rows) {
  const columns = [...rows.reduce((current, row) => {
    Object.keys(row).forEach((key) => current.add(key));
    return current;
  }, new Set())];
  const lines = [columns.join(',')];

  rows.forEach((row) => {
    lines.push(columns.map((column) => csvCell(row[column])).join(','));
  });

  return `\ufeff${lines.join('\n')}`;
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function sanitizeFileName(value) {
  return String(value || 'detalle-cuenta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'detalle-cuenta';
}

function buildTransactionDraft(transaction) {
  return {
    invoice: {
      date: transaction.date,
      paidBy: transaction.paidBy || '',
      paidTo: transaction.paidTo || '',
      ticket: transaction.ticket || '',
      ticketLink: transaction.ticketLink || '',
      currency: transaction.currency || '$MX',
      transactionType: transaction.transactionType || transaction.type || 'expense',
      notes: transaction.notes || '',
    },
    items: transaction.items.map((item) => ({
      id: item.id || `${transaction.id}-${item.item}`,
      categoryId: item.categoryId || '',
      item: item.item || '',
      units: String(item.units ?? '1'),
      unitPrice: String(item.unitPrice ?? ''),
    })),
    editingTransaction: { id: transaction.id },
  };
}

function buildAccountKpi(account, transactions, accountBalanceTransactions) {
  const accountName = String(account.name || '').trim();
  const monthlyTotals = buildAccountBalance(accountName, transactions, { includeInternal: false });
  const balanceTotals = buildAccountBalance(accountName, accountBalanceTransactions);
  const balance = balanceTotals.income - balanceTotals.expenses;
  const accountType = getAccountType(account);

  return {
    id: account.id,
    name: account.name,
    balance,
    income: monthlyTotals.income,
    expenses: monthlyTotals.expenses,
    accountType,
    typeLabel: getAccountTypeLabel(account),
    isOwn: account.isOwn === true,
    isLiquid: getIsLiquid(account),
    isDebt: isDebtAccount(account),
    isCredit: accountType === 'credit_card',
    creditLimit: Number(account.creditLimit || 0),
    creditAvailable: accountType === 'credit_card' ? Number(account.creditLimit || 0) + balance : 0,
  };
}

function AccountTags({ account }) {
  return (
    <>
      <Chip label={account.isOwn ? 'Cuenta propia' : 'Cuenta externa'} color={account.isOwn ? 'primary' : 'default'} variant={account.isOwn ? 'filled' : 'outlined'} />
      <Chip label={account.typeLabel} color={account.isCredit ? 'secondary' : 'default'} icon={account.isCredit ? <CreditCardIcon /> : undefined} />
      <Chip label={account.isLiquid ? 'Liquida' : 'No liquida'} color={account.isLiquid ? 'success' : 'default'} variant="outlined" />
      {account.isDebt && <Chip label="Deuda" color="error" variant="outlined" />}
    </>
  );
}

function KpiItem({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
      {icon}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{currencyFormatter.format(value)}</Typography>
      </Box>
    </Stack>
  );
}

function PiePanel({ title, icon, total, data, selectedCategory, onCategorySelect }) {
  const handleCategorySelect = (category) => {
    onCategorySelect((currentCategory) => (currentCategory === category ? '' : category));
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)' }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            {icon}
            <Typography variant="h6">{title}</Typography>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{currencyFormatter.format(total)}</Typography>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '220px minmax(0, 1fr)' }, gap: 2, alignItems: 'center' }}>
          <Box sx={{ height: 220, minWidth: 0 }}>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={2}
                    onClick={(entry) => handleCategorySelect(entry.name)}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke={entry.color}
                        opacity={!selectedCategory || selectedCategory === entry.name ? 1 : 0.35}
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value) => currencyFormatter.format(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </Box>

          <Stack spacing={1}>
            {data.map((entry) => (
              <Stack
                key={entry.name}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1.5}
                role="button"
                tabIndex={0}
                onClick={() => handleCategorySelect(entry.name)}
                onKeyDown={(event) => { if (event.key === 'Enter') handleCategorySelect(entry.name); }}
                sx={{
                  px: 1,
                  py: 0.75,
                  mx: -1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: selectedCategory === entry.name ? 'action.selected' : 'transparent',
                  opacity: !selectedCategory || selectedCategory === entry.name ? 1 : 0.55,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{entry.name}</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{currencyFormatter.format(entry.value)}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function DetailTable({
  title,
  rows,
  totalRows,
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  budgetScopeOptions: tableBudgetScopeOptions = null,
  selectedBudgetScope = '',
  onBudgetScopeChange,
  counterpartyLabel,
  onOpenTransaction,
}) {
  const filterOptions = useMemo(() => [
    { id: '', name: 'Todas las categorias' },
    ...categoryOptions.map((category) => ({ id: category, name: category })),
  ], [categoryOptions]);

  return (
    <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1.5}
        sx={{ p: { xs: 2, sm: 2.5 }, pb: 1 }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {rows.length} de {totalRows} movimientos
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
          {tableBudgetScopeOptions && (
            <AsyncFreeSoloSelect
              label="Presupuesto"
              value={selectedBudgetScope}
              options={tableBudgetScopeOptions}
              onChange={onBudgetScopeChange}
              getOptionLabel={getOptionName}
              getOptionValue={getOptionId}
              getValueLabel={getSelectedOptionName}
              allowCustomValue={false}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 200 } }}
            />
          )}
          <AsyncFreeSoloSelect
            label="Categoria"
            value={selectedCategory}
            options={filterOptions}
            onChange={onCategoryChange}
            getOptionLabel={getOptionName}
            getOptionValue={getOptionId}
            getValueLabel={getSelectedOptionName}
            allowCustomValue={false}
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          />
        </Stack>
      </Stack>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: 'background.paper' }}>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Ticket</TableCell>
              <TableCell>{counterpartyLabel}</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Item</TableCell>
              <TableCell align="right">Unidades</TableCell>
              <TableCell align="right">Precio unitario</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>Sin movimientos.</TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                tabIndex={0}
                onClick={() => onOpenTransaction(row.transactionId)}
                onKeyDown={(event) => { if (event.key === 'Enter') onOpenTransaction(row.transactionId); }}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.ticket}</TableCell>
                <TableCell>{row.counterparty}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
                    <Typography variant="body2">{row.category}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{row.item}</TableCell>
                <TableCell align="right">{row.units}</TableCell>
                <TableCell align="right">{currencyFormatter.format(row.unitPrice)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{currencyFormatter.format(row.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
