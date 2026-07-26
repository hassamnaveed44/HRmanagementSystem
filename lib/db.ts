import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Declare a global variable to prevent creating multiple Prisma Client instances in development mode
const globalForPrisma = global as unknown as { prismaObject: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prismaObject) {
    return globalForPrisma.prismaObject;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("CRITICAL: DATABASE_URL environment variable is not defined!");
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaObject = client;
  }

  return client;
}

/**
 * Shared Lazy Singleton Prisma Client instance.
 * Evaluated at runtime so process.env.DATABASE_URL is cleanly available on Vercel cold starts.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrismaClient();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
