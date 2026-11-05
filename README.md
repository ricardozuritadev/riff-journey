# Riff Journey

Aplicación web personal para organizar challenges de aprendizaje de guitarra: elige una banda, recorre su discografía, practica canciones y márcalas como dominadas solo cuando cumples criterios reales de mastery.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind CSS 4 + shadcn/ui (tema oscuro)
- IndexedDB vía Dexie (local-first, sin backend ni auth)
- Zod + React Hook Form
- Vitest + Playwright

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La primera carga siembra datos de ejemplo: **SUM 41 → All Killer No Filler → Nothing on My Back**.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm test` | Tests unitarios (dominio + repos) |
| `npm run test:e2e` | Smoke E2E (requiere `npm run build && npm run start` en otra terminal) |
| `npm run lint` | ESLint |

## Datos

Todo vive en IndexedDB del navegador. En **Ajustes** puedes exportar/importar un backup JSON (recomendado en iPhone/Safari).

## Estructura

- `src/app` — rutas App Router
- `src/features` — pantallas por dominio
- `src/domain` — tipos, esquemas y reglas de negocio
- `src/data` — Dexie, repositorios, seed e import/export
- `src/components` — UI compartida y layout
