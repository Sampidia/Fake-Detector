import NextAuth, { type DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { JWT } from "next-auth/jwt"
import Google from "next-auth/providers/google"
import prisma from "./prisma"
import { getUserWithBalance } from "./auth-db"

// ✅ CORRECT BEST PRACTICE CONFIGURATION - NextAuth with PrismaAdapter
export const { handlers, signIn, signOut, auth } = NextAuth({
  // 🔑 CRITICAL: PrismaAdapter automatically handles user creation!
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: DefaultSession["user"] }) {
      try {
        if (user) {
          // ✅ adapter automatically created user, just set token.id
          token.id = user.id || token.sub
          console.log('✅ JWT token created for user:', user.email)
        }
        return token
      } catch (error) {
        console.error('❌ JWT callback error:', error)
        return token
      }
    },

    async session({ session, token }: { session: DefaultSession; token: JWT }) {
      try {
        if (session?.user && token?.id && typeof token.id === 'string') {
          session.user.id = token.id

          // Get user data and balance from database
          const dbUser = await getUserWithBalance(token.id)
          if (dbUser) {
            session.user.pointsBalance = dbUser.pointsBalance
          } else {
            // Fallback to default
            session.user.pointsBalance = 5
            console.warn('⚠️ User not found in database, using default balance')
          }
        }
        return session
      } catch (error) {
        console.error('❌ Session callback error:', error)
        return session
      }
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.AUTH_SECRET,
})

// Extended NextAuth types for our User model
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      pointsBalance: number
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    pointsBalance?: number
  }
}
