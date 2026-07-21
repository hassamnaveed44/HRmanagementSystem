import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Configure the PostgreSQL Pool connection using the DATABASE_URL environment variable.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured in the environment variables.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Declare a global variable to prevent creating multiple Prisma Client instances in development mode (hot reloading)
const globalForPrisma = global as unknown as { prismaObject: PrismaClient };

/**
 * Shared, singleton Prisma Client instance.
 * Instantiated using the PostgreSQL driver adapter for Prisma v7.
 */
export const prisma = globalForPrisma.prismaObject || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaObject = prisma;
}
