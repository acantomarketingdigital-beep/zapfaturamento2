import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL nao configurada.");
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "database", "migrations");
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    const sql = await fs.readFile(migrationPath, "utf8");

    await client.query(sql);
    console.info(`Migration executada: ${file}`);
  }

  console.info("Todas as migrations foram executadas com sucesso.");
} finally {
  await client.end();
}
