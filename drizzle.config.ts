import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const isPostgresUrl = Boolean(
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'))
);

const sqlHost = process.env.SQL_HOST || (process.env.INSTANCE_CONNECTION_NAME ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}` : '127.0.0.1');
const sqlDbName = process.env.SQL_DB_NAME || 'cheka_db';
const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres';
const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || 'postgres';

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: isPostgresUrl && process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
      }
    : {
        host: sqlHost,
        user: user,
        password: password,
        database: sqlDbName,
        ssl: false,
      },
  verbose: true,
});
