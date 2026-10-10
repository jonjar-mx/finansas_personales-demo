# Transacciones recurrentes

## Objetivo del cambio
Permitir definir transacciones recurrentes para renta, servicios, suscripciones, sueldos y pagos periodicos.

## Motivacion
Muchos movimientos se repiten cada mes. Capturarlos manualmente consume tiempo y aumenta errores.

## Dolor que resuelve
Ahorra carga repetitiva y ayuda a planear gastos futuros antes de que ocurran.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_recurring_transactions.sql`: tabla de reglas recurrentes.
- `api_finanzas/src/routes/recurringTransactions.js`: CRUD de reglas y generacion de ocurrencias.
- `api_finanzas/src/routes/transactions.js`: soporte para crear transacciones desde regla.
- `finansas_personales/src/pages/RecurringTransactions.jsx`: pantalla de reglas.
- `finansas_personales/src/pages/Transactions.jsx`: opcion para convertir una transaccion en recurrente.
- `finansas_personales/src/components/Header.jsx`: agregar item de menu si se decide exponer pantalla propia.
