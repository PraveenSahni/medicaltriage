const rawUrl = process.env.DATABASE_URL?.trim();

if (!rawUrl) {
  throw new Error("DATABASE_URL is required for database-backed tests");
}

const databaseUrl = new URL(rawUrl);
const databaseName = databaseUrl.pathname.replace(/^\//, "");
const allowedHosts = new Set(["127.0.0.1", "localhost", "postgres"]);

if (!allowedHosts.has(databaseUrl.hostname)) {
  throw new Error(`Refusing database-backed tests against non-local host: ${databaseUrl.hostname}`);
}

if (!databaseName.endsWith("_test")) {
  throw new Error(`Refusing database-backed tests against database without _test suffix: ${databaseName}`);
}

if (databaseUrl.protocol !== "postgresql:" && databaseUrl.protocol !== "postgres:") {
  throw new Error(`Unsupported test database protocol: ${databaseUrl.protocol}`);
}

if (process.env.CI !== "true" && process.env.NODE_ENV !== "test") {
  throw new Error("Database-backed tests require CI=true or NODE_ENV=test");
}

console.log(`Isolated test database approved: ${databaseUrl.hostname}/${databaseName}`);
