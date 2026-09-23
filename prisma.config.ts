import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile();
} catch {
  // sem .env: usa as variáveis do ambiente
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
