import NextAuth, { type DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { JWT } from "next-auth/jwt"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github" // Optional additional provider
import prisma from "@/lib/prisma"
import { ensureUserExists, getUserWithBalance } from "./auth-db"

// MANUAL NEXTAUTH SETUP - Complete from Scratch
export const {
  handlers,
  auth,
  signIn,
  signOut
} = NextAuth({
  // 🗄️ DATABASE ADAPTER
  adapter: PrismaAdapter(prisma),

  // 🔐 AUTHENTICATION PROVIDERS
  providers: [
    // Primary Google OAuth Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Optional: Force re-authentication for production
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // Optional: Add GitHub provider (comment out if not needed)
    // GitHub({
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // })
  ],

  // 🏪 SESSION CONFIGURATION
  session: {
    strategy: "jwt", // Uses JWT for sessions (also available: "database")
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // 🔄 CALLBACKS - Custom Authentication Logic
  callbacks: {
    // JWT Token Enhancement
    async jwt({ token, user, account, profile }) {
      console.log("🔐 JWT Callback:", { userId: user?.id, tokenSub: token.sub })

      if (user) {
        // Ensure user exists in database when they sign in
        await ensureUserExists({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        })

        // Add user ID to token
        token.id = user.id || token.sub
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }

      return token
    },

    // Session Enhancement
    async session({ session, token }) {
      console.log("🎫 Session Callback:", { sessionEmail: session.user.email, tokenId: token.id })

      if (session.user && token && token.id && typeof token.id === 'string') {
        // Add user ID from token to session
        session.user.id = token.id

        // Add additional user data from database
        const dbUser = await getUserWithBalance(token.id)
        if (dbUser) {
          session.user.pointsBalance = dbUser.pointsBalance
        } else {
          // Fallback to default balance
          session.user.pointsBalance = 5
        }
      }

      return session
    },

    // Sign-in Authorization
    async signIn({ user, account, profile, email, credentials }) {
      console.log("✅ Sign-in Callback:", { provider: account?.provider, userEmail: user.email })

      // Additional sign-in logic can go here
      // Return false to block sign-in, true to allow

      return true
    },

    // Redirect Logic
    async redirect({ url, baseUrl }) {
      // Custom redirect logic
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },

  // 🎨 CUSTOM PAGES
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout", // Optional: custom sign out page
    error: "/auth/error", // Error handling page we created
    verifyRequest: "/auth/verify-request", // Optional: email verification
  },

  // 🔒 SECURITY SETTINGS
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  // Optional: Events for logging/authentication tracking
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("📝 Sign-in Event:", { userId: user.id, isNew: isNewUser })
    },

    async signOut(message) {
      console.log("👋 Sign-out Event:", { message })
    },

    async createUser({ user }) {
      console.log("👤 New User Created:", { userId: user.id, email: user.email })
    },

    async linkAccount({ user, account, profile }) {
      console.log("🔗 Account Linked:", { userId: user.id, provider: account.provider })
    }
  },

  // Optional: Custom error handling
  debug: process.env.NODE_ENV === "development",

  // Optional: Custom theme for auth pages
  theme: {
    colorScheme: "auto",
    brandColor: "", // Optional: your brand color
    logo: "", // Optional: your logo URL
  }
})

// 📝 TYPE DEFINITIONS - Compatible with main auth.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      pointsBalance: number // Custom field for your app
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    pointsBalance?: number // Custom field for your app
  }
}

// 🛡️ MIDDLEWARE HELPER
export const authConfig = {
  callbacks: {
    authorized: ({ token, request: { nextUrl } }: {
      token?: { id: string; email?: string };
      request: { nextUrl: { pathname: string } }
    }) => {
      // Protect admin routes
      if (nextUrl.pathname.startsWith("/admin")) {
        return !!token
      }
      return true
    },
  },
}

// 🔧 UTILITY FUNCTIONS
export async function getServerSession() {
  return await auth()
}

export async function getServerToken() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    throw new Error("Authentication required")
  }
  return session
}

// DEBUG FUNCTIONS
export async function debugAuth() {
  try {
    const session = await auth()
    return {
      authenticated: !!session,
      user: session?.user,
      env: {
        clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
        secret: process.env.AUTH_SECRET ? "✅ Set" : "❌ Missing",
        nextAuthUrl: process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing",
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
