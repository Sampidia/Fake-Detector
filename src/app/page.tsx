"use client"

import { Suspense, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Download, LayoutGrid, CreditCard, Shield, Clock, LogIn } from "lucide-react"
import Logo from "@/components/ui/logo"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BetaModal } from "@/components/ui/beta-modal"

// Mobile-Optimized Loading component
function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4 sm:space-y-6">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3 mx-auto"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false)

  const isAuthenticated = status === "authenticated"

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsBetaModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile-Optimized Header */}
      <MobileHeader showBackToHome={true} />

      {/* Mobile-Optimized Hero Section */}
      <section className="py-8 px-4 sm:py-12 md:py-20">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-6 gradient-text leading-tight">
              Verify Before You Buy
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-1 sm:px-2 max-w-2xl mx-auto">
              Protect your health with instant product verification powered by NAFDAC database. Scan, verify authenticity, and make informed purchasing decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <>
                <Link href="/scan">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg w-full sm:w-auto">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Start Scanning
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:shadow-md w-full sm:w-auto"
                  >
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Manage Points
                  </Button>
                </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg w-full sm:w-auto">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Sign In to Start Scanning
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:shadow-md w-full sm:w-auto"
                    >
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Sign In to Access Points
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile-Optimized Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-12 md:mt-16 px-2 sm:px-0">
            <Card className="text-center shadow-sm">
              <CardContent className="pt-4 sm:pt-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Instant Verification</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-tight">Real-time check against NAFDAC counterfeit database</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-sm">
              <CardContent className="pt-4 sm:pt-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Comprehensive Scans</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-tight">Front, back, and side views for thorough analysis</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-sm">
              <CardContent className="pt-4 sm:pt-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Point System</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-tight">Daily free points + purchase additional credits</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-sm">
              <CardContent className="pt-4 sm:pt-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Official Database</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-tight">Powered by NAFDAC official recall and safety alerts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile-Optimized How It Works Section */}
      <section className="py-12 sm:py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">How It Works</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
              Simple 3-step process to verify any product instantly
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Upload Photos</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">Take or upload photos from 4 angles: front, back, and both sides</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">Our system compares your product with NAFDAC counterfeit database</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Get Results</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">Receive detailed report with genuine/counterfeit status</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Statistics/Trust Indicators */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">10,000+</div>
              <div className="text-sm sm:text-base text-gray-600">Products Scanned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">95%</div>
              <div className="text-sm sm:text-base text-gray-600">Detection Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">100%</div>
              <div className="text-sm sm:text-base text-gray-600">NAFDAC Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Call to Action */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 px-2">
            Ready to Protect Your Health?
          </h2>
          <p className="text-base sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Start with free daily points and verify your first product today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link href="/scan">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600 transition-all duration-300 hover:shadow-lg hover:scale-105 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg w-full sm:w-auto">
                    Start Free Scan
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:shadow-md px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg w-full sm:w-auto"
                  >
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Manage Points
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600 transition-all duration-300 hover:shadow-lg hover:scale-105 px-8 py-4 text-lg">
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In for Free Access
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600 transition-all duration-300 hover:shadow-lg hover:scale-105 px-8 py-4 text-lg"
                  >
                    Learn More
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Footer */}
      <footer className="bg-gray-900 text-white py-4 sm:py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
            {/* Left Section: Logo and Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Logo />
              <span className="text-sm sm:text-base font-bold text-white">Fake Detector</span>
            </div>

            {/* Center Section: Download Badges */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={handleDownloadClick}
                className="transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                <img
                  src="/Google%20play.png"
                  alt="Join Beta Program - Android"
                  className="h-20 sm:h-24 w-auto hover:opacity-90"
                />
              </button>

              <button
                onClick={handleDownloadClick}
                className="transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                <img
                  src="/App%20Store.png"
                  alt="Join Beta Program - iOS"
                  className="h-20 sm:h-24 w-auto hover:opacity-90"
                />
              </button>
            </div>

            {/* Right Section: Database Info */}
            <div className="text-xs sm:text-sm text-gray-400 text-center lg:text-right">
              Utilize <strong className="text-blue-400">NAFDAC</strong> Official Database
            </div>
          </div>
        </div>
      </footer>

      {/* Beta Program Modal */}
      <BetaModal
        isOpen={isBetaModalOpen}
        onClose={() => setIsBetaModalOpen(false)}
      />
    </div>
  )
}
