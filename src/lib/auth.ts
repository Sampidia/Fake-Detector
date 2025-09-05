import NextAuth, { type DefaultSession } from "next-auth"
import type { JWT } from "next-auth/jwt"
import Google from "next-auth/providers/google"
import { ensureUserExists, getUserWithBalance } from "./auth-db"

export const { handlers, signIn, signOut, auth } = NextAuth({
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
      if (user) {
        // Ensure user exists in database
        await ensureUserExists({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        })
        token.id = user.id || token.sub
      }
      return token
    },

    async session({ session, token }: { session: DefaultSession; token: JWT }) {
      if (session.user && token && token.id && typeof token.id === 'string') {
        session.user.id = token.id

        // Get actual user data from database
        const dbUser = await getUserWithBalance(token.id)
        if (dbUser) {
          session.user.pointsBalance = dbUser.pointsBalance
        } else {
          // Fallback to default
          session.user.pointsBalance = 5
        }
      }
      return session
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
