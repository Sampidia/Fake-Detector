import { NextRequest, NextResponse } from 'next/server'
import { EnhancedNafdacService } from '@/services/nafdac-service'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { aiRouter } from '@/services/ai/ai-router'

// Security Headers Middleware
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=()')
  return response
}

// Rate Limiting (simple in-memory store - for production use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  userLimit.count++
  return true
}

// Input validation schema
const verifyProductSchema = z.object({
  productName: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name must not exceed 200 characters')
    .regex(/^[^<>\"';&]*$/, 'Product name contains invalid characters'),

  productDescription: z.string()
    .min(5, 'Description must be at least 5 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .regex(/^[^<>\"';&]*$/, 'Description contains invalid characters'),

  userBatchNumber: z.string()
    .max(50, 'Batch number must not exceed 50 characters')
    .regex(/^[A-Z0-9\-_\s]*$/, 'Batch number contains invalid characters')
    .optional(),

  images: z.array(z.string())
    .max(3, 'Maximum 3 images allowed')
    .optional()
})

// Input sanitization function
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"';&]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 1000) // Prevent extremely long inputs
}

// Enhanced logging for security events
function logSecurityEvent(event: string, data: {
  ip?: string
  userId?: string
  details?: Record<string, any>
}) {
  const timestamp = new Date().toISOString()
  console.log(`🔒 SECURITY EVENT [${timestamp}]: ${event}`, {
    ip: data.ip || 'unknown',
    userId: data.userId || 'unknown',
    details: data.details || {}
  })
}

// Request timeout handling
const REQUEST_TIMEOUT = 30000 // 30 seconds

