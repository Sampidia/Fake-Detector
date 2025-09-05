"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Logo from "@/components/ui/logo"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Calendar,
  Hash
} from "lucide-react"

interface ScanResult {
  id: string
  productName: string
  isCounterfeit: boolean
  confidence: number
  createdAt: string
  batchNumber?: string
  alertType: string
}

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [results, setResults] = useState<ScanResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchAllScans()
    }
  }, [session])

  const fetchAllScans = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/recent-scans')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Remove the slice to show all results
          setResults(data.allScans || [])
        }
      } else {
        setError('Failed to load results')
      }
    } catch (err) {
      setError('Error loading results')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo />
              <Badge variant="secondary" className="text-xs">
                All Verification Results
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Verification History</h1>
                <p className="text-gray-600">
                  All your product verification results in one place
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{results.length}</p>
                <p className="text-sm text-gray-500">Total Scans</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Verified Products</p>
                    <p className="text-2xl font-bold">
                      {results.filter(r => !r.isCounterfeit).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Detected Counterfeit</p>
                    <p className="text-2xl font-bold">
                      {results.filter(r => r.isCounterfeit).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Eye className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Average Confidence</p>
                    <p className="text-2xl font-bold">
                      {results.length > 0
                        ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                        <div>
                          <div className="w-48 h-4 bg-gray-200 rounded mb-1"></div>
                          <div className="w-32 h-3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="text-center p-8">
              <CardContent>
                <p className="text-gray-600">{error}</p>
                <Button onClick={fetchAllScans} className="mt-4">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : results.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No results yet</h3>
                <p className="text-gray-600 mb-6">Start your first product verification to see results here.</p>
                <Link href="/scan">
                  <Button>Start Scanning</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/result/${result.id}`}
                        className="flex items-center gap-4 flex-1 hover:bg-gray-50 -m-4 p-4 rounded transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {result.isCounterfeit ? (
                              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {result.productName}
                              </h3>
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                              </div>
                              {result.batchNumber && (
                                <div className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  <span>{result.batchNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className={`text-sm font-bold ${
                            result.confidence >= 80 ? 'text-green-600' :
                            result.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {result.confidence}%
                          </div>
                          <div className="text-xs text-gray-400">Confidence</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {result.isCounterfeit ? (
                            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                              🔴 FAKE/RECALL/EXPIRED PRODUCT DETECTED
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              🔵 PRODUCT VERIFIED
                            </Badge>
                          )}
                        </div>

                        <Link href={`/result/${result.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
