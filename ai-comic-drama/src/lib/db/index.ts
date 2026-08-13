import Database from "better-sqlite3";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const useTurso = !!process.env.TURSO_URL;

export const db = useTurso
  ? drizzleLibsql(
      createClient({
        url: process.env.TURSO_URL!,
        authToken: process.env.TURSO_TOKEN,
      }),
      { schema },
    )
  : drizzleBetterSqlite(new Database(process.env.SQLITE_PATH ?? "./dev.db"), {
      schema,
    });

export { schema };