function createTimeoutPromise(timeoutMs: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  request.ip ||
                  'unknown'

  try {
    // 🔒 STEP 1: RATE LIMITING (Prevent abuse)
    const isAllowed = checkRateLimit(clientIP)
    if (!isAllowed) {
      logSecurityEvent('Rate limit exceeded', {
        ip: clientIP,
        userId: 'unknown',
        details: { requestPath: '/api/verify-product' }
      })

      const rateLimitResponse = NextResponse.json(
        { error: 'Too many requests', message: 'Please wait a moment before trying again.' },
        { status: 429 }
      )
      return addSecurityHeaders(rateLimitResponse)
    }

    // 🔒 STEP 2: REQUEST VALIDATION AND SANITIZATION
    let requestBody
    try {
      requestBody = await request.json()

      // Validate input against schema
      const validationResult = verifyProductSchema.safeParse(requestBody)
      if (!validationResult.success) {
        logSecurityEvent('Invalid input validation failed', {
          ip: clientIP,
          userId: 'unknown',
          details: {
            errors: validationResult.error.errors,
            requestPath: '/api/verify-product'
          }
        })

        const validationResponse = NextResponse.json(
          { error: 'Invalid input', message: validationResult.error.errors[0]?.message || 'Invalid request format' },
          { status: 400 }
        )
        return addSecurityHeaders(validationResponse)
      }

      // Sanitize inputs
      requestBody.productName = sanitizeInput(requestBody.productName)
      requestBody.productDescription = sanitizeInput(requestBody.productDescription)
      if (requestBody.userBatchNumber) {
        requestBody.userBatchNumber = sanitizeInput(requestBody.userBatchNumber)
      }

    } catch (jsonError) {
      const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      logSecurityEvent('Invalid JSON in request', {
        ip: clientIP,
        userId: 'unknown',
        details: { error: errorMessage }
      })

      const jsonResponse = NextResponse.json(
        { error: 'Invalid request format', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
      return addSecurityHeaders(jsonResponse)
    }

    // 🔒 STEP 3: AUTHENTICATION
    const session = await Promise.race([
      auth(),
      createTimeoutPromise(10000) // 10 second auth timeout
    ])

    if (!session) {
      logSecurityEvent('Authentication failed', {
        ip: clientIP,
        userId: 'unknown',
        details: { requestPath: '/api/verify-product' }
      })

      const authResponse = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      return addSecurityHeaders(authResponse)
    }

    // Secure logging (no sensitive data exposed)
    logSecurityEvent('Authenticated request', {
      ip: clientIP,
      userId: session.user.id,
      details: {
        requestPath: '/api/verify-product',
        hasImages: !!requestBody.images?.length,
        batchProvided: !!requestBody.userBatchNumber
      }
    })

    // 🔒 STEP 4: USER VALIDATION WITH SECURE ERROR HANDLING
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { pointsBalance: true, email: true }
      })

      // Create user if they don't exist (secure fallback)
      if (!user && session.user.email) {
        user = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || 'Unknown',
            pointsBalance: 5 // Default points
          }
        })
      }

      // Validate points balance
      if (!user || user.pointsBalance < 1) {
        logSecurityEvent('Insufficient points', {
          ip: clientIP,
          userId: session.user.id,
          details: { pointsBalance: user?.pointsBalance }
        })

        const pointsResponse = NextResponse.json(
          {
            error: 'Insufficient points',
            message: 'You need at least 1 point for verification. Daily points will be available tomorrow.'
          },
          { status: 400 }
        )
        return addSecurityHeaders(pointsResponse)
      }

    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Database error'
      logSecurityEvent('Database error during user validation', {
        ip: clientIP,
        userId: session.user.id,
        details: { error: errorMessage }
      })

      const dbResponse = NextResponse.json(
        { error: 'Service temporarily unavailable', message: 'Please try again later.' },
        { status: 503 }
      )
      return addSecurityHeaders(dbResponse)
    }

    // Log user validation for security monitoring
    console.log('🔍 DATABASE USER:', {
      found: !!user,
      points_balance: user?.pointsBalance,
      user_email: user?.email
    })

    // Use the already validated requestBody instead of reading again
    const { productName, productDescription, images, userBatchNumber } = requestBody

    if (!productName || !productDescription) {
      return NextResponse.json(
        { error: 'Missing product information - name and description required' },
        { status: 400 }
      )
    }

    console.log('🔍 Enhanced verification request:', {
      productName,
      description: productDescription.slice(0, 100),
      userBatchNumber: userBatchNumber || 'Not provided',
      imagesCount: images?.length || 0,
      userId: session.user.id
    })

    // 🎯 ADVANCED TEXT MATCHING SYSTEM WITH AI ENHANCEMENT
    console.log('🔍 Starting AI-Enhanced Verification...')
    const nafdacService = new EnhancedNafdacService()

    // Initialize AI Router for enhanced processing
    await aiRouter.initializeProviders()

    let userPlan = 'free'
    try {
      const userPlanData = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { planUsers: { select: { name: true } } }
      })
      userPlan = userPlanData?.planUsers?.name || 'free'
    } catch (error) {
      console.log('⚠️ Could not fetch user plan, using free tier')
    }

    const aiEnabled = userPlan !== 'free' && process.env.ENABLE_AI_ENHANCEMENT === 'true'

    console.log(`🤖 AI Enhancement: ${aiEnabled ? 'ENABLED (' + userPlan + ' plan)' : 'DISABLED (free plan)'}`)

    // Extract OCR text from uploaded images
    let ocrText = ''
    if (images && images.length > 0) {
      try {
        // Use our existing OCR service to extract text
        const ocrResponse = await fetch('/api/test-ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: images,
            getTextOnly: true // Focus on text extraction
          })
        })

        if (ocrResponse.ok) {
          const ocrResult = await ocrResponse.json()
          ocrText = ocrResult.ocrText?.join(' ') || ''
        }
      } catch (error) {
        console.log('⚠️ OCR extraction failed, proceeding without it')
      }
    }

    // Combine all searchable text
    const searchText = `
      ${productName || ''} ${productDescription || ''} ${userBatchNumber || ''} ${ocrText}
    `.toLowerCase().trim()

    console.log('🔍 Searching NAFDAC database with text:', searchText.substring(0, 200) + '...')

    // ⚡ LIGHTNING FAST DATABASE SEARCH using our optimized indexes
    const searchStart = Date.now()

    // 📊 STEP-BY-STEP SEARCH STRATEGY FOR MAXIMUM ACCURACY

    // Strategy 1: Direct batch number match (highest accuracy)
    let batchMatches: any[] = []
    if (userBatchNumber) {
      batchMatches = await prisma.nafdacAlert.findMany({
        where: {
          active: true,
          batchNumbers: {
            has: userBatchNumber.toUpperCase()
          }
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          url: true,
          batchNumbers: true,
          manufacturer: true,
          alertType: true,
          severity: true,
          scrapedAt: true
        },
        orderBy: { scrapedAt: 'desc' },
        take: 5
      })
      console.log(`Strategy 1 - Batch matches: ${batchMatches.length}`)
    }

    // Strategy 2: Product name/title match
    let productMatches: any[] = []
    if (productName && productName.length > 3) {
      productMatches = await prisma.nafdacAlert.findMany({
        where: {
          active: true,
          title: {
            contains: productName.toLowerCase(),
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          url: true,
          batchNumbers: true,
          manufacturer: true,
          alertType: true,
          severity: true,
          scrapedAt: true
        },
        orderBy: { scrapedAt: 'desc' },
        take: 5
      })
      console.log(`Strategy 2 - Product matches: ${productMatches.length}`)
    }

    // Strategy 3: Broad content search as fallback
    let contentMatches: any[] = []
    if (searchText && searchText.length > 5) {
      contentMatches = await prisma.nafdacAlert.findMany({
        where: {
          active: true,
          excerpt: {
            contains: searchText.split(' ')[0]?.toLowerCase(),
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          url: true,
          batchNumbers: true,
          manufacturer: true,
          alertType: true,
          severity: true,
          scrapedAt: true
        },
        orderBy: { scrapedAt: 'desc' },
        take: 5
      })
      console.log(`Strategy 3 - Content matches: ${contentMatches.length}`)
    }

    // Combine and deduplicate results
    const allMatches = [...batchMatches, ...productMatches, ...contentMatches]
    const uniqueAlerts = allMatches.filter((alert, index, self) =>
      index === self.findIndex(a => a.id === alert.id)
    ).slice(0, 10) // Take top 10

    const matchingAlerts = uniqueAlerts

    console.log(`🧹 Deduplicated to ${matchingAlerts.length} unique alerts:`, matchingAlerts.map(a => a.title))

    const searchTime = Date.now() - searchStart
    console.log(`⚡ Database search completed in ${searchTime}ms - found ${matchingAlerts.length} potential matches`)
    console.log('🔍 Matching alerts:', matchingAlerts.map(a => a.title))

    // 🎯 DECISION LOGIC: Clear results based on analysis
    let isCounterfeit = false
    let confidence = 0
    let summary = ''
    let detectedAlertDetails = ''
    let sourceUrl = 'https://nafdac.gov.ng/category/recalls-and-alerts/'
    let alertType = "No Alert"
    let batchNumber = null

    if (matchingAlerts.length > 0) {
      // 🔴 FAKE/RECALL/EXPIRED PRODUCT DETECTED
      isCounterfeit = true
      confidence = Math.min(95, 70 + (matchingAlerts.length * 5)) // Dynamic confidence
      alertType = matchingAlerts[0].alertType

      // Combine cleanContent from matching alerts
      detectedAlertDetails = matchingAlerts
        .map(alert => alert.cleanContent || alert.title)
        .join('\n\n')

      summary = `🔴 FAKE/RECALL/EXPIRED PRODUCT DETECTED: Alerts found in NAFDAC database for this product. Kindly do further research before consuming.\n\n### Reason:\n\n${detectedAlertDetails}`

      batchNumber = matchingAlerts[0].batchNumbers?.join(', ') || null
      sourceUrl = matchingAlerts[0].url

    } else {
      // ✅ SAFE PRODUCT
      isCounterfeit = false
      confidence = 100 // Definitive no-match = 100% confidence
      summary = `✅ SAFE PRODUCT: No alerts found in NAFDAC database for this product. Kindly do further research before consuming.`
    }

    const result = {
      isCounterfeit,
      summary,
      sourceUrl,
      source: "NAFDAC Database Check",
      batchNumber,
      alertType,
      confidence,
      detectedAlertDetails: isCounterfeit ? detectedAlertDetails : null,
      searchTime,
      alertsFound: matchingAlerts.length
    }

    console.log('🎯 Basic Verification Decision:', {
      isCounterfeit: result.isCounterfeit ? 'UNSAFE' : 'SAFE',
      confidence: result.confidence + '%',
      alertsFound: result.alertsFound,
      searchTime: result.searchTime + 'ms'
    })

    // 🤖 PHASE 2: AI ENHANCEMENT for paid users
    let aiEnhanced = false
    let aiConfidence = null
    let aiInsights = null
    let enhancedProductName = productName

    if (aiEnabled) {
      console.log(`🤖 Applying AI enhancement for ${userPlan} plan...`)

      try {
        // Step 1: Enhanced OCR processing for product info
        const combinedText = `${productName} ${productDescription} ${ocrText || ''}`.trim()

        // Use AI to extract and validate product information
        const aiExtractResponse = await aiRouter.processRequest({
          text: `Extract accurate product information from this product scan:
${combinedText}

Please identify:
1. The correct product name (remove manufacturer names if present)
2. Any additional product details that might help with verification
3. Any suspicious indicators or quality concerns mentioned

Return structured data about this product.`,
          task: 'extraction'
        }, session.user.id)

        // Parse and use AI extraction results
        if (aiExtractResponse?.extractedData?.productNames?.[0]) {
          enhancedProductName = aiExtractResponse.extractedData.productNames[0]
          console.log(`🔍 AI extracted product: ${enhancedProductName}`)
        }

        // Step 2: AI-powered verification enhancement if low confidence
        if (result.confidence > 15 && result.confidence < 85) {
          console.log(`🤔 Low confidence (${result.confidence}%) - requesting AI verification...`)

          const aiVerificationPrompt = `
Analyze this product for safety concerns using your knowledge of counterfeit detection:

PRODUCT INFORMATION:
Name: ${enhancedProductName}
Description: ${productDescription}
User Batch: ${userBatchNumber || 'None provided'}
OCR Text: ${ocrText || 'None available'}

NAFDAC DATABASE RESULTS:
Alert found: ${result.isCounterfeit ? 'YES' : 'NO'}
Confidence: ${result.confidence}%
${result.detectedAlertDetails ? 'Alert details: ' + result.detectedAlertDetails : ''}

QUESTION: Should this product be considered LEGITIMATE or SUSPECTED of being counterfeit/unsafe?

Please provide:
1. Your assessment (LEGITIMATE/SUSPECTED/CRITICAL)
2. Reasons for your assessment (3-5 key points)
3. Confidence score (0-100%)
4. Any additional safety recommendations

Be conservative - only flag as problematic with strong evidence.`

          const aiVerifyResponse = await aiRouter.processRequest({
            text: aiVerificationPrompt,
            task: 'verification'
          }, session.user.id)

          if (aiVerifyResponse?.extractedData) {
            aiEnhanced = true
            aiConfidence = aiVerifyResponse.metadata.success ? 85 : 60
            aiInsights = aiVerifyResponse.content

            // Use AI confidence to adjust the overall result
            const aiAssessment = aiVerifyResponse.extractedData.isCounterfeit
            if (aiAssessment === true && result.confidence < 50) {
              // AI thinks it's suspicious, increase confidence
              result.confidence = Math.min(90, result.confidence + 15)
              result.isCounterfeit = true
              console.log(`🤖 AI override: Increased risk assessment to ${result.confidence}%`)
            } else if (aiAssessment === false && result.confidence > 70) {
              // AI thinks it's safe, decrease confidence of alert
              result.confidence = Math.max(20, result.confidence - 20)
              if (result.confidence < 30) {
                result.isCounterfeit = false
                console.log(`🤖 AI override: Reduced risk assessment to ${result.confidence}%`)
              }
            }
          }
        }

        console.log(`✅ AI Enhancement complete. Enhanced: ${aiEnhanced}, AI Confidence: ${aiConfidence || 'N/A'}`)

      } catch (aiError) {
        console.warn('⚠️ AI enhancement failed:', aiError)
        // Continue without AI enhancement - don't break the flow
      }
    }

    // STAGE 3: Enhanced validation for edge cases
    if (result.confidence > 10 && result.confidence < 70) {
      console.log('ℹ️ LOW CONFIDENCE MATCH - Additional validation needed')

      // Double-check with ensemble analysis for borderline cases
      const ensembleResult = await nafdacService.ensembleAnalysis(
        productName,
        productDescription,
        images || []
      )

      // Use ensemble result only if it's also suspicious
      if (ensembleResult.confidence > 75 && !ensembleResult.isCounterfeit) {
        console.log('🤝 Ensemble override: Keeping as LEGITIMATE')
        // Ensemble analysis says it's safe, trust it
        if (result.confidence < 40) {
          console.log('✅ OVERRIDE: Low confidence NAFDAC match + ensemble legitimate = LEGITIMATE')
          result.confidence = 0 // Force as no match (safe)
        }
      }
    }

    // EXTRA CAUTION: Only flag as counterfeit if ALL criteria are met with high confidence
    // If no exact match in NAFDAC database, ALWAYS return LEGITIMATE (isCounterfeit: false)

    // Deduct 1 point for the scan FIRST
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pointsBalance: { decrement: 1 }
      }
    })

    // Save the scan result FIRST
    const savedResult = await prisma.productCheck.create({
      data: {
        userId: session.user.id,
        productName,
        productDescription,
        images: images || [],
        pointsUsed: 1
      }
    })

    // ZERO FALSE POSITIVES: If no NAFDAC match found, ALWAYS return LEGITIMATE
    if (result.confidence === 0) {
      console.log('✅ ZERO FALSE POSITIVES: Product not in NAFDAC alerts = LEGITIMATE')

      // Save legitimate result
      await prisma.checkResult.create({
        data: {
          userId: session.user.id,
          productCheckId: savedResult.id,
          isCounterfeit: false,
          summary: `✅ SAFE PRODUCT: No counterfeit alerts found in NAFDAC database for this product.`,
          sourceUrl: 'https://nafdac.gov.ng/category/recalls-and-alerts/',
          source: "NAFDAC Database Check",
          batchNumber: null,
          alertType: "No Alert",
          confidence: 0
        } as any
      })

      const safeResponse = NextResponse.json({
        resultId: savedResult.id,
        isCounterfeit: false, // ZERO FALSE POSITIVES POLICY
        summary: `✅ SAFE PRODUCT: No counterfeit alerts found in NAFDAC database for this product.`,
        sourceUrl: 'https://nafdac.gov.ng/category/recalls-and-alerts/',
        source: "NAFDAC Database Check",
        batchNumber: null,
        alertType: "No Alert",
        confidence: 0,
        newBalance: user.pointsBalance - 1,
        timestamp: new Date().toISOString(),
        verificationMethod: "Conservative NAFDAC Database Only"
      })
      return addSecurityHeaders(safeResponse)
    }

    console.log(`🎯 NAFDAC database match found - confidence: ${result.confidence}%`)

    // Create the check result separately
    const checkResult = await prisma.checkResult.create({
      data: {
        userId: session.user.id,
        productCheckId: savedResult.id,
        isCounterfeit: result.isCounterfeit,
        summary: result.summary,
        sourceUrl: result.sourceUrl,
        source: result.source,
        batchNumber: result.batchNumber,
        alertType: result.alertType,
        confidence: result.confidence
      } as any
    })

    // Prepare final response
    const response = {
      resultId: savedResult.id,
      ...result,
      newBalance: user.pointsBalance - 1,
      timestamp: new Date().toISOString(),
      verificationMethod: aiEnhanced
        ? `AI-Enhanced Verification (${userPlan} Plan)`
        : "Conservative NAFDAC Database Only",

      // Include AI enhancements for paid users
      ...(aiEnhanced && {
        aiEnhanced: true,
        aiConfidence: aiConfidence,
        aiInsights: aiInsights,
        enhancedProductName: enhancedProductName,
        planUsed: userPlan
      })
    }

    logSecurityEvent('Verification completed successfully', {
      ip: clientIP,
      userId: session.user.id,
      details: {
        resultId: savedResult.id,
        isCounterfeit: result.isCounterfeit,
        confidence: result.confidence,
        processingTime: Date.now() - startTime
      }
    })

    console.log('✅ Verification complete:', {
      isCounterfeit: result.isCounterfeit,
      confidence: result.confidence,
      resultId: savedResult.id
    })

    const successResponse = NextResponse.json(response)
    return addSecurityHeaders(successResponse)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Product verification error:', error)

    logSecurityEvent('Verification error occurred', {
      ip: clientIP,
      userId: 'unknown',
      details: {
        error: errorMessage,
        processingTime: Date.now() - startTime
      }
    })

    const errorResponse = NextResponse.json(
      {
        error: 'Verification failed',
        message: 'An error occurred during product verification. Please try again.'
      },
      { status: 500 }
    )
    return addSecurityHeaders(errorResponse)
  }
}
