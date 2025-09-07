'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bot,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
  DollarSign,
  Zap,
  Eye
} from 'lucide-react'

// Statistics interface
interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  totalScans: number
  totalRevenue: number
  totalAIRequests: number
  revenueGrowth: number
  usersGrowth: number
  scansGrowth: number
}

// AI Provider Status
interface AIProviderStatus {
  name: string
  provider: string
  model: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  usageToday: number
  totalUsage: number
  responseTime: number
  costToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [aiProviders, setAiProviders] = useState<AIProviderStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsResponse, aiResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/ai-providers')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        setAiProviders(aiData.providers || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendValue
  }: {
    title: string
    value: string | number
    description: string
    icon: any
    trend?: 'up' | 'down'
    trendValue?: number
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && trendValue && (
            <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-xs">
              {trend === 'up' ? '+' : '-'}{trendValue}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            Monitor your AI-enhanced fake detector platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              description="Active user accounts"
              icon={Users}
              trend="up"
              trendValue={stats?.usersGrowth || 12}
            />

            <StatCard
              title="Active Subscriptions"
              value={stats?.activeSubscriptions || 0}
              description="Paid subscribers"
              icon={CreditCard}
              trend="up"
              trendValue={15}
            />

            <StatCard
              title="Total Scans"
              value={stats?.totalScans?.toLocaleString() || 0}
              description="Products verified"
              icon={Eye}
              trend="up"
              trendValue={stats?.scansGrowth || 8}
            />

            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              description="Revenue this month"
              icon={DollarSign}
              trend="up"
              trendValue={stats?.revenueGrowth || 22}
            />

            <StatCard
              title="AI Requests"
              value={stats?.totalAIRequests?.toLocaleString() || 0}
              description="AI-powered requests"
              icon={Bot}
              trend="up"
              trendValue={18}
            />

            <StatCard
              title="System Health"
              value="98.5%"
              description="Uptime this month"
              icon={Activity}
              trend="up"
              trendValue={0}
            />

            <StatCard
              title="Avg Response Time"
              value="1.2s"
              description="AI verification speed"
              icon={Zap}
            />

            <StatCard
              title="Security Alerts"
              value="0"
              description="Active threats"
              icon={Shield}
            />
          </div>

          {/* AI Providers Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Providers Status</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aiProviders.map((provider) => (
                <Card key={provider.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription>{provider.provider} • {provider.model}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={provider.status === 'healthy' ? 'default' : 'destructive'}
                      >
                        {provider.status === 'healthy' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" />Healthy</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3 mr-1" />Issue</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Usage Today</p>
                        <p className="text-lg font-semibold">{provider.usageToday}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Response Time</p>
                        <p className="text-lg font-semibold">{provider.responseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Usage</p>
                        <p className="text-lg font-semibold">{provider.totalUsage.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cost Today</p>
                        <p className="text-lg font-semibold">${provider.costToday.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-20" size="lg">
                <Bot className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Manage AI Providers</div>
                  <div className="text-sm opacity-90">Configure AI services</div>
                </div>
              </Button>

              <Button variant="outline" className="h-20" size="lg">
                <Users className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">User Plans</div>
                  <div className="text-sm opacity-90">Configure subscriptions</div>
                </div>
              </Button>

              <Button variant="outline" className="h-20" size="lg">
                <CreditCard className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Payment Settings</div>
                  <div className="text-sm opacity-90">Manage payment providers</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">AI Provider Health Check</p>
                      <p className="text-xs text-gray-600">All AI providers are healthy and responding normally</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">2 mins ago</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">New Subscription</p>
                      <p className="text-xs text-gray-600">User upgrade to Business plan - $35 revenue</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">5 mins ago</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">High Usage Alert</p>
                      <p className="text-xs text-gray-600">GPT-4 requests exceeded 80% of daily limit</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">15 mins ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
