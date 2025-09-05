import prisma from './prisma'

// Helper functions for auth database operations
export async function ensureUserExists(user: {
  id: string
  email: string
  name?: string
  image?: string
}) {
  try {
    // Try to find existing user
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      // Create new user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      })
      console.log('✅ Created new user:', user.email)
    } else if (dbUser.id !== user.id) {
      // If email exists but id doesn't match, update the id
      // This handles migration from old auth system
      dbUser = await prisma.user.update({
        where: { email: user.email },
        data: { id: user.id, name: user.name, image: user.image }
      })
      console.log('🔄 Updated user id:', user.email)
    }

    return dbUser
  } catch (error) {
    console.error('Error ensuring user exists:', error)
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