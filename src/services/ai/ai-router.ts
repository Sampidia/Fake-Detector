import { AIRequest, AIResponse, UserPlan } from './types-fixed'
import { GeminiService } from './google-gemini'
import { OpenAIService } from './openai-gpt'
import { AnthropicClaudeService } from './anthropic-claude'
import prisma from '@/lib/prisma'

interface AIProviderInstance {
  gemini?: GeminiService
  openai?: OpenAIService
  claude?: AnthropicClaudeService
}

interface PlanAIAssignment {
  planId: string
  aiType: 'ocr' | 'verification' | 'extraction'
  provider: 'google' | 'openai' | 'anthropic'
  priority: number
  config: {
    apiKey: string
    modelName: string
    temperature?: number
    maxTokens: number
    costInput: number
    costOutput: number
  }
}

export class AIServiceRouter {
  private aiInstances: AIProviderInstance = {}
  private assignmentsCache: Map<string, PlanAIAssignment[]> = new Map()
  private lastCacheUpdate: Date = new Date(0)

  // Initialize AI providers
  async initializeProviders(): Promise<void> {
    console.log('🔧 Initializing AI Providers...')

    try {
      // Fetch all active AI providers from database
      const providers = await prisma.aIProvider.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          provider: true,
          modelName: true
        }
      })

      // Initialize each provider
      for (const provider of providers) {
        try {
          const apiKey = await this.getAPIKey(this.constructProviderKeyId(provider.provider))

          if (!apiKey) {
            console.warn(`❌ No API key found for ${provider.name}`)
            continue
          }

          const config = {
            id: provider.id,
            apiKey,
            modelName: provider.modelName,
            provider: provider.provider as any,
            temperature: 0.7, // Default temperature
            maxTokens: 2048, // Default max tokens
            costInput: 0.00000025, // Default cost
            costOutput: 0.000001 // Default cost
          }

          // Initialize the right service instance
          switch (provider.provider) {
            case 'google':
              this.aiInstances.gemini = new GeminiService(config)
              console.log('✅ Google Gemini initialized')
              break
            case 'openai':
              this.aiInstances.openai = new OpenAIService(config)
              console.log('✅ OpenAI GPT initialized')
              break
            case 'anthropic':
              this.aiInstances.claude = new AnthropicClaudeService(config)
              console.log('✅ Anthropic Claude initialized')
              break
          }
        } catch (error) {
          console.error(`❌ Failed to initialize ${provider.name}:`, error)
        }
      }

      // Health check all providers
      await this.performHealthChecks()

      console.log('🎯 AI Router initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize AI Router:', error)
      throw error
    }
  }

  // Main request processing method
  async processRequest(request: AIRequest, userId?: string): Promise<AIResponse> {
    console.log(`🤖 Processing ${request.task} request`, {
      userId,
      textLength: request.text.length,
      task: request.task
    })

    try {
      // 1. Get user's plan and AI assignments
      let userPlan: UserPlan | null = null
      let assignments: PlanAIAssignment[] = []

      if (userId) {
        userPlan = await this.getUserPlan(userId)
        assignments = await this.getAIAssignments(userPlan)
      } else {
        // Free tier fallback
        assignments = await this.getFreeTierAssignments(request.task)
      }

      if (assignments.length === 0) {
        throw new Error(`No AI providers assigned for task: ${request.task}`)
      }

      // 2. Sort by priority (1 = highest priority)
      assignments.sort((a, b) => a.priority - b.priority)

      // 3. Try providers in order
      let lastError: Error | null = null

      for (const assignment of assignments) {
        try {
          console.log(`🔄 Trying ${assignment.provider} for ${request.task}...`)

          // Check rate limits
          await this.checkRateLimiting(assignment, userId)

          // Process with the assigned provider
          const result = await this.executeRequestWithProvider(
            assignment,
            request,
            userId
          )

          // Success! Log usage and return
          console.log(`✅ ${assignment.provider} succeeded for ${request.task}`)
          await this.logUsage(assignment, userId, request, result)

          return result

        } catch (error) {
          console.warn(`❌ ${assignment.provider} failed:`, error instanceof Error ? error.message : 'Unknown error')
          lastError = error instanceof Error ? error : new Error('Provider failed')

          // Continue to next provider if this one failed
          continue
        }
      }

      // All providers failed
      throw lastError || new Error('All AI providers failed')

    } catch (error) {
      console.error('❌ AI Router processing error:', error)

      // Return error response
      return {
        content: '',
        extractedData: null,
        usage: { inputTokens: 0, outputTokens: 0, cost: 0 },
        metadata: {
          model: 'none',
          provider: 'none',
          responseTime: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          finishReason: 'error'
        }
      }
    }
  }

  // Get user's plan from database
  private async getUserPlan(userId: string): Promise<UserPlan | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          planId: true
        }
      })

      if (!user || !user.planId) {
        // Return free plan defaults
        return {
          id: 'free',
          name: 'free',
          displayName: 'Free',
          price: 0,
          currency: 'USD',
          maxScansPerMonth: 5,
          maxImagesPerScan: 1,
          maxAIRequestsPerMonth: 5,
          maxTokensPerDay: 10000,
          priority: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }

      // For now, return free plan if we can't load actual plan data
      return {
        id: user.planId,
        name: 'free',
        displayName: 'Free',
        price: 0,
        currency: 'USD',
        maxScansPerMonth: 5,
        maxImagesPerScan: 1,
        maxAIRequestsPerMonth: 5,
        maxTokensPerDay: 10000,
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Error getting user plan:', error)
      return null
    }
  }

  // Get AI provider assignments for user's plan
  private async getAIAssignments(userPlan: UserPlan | null): Promise<PlanAIAssignment[]> {
    try {
      const planId = userPlan?.id || 'free'

      // Check cache first (cache for 5 minutes)
      const now = new Date()
      const cacheKey = `assignments_${planId}`

      if (this.assignmentsCache.has(cacheKey) &&
          (now.getTime() - this.lastCacheUpdate.getTime()) < 300000) {
        return this.assignmentsCache.get(cacheKey)!
      }

      // Fetch from database
      const assignments = await prisma.planAssignment.findMany({
        where: {
          planId,
          isActive: true
        },
        include: {
          aiProvider: {
            select: {
              id: true,
              name: true,
              provider: true,
              modelName: true
            }
          }
        },
        orderBy: { priority: 'asc' }
      })

      // Transform to expected format
      const formattedAssignments: PlanAIAssignment[] = assignments.map(assignment => ({
        planId: assignment.planId,
        aiType: 'verification' as const, // Default to verification task
        provider: assignment.aiProvider.provider as 'google' | 'openai' | 'anthropic',
        priority: assignment.priority,
        config: {
          apiKey: '', // Will be filled by getAPIKey()
          modelName: assignment.aiProvider.modelName,
          temperature: 0.7, // Default temperature
          maxTokens: 2048, // Default max tokens
          costInput: 0.00000025, // Default input cost
          costOutput: 0.000001 // Default output cost
        }
      }))

      // Fill in API keys
      for (const assignment of formattedAssignments) {
        try {
          const apiKey = await this.getAPIKey(this.constructProviderKeyId(assignment.provider))
          if (apiKey) {
            assignment.config.apiKey = apiKey
          }
        } catch (error) {
          console.warn(`Failed to get API key for ${assignment.provider}`)
        }
      }

      // Cache the result
      this.assignmentsCache.set(cacheKey, formattedAssignments)
      this.lastCacheUpdate = now

      return formattedAssignments

    } catch (error) {
      console.error('Error getting AI assignments:', error)
      return this.getFreeTierFallback()
    }
  }

  // Free tier fallback assignments
  private async getFreeTierAssignments(task: string): Promise<PlanAIAssignment[]> {
    // Default free tier: Google Gemini for all tasks
    const assignments: PlanAIAssignment[] = []

    if (this.aiInstances.gemini) {
      assignments.push({
        planId: 'free',
        aiType: task as any,
        provider: 'google',
        priority: 1,
        config: {
          apiKey: '', // Already set in gemini instance
          modelName: 'gemini-1.5-flash',
          temperature: 0.7,
          maxTokens: 2048,
          costInput: 0.00000025,
          costOutput: 0.000001
        }
      })
    }

    return assignments
  }

  // Get free tier fallback if database fails
  private getFreeTierFallback(): PlanAIAssignment[] {
    return [{
      planId: 'free',
      aiType: 'ocr',
      provider: 'google',
      priority: 1,
      config: {
        apiKey: '',
        modelName: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 2048,
        costInput: 0.00000025,
        costOutput: 0.000001
      }
    }]
  }

  // Execute request with specific provider
  private async executeRequestWithProvider(
    assignment: PlanAIAssignment,
    request: AIRequest,
    userId?: string
  ): Promise<AIResponse> {

    switch (assignment.provider) {
      case 'google':
        if (!this.aiInstances.gemini) {
          throw new Error('Google Gemini not available')
        }
        return await this.aiInstances.gemini.processText(request)

      case 'openai':
        if (!this.aiInstances.openai) {
          throw new Error('OpenAI GPT not available')
        }
        return await this.aiInstances.openai.processText(request)

      case 'anthropic':
        if (!this.aiInstances.claude) {
          throw new Error('Anthropic Claude not available')
        }
        return await this.aiInstances.claude.processText(request)

      default:
        throw new Error(`Unknown provider: ${assignment.provider}`)
    }
  }

  // Rate limiting check
  private async checkRateLimiting(
    assignment: PlanAIAssignment,
    userId?: string
  ): Promise<void> {
    // Get user's plan limits
    if (userId) {
      const userPlan = await this.getUserPlan(userId)
      if (userPlan) {
        // Check daily usage limits
        const todayUsage = await prisma.aIUsageRecord.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })

        if (todayUsage >= userPlan.maxTokensPerDay) {
          throw new Error('Daily AI usage limit exceeded')
        }
      }
    }

    // Provider-specific rate limiting would go here
    // For now, basic rate limiting is handled by the database queries
  }

  // Log usage for billing and analytics
  private async logUsage(
    assignment: PlanAIAssignment,
    userId: string | undefined,
    request: AIRequest,
    result: AIResponse
  ): Promise<void> {

    try {
      // Get AI provider from database
      const aiProvider = await prisma.aIProvider.findFirst({
        where: {
          provider: assignment.provider,
          modelName: assignment.config.modelName,
          isActive: true
        }
      })

      if (!aiProvider) {
        console.warn('AI Provider not found in database for usage logging')
        return
      }

      // Get user plan
      const userPlan = userId ? await this.getUserPlan(userId) : null

      // Log the usage record
      await prisma.aIUsageRecord.create({
        data: {
          aiProviderId: aiProvider.id,
          userId: userId || '',
          planId: userPlan?.id || 'free',
          requestType: request.task,
          requestTokens: result.usage.inputTokens,
          responseTokens: result.usage.outputTokens,
          cost: result.usage.cost,
          responseTime: result.metadata.responseTime / 1000, // Convert to seconds
          success: result.metadata.success
        }
      })

      // Update plan usage tracker (for monthly analytics)
      if (userPlan) {
        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const periodDate = new Date(`${currentMonth}-01T00:00:00Z`)

        await prisma.planUsageTracker.upsert({
          where: {
            planId_period: {
              planId: userPlan.id,
              period: periodDate
            }
          },
          update: {
            totalScans: { increment: request.task === 'verification' ? 1 : 0 },
            totalAIRequests: { increment: 1 },
            totalCost: { increment: result.usage.cost }
          },
          create: {
            planId: userPlan.id,
            period: periodDate,
            totalScans: request.task === 'verification' ? 1 : 0,
            totalAIRequests: 1,
            totalCost: result.usage.cost,
            totalUsers: 1
          }
        })
      }

    } catch (error) {
      console.error('Failed to log AI usage:', error)
      // Don't throw - we don't want logging failures to break the main flow
    }
  }

  // Health checks for all providers
  private async performHealthChecks(): Promise<void> {
    console.log('🔍 Performing AI provider health checks...')

    const checks = []

    if (this.aiInstances.gemini) {
      checks.push(
        this.aiInstances.gemini.checkHealth()
          .then(healthy => ({ provider: 'google', healthy }))
          .catch(() => ({ provider: 'google', healthy: false }))
      )
    }

    if (this.aiInstances.openai) {
      checks.push(
        this.aiInstances.openai.checkHealth()
          .then(healthy => ({ provider: 'openai', healthy }))
          .catch(() => ({ provider: 'openai', healthy: false }))
      )
    }

    if (this.aiInstances.claude) {
      checks.push(
        this.aiInstances.claude.checkHealth()
          .then(healthy => ({ provider: 'anthropic', healthy }))
          .catch(() => ({ provider: 'anthropic', healthy: false }))
      )
    }

    const results = await Promise.all(checks)

    results.forEach(result => {
      if (result.healthy) {
        console.log(`✅ ${result.provider} is healthy`)
      } else {
        console.warn(`❌ ${result.provider} is unhealthy`)
      }
    })
  }

  // Construct provider key ID for API retrieval
  private constructProviderKeyId(provider: string): string {
    switch (provider) {
      case 'google':
        return 'GOOGLE_001'
      case 'openai':
        return 'OPENAI_001'
      case 'anthropic':
        return 'ANTHROPIC_001'
      default:
        return `${provider.toUpperCase()}_001`
    }
  }

  // Get API key from secure storage (environment, vault, etc.)
  private async getAPIKey(apiKeyId: string): Promise<string | null> {
    try {
      // In production, this would integrate with:
      // - AWS Secrets Manager
      // - HashiCorp Vault
      // - Azure Key Vault
      // - Environment variables
      // - Encrypted database

      // For now, get from environment variables
      if (apiKeyId.startsWith('GOOGLE')) {
        return process.env.GOOGLE_AI_API_KEY || null
      } else if (apiKeyId.startsWith('OPENAI')) {
        return process.env.OPENAI_API_KEY || null
      } else if (apiKeyId.startsWith('ANTHROPIC')) {
        return process.env.ANTHROPIC_API_KEY || null
      }

      return null
    } catch (error) {
      console.error('Error retrieving API key:', error)
      return null
    }
  }

  // Analytics methods
  async getUsageStats(planId?: string, userId?: string): Promise<any> {
    const where: any = {}

    if (planId) where.planId = planId
    if (userId) where.userId = userId

      const stats = await prisma.aIUsageRecord.aggregate({
      where,
      _count: { id: true },
      _sum: { cost: true, requestTokens: true, responseTokens: true },
      _avg: { responseTime: true }
    })

    return {
      totalRequests: stats._count.id,
      totalCost: stats._sum.cost || 0,
      totalTokens: (stats._sum.requestTokens || 0) + (stats._sum.responseTokens || 0),
      avgResponseTime: stats._avg.responseTime || 0
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down AI Router...')

    // Clear caches
    this.assignmentsCache.clear()

    // Close any connections if needed
    console.log('✅ AI Router shut down successfully')
  }
}

// Export singleton instance
export const aiRouter = new AIServiceRouter()
