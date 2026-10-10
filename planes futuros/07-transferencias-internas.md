# Transferencias internas

## Objetivo del cambio
Distinguir transferencias entre cuentas propias de ingresos o gastos reales.

## Motivacion
Mover dinero de una cuenta propia a otra cambia saldos por cuenta, pero no deberia inflar ingresos o egresos globales.

## Dolor que resuelve
Evita reportes incorrectos donde una transferencia interna aparece como gasto o ingreso real.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_transaction_type.sql`: agregar `transaction_type` (`expense`, `income`, `transfer`, `credit_payment`).
- `api_finanzas/src/routes/transactions.js`: clasificar y filtrar por tipo.
- `finansas_personales/src/pages/Transactions.jsx`: selector de tipo y reglas automaticas.
- `finansas_personales/src/utils/accountAnalytics.js`: excluir transferencias de KPIs globales cuando corresponda.
- `finansas_personales/src/pages/BudgetDashboard.jsx`: KPIs limpios de ingresos/gastos reales.
