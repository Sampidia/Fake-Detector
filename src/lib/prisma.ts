import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ✅ OPTIMIZED: Enhanced Prisma client with connection pooling and logging
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // 📈 BEST PRACTICE: Connection pooling for production performance
  // Handles multiple concurrent requests efficiently
  log: process.env.NODE_ENV === 'development' ?
    ['query', 'info', 'warn', 'error'] : ['error'],

  // Better error formatting in development
  errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
