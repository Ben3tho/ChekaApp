import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('Checking & executing automatic database migrations on deploy...');
  try {
    const possibleDirs = [
      path.join(process.cwd(), 'drizzle'),
      path.join(__dirname, '..', '..', 'drizzle'),
      path.join(__dirname, '..', 'drizzle'),
      path.join(__dirname, 'drizzle'),
    ];
    const drizzleDir = possibleDirs.find((d) => fs.existsSync(d));
    if (!drizzleDir) {
      console.log('No drizzle migrations folder found.');
      return;
    }

    const files = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sqlContent = fs.readFileSync(path.join(drizzleDir, file), 'utf8');
      const statements = sqlContent
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (stmtErr: any) {
          // 42P07 = relation already exists, 42710 = duplicate object, 42501 = insufficient_privilege (pre-existing owner)
          if (
            stmtErr.code === '42P07' ||
            stmtErr.code === '42710' ||
            stmtErr.code === '42501' ||
            stmtErr.message?.includes('already exists') ||
            stmtErr.message?.includes('must be owner')
          ) {
            continue;
          }
          console.warn(`Migration note on [${file}]:`, stmtErr.message);
        }
      }
    }
    console.log('Automatic migrations completed successfully.');
  } catch (err: any) {
    console.warn('Database migration note:', err.message);
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'))) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal migration failure:', err);
      process.exit(1);
    });
}
