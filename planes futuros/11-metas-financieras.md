# Metas financieras

## Objetivo del cambio
Agregar metas de ahorro o pago de deuda con progreso, fecha objetivo y aportaciones relacionadas.

## Motivacion
Ademas de registrar gastos, la app puede ayudar a planear objetivos concretos como fondo de emergencia, viaje, inversion o liquidar deuda.

## Dolor que resuelve
Da visibilidad al avance hacia objetivos y evita que el presupuesto mensual quede desconectado de metas de largo plazo.

## Archivos a agregar o modificar
- `postgres_finansas_personales/migrations/00X_financial_goals.sql`: tabla `financial_goals` y aportaciones.
- `api_finanzas/src/routes/goals.js`: CRUD de metas y progreso.
- `api_finanzas/src/routes/index.js`: registrar `/goals`.
- `finansas_personales/src/pages/Goals.jsx`: pantalla de metas.
- `finansas_personales/src/pages/BudgetDashboard.jsx`: resumen de metas principales.
- `finansas_personales/src/components/Header.jsx`: opcion de menu si se usa pantalla dedicada.
