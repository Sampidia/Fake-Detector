import prisma from './prisma'

// Helper functions for auth database operations
export async function ensureUserExists(user: {
  id: string
  email: string
  name?: string
  image?: string
}) {
  try {
    // 📈 BEST PRACTICE: Atomic upsert prevents race conditions
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        // Always update these fields
        name: user.name,
        image: user.image,
        // TODO: Consider ID update if needed for auth system migrations
        // Current approach: Trust Google's ID consistency
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }
    })

    // Enhanced logging for debugging
    if (dbUser.updatedAt && dbUser.updatedAt > dbUser.createdAt) {
      console.log('🔄 Updated existing user:', user.email)
    } else {
      console.log('✨ Created new user:', user.email)
    }

    return dbUser
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error)
    // Re-throw to maintain error handling behavior
    throw error
  }
}

export async function getUserWithBalance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        pointsBalance: true
      }
    })
    return user
  } catch (error) {
    console.error('Error getting user with balance:', error)
    return null
  }
}
