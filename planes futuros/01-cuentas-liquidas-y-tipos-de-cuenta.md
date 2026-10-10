# Cuentas liquidas y tipos de cuenta

## Objetivo del cambio
Agregar una clasificacion mas precisa de cuentas: liquidas/no liquidas y tipo de cuenta (`cash`, `bank`, `credit_card`, `loan`, `investment`, `external`).

## Motivacion
Hoy las cuentas propias y de credito ya existen, pero falta distinguir dinero disponible real de otros activos o pasivos. Esta separacion permite KPIs mas utiles como liquidez, deuda y patrimonio.

## Dolor que resuelve
Evita mezclar efectivo, bancos, tarjetas de credito, prestamos e inversiones en un unico total ambiguo. Ayuda a responder rapidamente cuanto dinero disponible hay hoy.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_account_types.sql`: agregar `account_type` e `is_liquid`.
- `api_finanzas/src/routes/accounts.js`: validar y exponer los nuevos campos.
- `finansas_personales/src/pages/Accounts.jsx`: agregar controles para tipo de cuenta y liquidez.
- `finansas_personales/src/pages/BudgetDashboard.jsx`: mostrar KPIs de liquidez y patrimonio.
- `finansas_personales/src/utils/accountAnalytics.js`: separar calculos por tipo/liquidez.
