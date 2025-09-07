// Optimized Query Library for Fake Medicine Detector
// Follows Prisma best practices for performance and scalability

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  // Connection optimization
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error']
})

// Optimized User Queries
export class OptimizedUserQueries {

  // Fast user lookup by email (using unique index)
  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        pointsBalance: true,
        // onboardingComplete: true, // Removed - field not in simplified schema
        createdAt: true
      }
    })
  }

  // Optimized user verification query (uses multiple indexes)
  static async getUserForVerification(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        pointsBalance: true,
        dailyPointsLastGiven: true
      }
    })
  }

  // Efficient user update for points deduction
  static async updateUserPoints(userId: string, newBalance: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: newBalance, updatedAt: new Date() },
      select: { id: true, pointsBalance: true, updatedAt: true }
    })
  }
}

// Optimized Product Verification Queries
export class OptimizedProductQueries {

  // Fast product check creation
  static async createProductCheck(data: {
    userId: string
    productName: string
    productDescription: string
    images: string[]
    batchNumber?: string
    ipAddress?: string
    location?: string
  }) {
    return prisma.productCheck.create({
      data: {
        ...data,
        pointsUsed: 1
      },
      select: { id: true, userId: true, createdAt: true }
    })
  }

  // Optimized user history query (uses compound index)
  static async getUserVerificationHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    return prisma.productCheck.findMany({
      where: { userId },
      select: {
        id: true,
        productName: true,
        batchNumber: true,
        createdAt: true,
        checkResults: {
          select: {
            isCounterfeit: true,
            confidence: true,
            alertType: true,
            batchNumber: true
          },
          orderBy: { scrapedAt: 'desc' },
          take: 1
        }
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      skip: offset
    })
  }

