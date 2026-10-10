# Conciliacion bancaria

## Objetivo del cambio
Permitir importar CSV/Excel del banco y conciliar movimientos contra transacciones existentes.

## Motivacion
La conciliacion confirma que los datos del sistema coinciden con el banco o tarjeta.

## Dolor que resuelve
Detecta gastos olvidados, duplicados o diferencias de monto. Reduce errores manuales.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_bank_imports.sql`: tablas `bank_imports` e `imported_bank_rows`.
- `api_finanzas/src/routes/imports.js`: subir/parsear archivos y sugerir matches.
- `api_finanzas/src/routes/transactions.js`: marcar transacciones como conciliadas.
- `finansas_personales/src/pages/BankImports.jsx`: UI de importacion y matching.
- `finansas_personales/src/pages/Transactions.jsx`: mostrar estado conciliado.
- `finansas_personales/src/utils/reconciliation.js`: heuristicas de matching por fecha/monto/texto.
