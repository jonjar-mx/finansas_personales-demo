# Monedas y tipo de cambio

## Objetivo del cambio
Soportar moneda base configurable, transacciones multi-moneda y tipo de cambio por movimiento.

## Motivacion
El sistema ya tiene campo de moneda, pero los totales se formatean de forma fija y no convierten valores.

## Dolor que resuelve
Evita reportes inconsistentes cuando hay movimientos en MXN, USD u otras monedas.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_currency_exchange_rates.sql`: moneda base y tipos de cambio.
- `api_finanzas/src/routes/settings.js`: configuracion de moneda base.
- `api_finanzas/src/routes/transactions.js`: guardar tipo de cambio y monto convertido.
- `finansas_personales/src/context/BudgetContext.jsx`: cargar settings monetarios.
- `finansas_personales/src/pages/Transactions.jsx`: capturar tipo de cambio.
- `finansas_personales/src/utils/currency.js`: helpers de formato/conversion.
