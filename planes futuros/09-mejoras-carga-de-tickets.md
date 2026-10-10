# Mejoras de carga de tickets

## Objetivo del cambio
Hacer mas rapida la captura de tickets con duplicar item, plantillas, autocompletar precio anterior, comercios frecuentes y eventualmente OCR.

## Motivacion
La carga item por item es potente, pero puede volverse repetitiva para compras similares.

## Dolor que resuelve
Reduce tiempo de captura y errores en precios/unidades/categorias.

## Archivos a agregar o modificar
- `finansas_personales/src/pages/Transactions.jsx`: duplicar item, plantillas y autocompletado mejorado.
- `finansas_personales/src/utils/itemSuggestions.js`: sugerencias por historial.
- `api_finanzas/src/routes/items.js`: endpoint opcional de sugerencias historicas.
- `postgres_finansas_personales/migrations/00X_item_aliases.sql`: aliases o plantillas de items.
- `finansas_personales/src/pages/TicketTemplates.jsx`: administracion de plantillas si crece la funcion.
