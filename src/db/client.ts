/**
 * Conexión a PostgreSQL.
 * - Con DATABASE_URL: PostgreSQL real vía node-postgres.
 * - Sin DATABASE_URL: PGlite (PostgreSQL embebido) en ./.pglite, para desarrollo sin instalar nada.
 * Ver docs/decisiones/ADR-001-stack.md.
 */
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema";
import { sembrar } from "./seed";

export type Db = ReturnType<typeof drizzlePglite<typeof schema>> | ReturnType<typeof drizzlePg<typeof schema>>;

const migrationsFolder = path.join(process.cwd(), "drizzle");

/** Crea una base en memoria con migraciones y datos semilla (usada por los tests). */
export async function crearDbEnMemoria(): Promise<Db> {
  const db = drizzlePglite(new PGlite(), { schema });
  await migratePglite(db, { migrationsFolder });
  await sembrar(db);
  return db;
}

async function crearDb(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const db = drizzlePg(process.env.DATABASE_URL, { schema });
    await migratePg(db, { migrationsFolder });
    await sembrar(db);
    return db;
  }
  const db = drizzlePglite(new PGlite(path.join(process.cwd(), ".pglite")), { schema });
  await migratePglite(db, { migrationsFolder });
  await sembrar(db);
  return db;
}

const globalParaDb = globalThis as unknown as { __db?: Promise<Db> };

/** Instancia única por proceso (sobrevive al hot reload en desarrollo). */
export function obtenerDb(): Promise<Db> {
  globalParaDb.__db ??= crearDb();
  return globalParaDb.__db;
}