  // Efficient batch number lookup
  static async findByBatchNumber(batchNumber: string) {
    return prisma.productCheck.findMany({
      where: {
        batchNumber: {
          equals: batchNumber,
          mode: 'insensitive'
        }
      },
      include: {
        checkResults: {
          where: { isCounterfeit: true },
          select: {
            confidence: true,
            alertType: true,
            batchNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  }
}

// Optimized NAFDAC Alert Queries
export class OptimizedNafdacQueries {

  // Ultra-fast batch number search (compound index)
  static async findAlertsByBatchNumber(
    batchNumber: string,
    limit: number = 10
  ) {
    return prisma.nafdacAlert.findMany({
      where: {
        active: true,
        batchNumbers: {
          has: batchNumber.toUpperCase()
        }
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        batchNumbers: true,
        severity: true,
        alertType: true,
        manufacturer: true,
        scrapedAt: true
      },
      orderBy: [
        { similarity_score: 'desc' },
        { scrapedAt: 'desc' }
      ],
      take: limit
    })
  }

  // Optimized fuzzy text search using GIN indexes
  static async fuzzyProductSearch(
    searchTerm: string,
    limit: number = 25
  ) {
    // Use raw SQL for performance-critical fuzzy searches
    const alerts = await prisma.$queryRaw`
      SELECT
        id, title, excerpt, "batchNumbers", severity, "alertType",
        manufacturer, "scrapedAt", similarity_score,
        similarity(title, ${searchTerm}) as title_similarity,
        similarity(excerpt, ${searchTerm}) as excerpt_similarity
      FROM "NafdacAlert"
      WHERE
        active = true AND
        (
          title % ${searchTerm} OR
          excerpt % ${searchTerm} OR
          manufacturer % ${searchTerm}
        )
      ORDER BY
        CASE
          WHEN title % ${searchTerm} THEN 1
          WHEN excerpt % ${searchTerm} THEN 2
          ELSE 3
        END,
        similarity_score DESC,
        GREATEST(
          similarity(title, ${searchTerm}),
          similarity(excerpt, ${searchTerm})
        ) DESC
      LIMIT ${limit}
    `

    return alerts
  }

  // Fast manufacturer-specific alerts
  static async getAlertsByManufacturer(
    manufacturer: string,
    limit: number = 50
  ) {
    return prisma.nafdacAlert.findMany({
      where: {
        active: true,
        manufacturer: {
          contains: manufacturer,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        manufacturer: true,
        batchNumbers: true,
        alertType: true,
        severity: true,
        scrapedAt: true
      },
      orderBy: [
        { scrapedAt: 'desc' },
        { severity: 'desc' }
      ],
      take: limit
    })
  }

  // High-confidence counterfeit detection query
  static async getHighConfidenceAlerts(minConfidence: number = 0.8) {
    return prisma.nafdacAlert.findMany({
      where: {
        active: true,
        similarity_score: {
          gte: minConfidence
        },
        OR: [
          { severity: 'HIGH' },
          { severity: 'CRITICAL' }
        ]
      },
      select: {
        id: true,
        title: true,
        severity: true,
        batchNumbers: true,
        alertType: true,
        manufacturer: true
      },
      orderBy: [
        { similarity_score: 'desc' },
        { severity: 'desc' }
      ]
    })
  }

  // Recent alerts query (compound index optimization)
  static async getRecentAlerts(hoursBack: number = 24) {
    const cutoffDate = new Date(Date.now() - (hoursBack * 60 * 60 * 1000))

    return prisma.nafdacAlert.findMany({
      where: {
        active: true,
        scrapedAt: {
          gte: cutoffDate
        }
      },
      select: {
        id: true,
        title: true,
        alertType: true,
        severity: true,
        batchNumbers: true,
        scrapedAt: true
      },
      orderBy: { scrapedAt: 'desc' }
    })
  }
}

// Optimized Result Queries
export class OptimizedResultQueries {

  // Fast result lookup by product check ID
  static async getResultsByProductCheck(productCheckId: string) {
    return prisma.checkResult.findMany({
      where: { productCheckId },
      select: {
        id: true,
        isCounterfeit: true,
        confidence: true,
        alertType: true,
        batchNumber: true,
        summary: true,
        sourceUrl: true,
        scrapedAt: true
      },
      orderBy: { scrapedAt: 'desc' }
    })
  }

  // Optimized suspicious results query (compound index)
  static async getSuspiciousResults(limit: number = 50) {
    return prisma.checkResult.findMany({
      where: {
        isCounterfeit: true,
        confidence: {
          gte: 60
        }
      },
      include: {
        productCheck: {
          select: {
            userId: true,
            productName: true,
            batchNumber: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { confidence: 'desc' },
        { scrapedAt: 'desc' }
      ],
      take: limit
    })
  }

  // Efficient verification result creation
  static async createVerificationResult(data: {
    userId: string
    productCheckId: string
    isCounterfeit: boolean
    summary: string
    sourceUrl: string
    batchNumber?: string
    alertType: string
    confidence: number
  }) {
    return prisma.checkResult.create({
      data: {
        userId: data.userId,
        productCheckId: data.productCheckId,
        isCounterfeit: data.isCounterfeit,
        summary: data.summary,
        sourceUrl: data.sourceUrl,
        source: 'NAFDAC',
        batchNumber: data.batchNumber,
        alertType: data.alertType,
        confidence: data.confidence
      },
      select: {
        id: true,
        productCheckId: true,
        isCounterfeit: true,
        confidence: true,
        scrapedAt: true
      }
    })
  }
}

// Optimized Payment Queries
export class OptimizedPaymentQueries {

  // Fast payment lookup by transaction ID
  static async getPaymentByTransactionId(transactionId: string) {
    return prisma.payment.findUnique({
      where: { transactionId },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        pointsPurchased: true,
        gatewayResponse: true
      }
    })
  }

  // Optimized user payment history
  static async getUserPaymentHistory(
    userId: string,
    limit: number = 20
  ) {
    return prisma.payment.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        status: true,
        pointsPurchased: true,
        paymentGateway: true,
        createdAt: true,
        processedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Efficient webhook processing
  static async markPaymentProcessed(
    transactionId: string,
    newStatus: string,
    gatewayResponse?: any
  ) {
    return prisma.payment.update({
      where: { transactionId },
      data: {
        status: newStatus as any,
        gatewayResponse,
        processedAt: new Date(),
        webhookProcessed: true
      },
      select: {
        id: true,
        userId: true,
        status: true,
        pointsPurchased: true,
        processedAt: true
      }
    })
  }
}

// Scraper Status Queries
export class OptimizedScraperQueries {

  // Fast status check
  static async getScraperStatus() {
    return prisma.scraperStatus.findFirst({
      orderBy: { lastUpdated: 'desc' },
      select: {
        isScraping: true,
        lastScrapedAt: true,
        lastError: true,
        lastUpdated: true
      }
    })
  }

  // Efficient status update
  static async updateScraperStatus(
    isScraping: boolean,
    error?: string
  ) {
    return prisma.scraperStatus.upsert({
      where: { id: 'main-scraper' }, // You might want to adjust this
      update: {
        isScraping,
        lastScrapedAt: isScraping ? new Date() : undefined,
        lastError: error,
        lastUpdated: new Date()
      },
      create: {
        id: 'main-scraper',
        isScraping,
        lastScrapedAt: isScraping ? new Date() : undefined,
        lastError: error
      }
    })
  }
}

// Connection management
export { prisma }

// Helper for connection cleanup
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

// Performance monitoring helper
export async function getQueryMetrics() {
  return {
    connectionCount: await prisma.$queryRaw`SELECT count(*) as connections FROM pg_stat_activity`,
    tableSizes: await prisma.$queryRaw`
      SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 5
    `,
    slowQueries: await prisma.$queryRaw`
      SELECT query, total_time, calls
      FROM pg_stat_statements
      WHERE total_time > 1000
      ORDER BY total_time DESC
      LIMIT 5
    `
  }
}
