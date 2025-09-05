"use client"

import { Suspense, useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UploadForm } from "@/components/product-upload/upload-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Logo from "@/components/ui/logo"
import { Wallet, LogOut, LayoutGrid } from "lucide-react"

interface ScanStats {
  pointsBalance: number
  canClaimDaily: boolean
}

// Loading component
function UploadFormSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="animate-pulse space-y-8">
        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
          ))}
        </div>

        <div className="h-12 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  )
}

export default function ScanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAuthenticated = status === "authenticated"
  const [stats, setStats] = useState<ScanStats>({
    pointsBalance: 0,
    canClaimDaily: false
  })

  // Fetch user balance on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/balance')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStats(prev => ({
              ...prev,
              pointsBalance: data.data.pointsBalance,
              canClaimDaily: data.data.canClaimDailyPoints
            }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }

    if (session) {
      fetchUserData()
    }
  }, [session])

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" }).catch(console.error)
  }

  useEffect(() => {
    console.log('🔍 ScanPage session status:', status)
    console.log('🔍 ScanPage session data:', session)
    console.log('🔍 User ID:', session?.user?.id)
    console.log('🔍 User email:', session?.user?.email)
    console.log('🔍 User points balance:', session?.user?.pointsBalance)

    // FOR NOW: Just log, don't redirect
    if (status === "unauthenticated") {
      console.log('❌ User not authenticated - STAYING ON PAGE FOR DEBUG')
    } else if (status === "authenticated") {
      console.log('✅ User authenticated:', session?.user?.email)
    }
  }, [status, session]) // Removed router dependency temporarily

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your session...</p>
          </div>
        </div>
      </div>
    )
  }

  // FOR DEBUG: Show status on page instead of hiding content
  const authStatusMessage = isAuthenticated
    ? `✅ Authenticated as: ${session?.user?.email}`
    : `❌ Not authenticated`

  console.log('Page render - Auth status:', authStatusMessage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-4">
                <Logo />
                <span className="text-lg font-bold">Fake Detector</span>
              </Link>
              {isAuthenticated ? (
                <Badge variant="secondary" className="text-xs">
                  Welcome, {session.user?.name || session.user?.email}
                </Badge>
              ) : (
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-lg font-bold">Fake Detector</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">{stats.pointsBalance} points</span>
                  </div>

                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 hover:shadow-sm"
                    >
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  🔐 Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Suspense fallback={<UploadFormSkeleton />}>
          <UploadForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 flex items-center gap-2">
              <img src="/logo.png" alt="Fake Detector" className="h-10 w-10" />
              <span className="text-lg font-bold">Fake Detector</span>
            </div>

            <div className="text-sm text-gray-400">
              Utilize <strong className="text-blue-400">NAFDAC</strong> Official Database
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
