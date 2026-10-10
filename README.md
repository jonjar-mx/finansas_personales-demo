# Finanzas personales

Aplicacion React para registrar presupuestos mensuales y transacciones por
categoria. El proyecto usa Vite, React Router y Material UI. Los datos se
consumen desde la API local `api_finanzas`.

## Scripts

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera la version de produccion.
- `npm run lint`: ejecuta ESLint.

## API

Configura la URL de la API con:

```text
VITE_API_BASE_URL=http://localhost:4000/api
```

La API esperada es el proyecto local `~/Repos/api_finanzas`. En desarrollo usa
el usuario demo configurado por `DEV_USER_EMAIL` en la API.

## Seguridad y despliegue público

- No se guardan credenciales, claves privadas ni valores de producción en el repositorio. Usá variables de entorno locales y no subas archivos `.env`.
- CI se ejecuta en runners hospedados por GitHub, incluyendo las validaciones de pull requests.
- El despliegue solo se habilita después de un CI exitoso sobre `main`; nunca se ejecuta con credenciales desde un pull request no confiable.
- Para habilitar el despliegue, configurá estos nombres en GitHub Actions, sin publicar sus valores: secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PRIVATE_KEY`, `DEPLOY_KNOWN_HOSTS`, y la variable `DEPLOY_COMMAND`.
- La aplicación usa `VITE_API_BASE_URL` para la API. Mantené sus valores de desarrollo fuera del repositorio cuando contengan información interna.

## Datos para SDD

El sistema maneja tres entidades base:

- `Category`: nombre de una categoria de gasto o ahorro.
- `Budget`: presupuesto mensual por categoria, con `id`, `category` y `amount`.
- `Transaction`: movimiento con `id`, `date`, `category`, `description` y
  `amount`.

El contexto `src/context/BudgetContext.jsx` carga categorias, dashboard,
presupuestos y transacciones desde `api_finanzas`. Las operaciones de crear,
editar y eliminar se ejecutan por HTTP contra la API.

Flujos principales:

- Consultar el dashboard mensual de presupuestos.
- Avanzar o retroceder el mes visible.
- Agregar un presupuesto por categoria.
- Agregar transacciones.
- Ver el avance de gasto por categoria contra el presupuesto mensual.
