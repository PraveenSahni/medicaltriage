import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  istTriagePrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.istTriagePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.istTriagePrisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
