# Reportes mensuales y tendencias

## Objetivo del cambio
Crear reportes comparativos mes contra mes: gastos por categoria, ingresos por cuenta, evolucion de saldos y top comercios/items.

## Motivacion
El dashboard actual muestra el mes, pero falta perspectiva historica para entender tendencias.

## Dolor que resuelve
Permite detectar aumentos de gasto, categorias problematicas y evolucion de patrimonio/liquidez.

## Archivos a agregar o modificar
- `api_finanzas/src/routes/reports.js`: endpoints agregados por rango de meses.
- `api_finanzas/src/routes/index.js`: registrar `/reports`.
- `finansas_personales/src/pages/Reports.jsx`: pantalla de reportes.
- `finansas_personales/src/utils/accountAnalytics.js`: reutilizar agregaciones y extender por rango.
- `finansas_personales/src/components/Header.jsx`: item de menu de reportes.
- `postgres_finansas_personales/queries/monthly_reports.sql`: queries agregadas por mes/categoria/cuenta.
