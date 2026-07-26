import { PrismaClient } from "@prisma/client";

// Declare a global variable to prevent creating multiple Prisma Client instances in development mode (hot reloading)
const globalForPrisma = global as unknown as { prismaObject: PrismaClient };

/**
 * Shared, singleton Prisma Client instance.
 * Optimized for serverless Next.js App Router on Vercel and Neon Cloud PostgreSQL.
 */
export const prisma =
  globalForPrisma.prismaObject ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaObject = prisma;
}
