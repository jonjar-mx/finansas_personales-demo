# Estados de transaccion

## Objetivo del cambio
Agregar estados a las transacciones: `draft`, `pending`, `cleared`, `reconciled`.

## Motivacion
No todas las transacciones estan confirmadas al momento de cargarlas. Algunas estan pendientes o necesitan conciliacion bancaria.

## Dolor que resuelve
Evita mezclar movimientos estimados con confirmados y permite saber que falta revisar.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_transaction_status.sql`: columna `status` e indices.
- `api_finanzas/src/routes/transactions.js`: validar estado y filtros.
- `finansas_personales/src/pages/Transactions.jsx`: selector de estado y filtros.
- `finansas_personales/src/pages/BudgetDashboard.jsx`: decidir si KPIs incluyen pendientes.
- `finansas_personales/src/pages/AccountDetail.jsx`: mostrar estado en tablas de detalle.
