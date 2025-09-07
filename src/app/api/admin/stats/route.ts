import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering for auth-required API routes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check admin access
    const session = await auth()
    const isAdmin = session?.user?.email?.includes('admin@') ||
                   session?.user?.id === 'admin001' ||
                   session?.user?.email === 'admin@fakedetector.ng'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get user statistics
    const totalUsers = await prisma.user.count()
    const activeUsersToday = await prisma.user.count({
      where: {
        // Users who have logged in within the last 24 hours (approximated by recent data)
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    // Get NAFDAC alert statistics
    const totalAlerts = await prisma.nafdacAlert.count()
    const activeAlerts = await prisma.nafdacAlert.count({
      where: { active: true }
    })

    // Get recent alert statistics (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentAlerts = await prisma.nafdacAlert.count({
      where: {
        scrapedAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Get product verification statistics for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const todayVerification = await prisma.checkResult.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Get AI usage statistics for today
    const todayAIUsage = await prisma.aIUsageRecord.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _count: { id: true },
      _sum: { cost: true }
    })

    // Get total AI usage this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthlyAIUsage = await prisma.aIUsageRecord.aggregate({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        }
      },
      _count: { id: true },
      _sum: { cost: true }
    })

    // Get user subscription statistics
    const subscriptionStats = await prisma.subscription.aggregate({
      where: { status: 'active' },
      _count: { id: true }
    })

    // Note: Contact submissions table doesn't exist in schema,
    // this would be added in future if contact form functionality is implemented
    const recentContacts = 0

    const stats = {
      users: {
        total: totalUsers,
        activeToday: activeUsersToday
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts,
        recent: recentAlerts
      },
      verification: {
        todayScans: todayVerification
      },
      aiUsage: {
        todayRequests: todayAIUsage._count.id,
        todaysCost: todayAIUsage._sum.cost || 0,
        monthlyRequests: monthlyAIUsage._count.id,
        monthlyCost: monthlyAIUsage._sum.cost || 0
      },
      subscriptions: {
        active: subscriptionStats._count.id || 0
      },
      contacts: {
        recentSubmissions: recentContacts
      },
      system: {
        lastScrape: new Date().toISOString(),
        version: "1.2.0",
        uptime: "Good"
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    )
  }
}
