import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Configure the PostgreSQL Pool connection for Prisma 7 and Neon Cloud PostgreSQL.
 * Sets ssl: { rejectUnauthorized: false } for Vercel Serverless Function compatibility.
 */
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

// Declare a global variable to prevent creating multiple Prisma Client instances in development mode (hot reloading)
const globalForPrisma = global as unknown as { prismaObject: PrismaClient };

/**
 * Shared, singleton Prisma Client instance for Prisma 7.
 */
export const prisma =
  globalForPrisma.prismaObject ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaObject = prisma;
}
