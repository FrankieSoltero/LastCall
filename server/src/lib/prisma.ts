import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: ['error', 'warn']
})

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
} 
