# Saldos de credito y disponible

## Objetivo del cambio
Mejorar las cuentas de credito para mostrar limite, credito usado, credito disponible, fecha de corte, fecha limite de pago, pago minimo y pago para no generar intereses.

## Motivacion
Una cuenta de credito no se comporta como una cuenta bancaria. El usuario necesita ver deuda usada y capacidad disponible, no solo un saldo neto.

## Dolor que resuelve
Reduce confusion al revisar tarjetas: saber cuanto se debe, cuanto queda disponible y cuando pagar para evitar intereses.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_credit_account_fields.sql`: agregar fechas de corte/pago y pagos sugeridos.
- `api_finanzas/src/routes/accounts.js`: CRUD de campos de credito.
- `finansas_personales/src/pages/Accounts.jsx`: editar datos de tarjeta.
- `finansas_personales/src/pages/BudgetDashboard.jsx`: KPIs de deuda usada/disponible.
- `finansas_personales/src/pages/AccountDetail.jsx`: detalle de movimientos y estado de credito.
