import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', isAdmin: false },
        { status: 401 }
      )
    }

    // Check if user is admin (for now, check if email ends with admin@ domain)
    const isAdmin = session.user.email?.includes('admin@') ||
                   session.user.id === 'admin001' ||
                   session.user.email === 'admin@fakedetector.ng'

    // Also check admin role in database (future implementation)
    // const adminUser = await prisma.admin.findUnique({
    //   where: { userId: session.user.id }
    // })

    return NextResponse.json({
      isAdmin,
      userId: session.user.id,
      email: session.user.email,
      role: isAdmin ? 'admin' : 'user'
    })

  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { error: 'Server error', isAdmin: false },
      { status: 500 }
    )
  }
}
