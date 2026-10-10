# Alertas y calendario de pagos

## Objetivo del cambio
Agregar recordatorios para pagos proximos, pagos vencidos, cortes de tarjetas, servicios recurrentes y alertas de presupuesto.

## Motivacion
El sistema ya registra movimientos, pero tambien debe ayudar a anticiparse a pagos importantes.

## Dolor que resuelve
Evita olvidar fechas limite, pagar intereses o pasarse del presupuesto sin darse cuenta.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_payment_alerts.sql`: tablas `payment_alerts` y/o `reminders`.
- `api_finanzas/src/routes/alerts.js`: endpoints CRUD y listado por fecha.
- `api_finanzas/src/routes/index.js`: registrar ruta `/alerts`.
- `finansas_personales/src/api/financeApi.js`: cliente de alertas.
- `finansas_personales/src/context/BudgetContext.jsx`: cargar alertas del mes.
- `finansas_personales/src/pages/BudgetDashboard.jsx`: widget de pagos proximos.
- `finansas_personales/src/pages/Alerts.jsx`: pantalla de administracion.
