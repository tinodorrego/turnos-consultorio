# ADR-001 · Stack y base de datos de desarrollo

**Estado:** aceptada · **Fecha:** 2026-11-26

## Decisión

- **Next.js 16 (App Router) + TypeScript.** La reserva se maneja con la URL (`?esp=…&dia=…&h=…`): cada paso es un link, funciona sin JavaScript, se puede compartir y el botón "atrás" del celular hace lo esperado.
- **PostgreSQL + Drizzle.** Esquema tipado, migraciones SQL versionadas y enums nativos.
- **Reglas de agenda como funciones puras** en `src/domain/agenda.ts`, probadas sin base de datos.
- **PGlite** (PostgreSQL en WebAssembly) en desarrollo y tests: `npm install && npm run dev` alcanza, y los tests corren contra el mismo motor. Con `DATABASE_URL` se usa PostgreSQL real.

## Consecuencias

- Los tests de integración crean una base en memoria por caso, con las mismas migraciones.
- PGlite es de un solo proceso: no sirve para producción con varias instancias. Para eso está `DATABASE_URL`.
