import { AIProviderConfig, AIResponse, AIRequest } from './types-fixed'

export class GeminiService {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.config = config
  }

  async processText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Generate prompt based on task type
      const prompt = this.generatePrompt(request.text, request.task)

      // Make API call to Google Gemini
      const response = await fetch(
        `${this.baseUrl}/models/${this.config.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: this.config.temperature || 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: Math.min(request.maxTokens || 2048, this.config.maxTokens),
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Google Gemini API error: ${error.error?.message || 'Unknown error'}`)
      }

      const result = await response.json()

      // Parse response
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!content) {
        throw new Error('No content in Gemini response')
      }

      const responseTime = Date.now() - startTime

      // Extract structured data based on task type
      const extractedData = this.extractStructuredData(content, request.task)

      return {
        content,
        extractedData,
        usage: {
          inputTokens: Math.ceil(request.text.length / 4), // Approximate chars to tokens
          outputTokens: Math.ceil(content.length / 4),
          cost: this.calculateCost(request.text.length, content.length)
        },
        metadata: {
          model: this.config.modelName,
          provider: 'google',
          responseTime,
          success: true,
          finishReason: result.candidates?.[0]?.finishReason || 'completed'
        }
      }

    } catch (error) {
      console.error('Google Gemini error:', error)

      return {
        content: '',
        extractedData: null,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          cost: 0
        },
        metadata: {
          model: this.config.modelName,
          provider: 'google',
          responseTime: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          finishReason: 'error'
        }
      }
    }
  }

  private generatePrompt(text: string, task: string): string {
    const basePrompts = {
      ocr: `
        You are processing OCR text from a product packaging image. Extract and structure the following information:

        OCR TEXT: ${text}

        Extract these key elements (return as structured JSON):
        {
          "productName": "name of the product",
          "batchNumbers": ["list of batch numbers found"],
          "expiryDate": "expiry date if found (format: YYYY-MM-DD)",
          "manufacturers": ["list of manufacturer names"],
          "confidence": "overall OCR confidence (0-1)"
        }

        Only include data you can confidently extract. If unsure about a field, omit it.
        Return valid JSON only.
      `,

      verification: `
        You are checking if a product matches known counterfeit/recall databases.

        PRODUCT INFORMATION: ${text}

        Analyze for counterfeit indicators and return JSON:
        {
          "isCounterfeit": boolean,
          "confidence": number (0-1),
          "reason": "why this product may be counterfeit/recalled",
          "riskLevel": "LOW/MEDIUM/HIGH/CRITICAL",
          "recommendation": "what user should do"
        }

        Be conservative - only flag as counterfeit with strong evidence.
        Return valid JSON only.
      `,

      extraction: `
        Extract structured product information from the following alert text.

        ALERT TEXT: ${text}

        Extract and structure:
        {
          "productNames": ["list of all product names mentioned"],
          "batchNumbers": ["list of all batch numbers mentioned"],
          "reason": "why this product was recalled/banned/faked",
          "category": "RECALL/COUNTERFEIT/EXPIRED/QUALITY_ISSUE",
          "manufacturer": "company that made the product",
          "affectedRegions": ["geographical areas affected"],
          "severity": "HIGH/MEDIUM/LOW"
        }

        Focus on accuracy over completeness. Return valid JSON only.
      `
    }

    return basePrompts[task as keyof typeof basePrompts] ||
           `Process this text and extract key information: ${text}`
  }

  private extractStructuredData(content: string, task: string): any {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // Fallback: extract structured information from text response
      switch (task) {
        case 'authentication':
          return this.extractOCRFromText(content)
        case 'verification':
          return this.extractVerificationFromText(content)
        case 'extraction':
          return this.extractAlertFromText(content)
        default:
          return { rawResponse: content }
      }
    } catch (error) {
      console.warn('Failed to extract structured data:', error)
      return { rawResponse: content }
    }
  }

  private extractOCRFromText(text: string): any {
    const result: any = {}

    // Extract batch numbers
    const batchRegex = /(?:batch|lot)\s*(?:number|no\.?)?\s*:?\s*([A-Z0-9\-\/\.\s]+)/gi
    const batches = Array.from(text.matchAll(batchRegex), m => m[1]?.trim()).filter(Boolean)
    if (batches.length > 0) result.batchNumbers = batches

    // Extract product name
    const productRegex = /(?:product|medicine|drug)\s*:?\s*([^&\n\r]{3,})/i
    const productMatch = text.match(productRegex)
    if (productMatch) result.productName = productMatch[1]?.trim()

    // Extract expiry date
    const expiryRegex = /(?:expiry|exp)\s*(?:date)?\s*:?\s*([\d\/\-\.]+)/i
    const expiryMatch = text.match(expiryRegex)
    if (expiryMatch) result.expiryDate = expiryMatch[1]

    result.confidence = batches.length > 0 || productMatch ? 0.8 : 0.3

    return result
  }

  private extractVerificationFromText(text: string): any {
    const result: any = {}

    // Check for counterfeit indicators
    const counterfeitIndicators = /(?:fake|counterfeit|falsified|spurious|adulterated)/i
    const recallIndicators = /(?:recall|withdraw|seizure|ban)/i

    const isCounterfeit = counterfeitIndicators.test(text) || recallIndicators.test(text)
    result.isCounterfeit = isCounterfeit

    // Determine risk level
    if (isCounterfeit) {
      result.riskLevel = text.includes('adulterated') ? 'CRITICAL' : 'HIGH'
      result.reason = text.match(/(?:because|due to|reason)[^\n\r]{10,}/i)?.[0] || 'Product matches suspicious activity'
      result.recommendation = 'Do not use this product. Contact manufacturer or regulatory authority.'
    } else {
      result.riskLevel = 'LOW'
      result.reason = 'No counterfeit indicators found'
      result.recommendation = 'Product appears safe, but verify with manufacturer if concerned.'
    }

    result.confidence = isCounterfeit ? 0.8 : 0.9

    return result
  }

  private extractAlertFromText(text: string): any {
    const result: any = { productNames: [], batchNumbers: [], affectedRegions: [] }

    // Extract product names
    const productPatterns = [
      /(?:product|medicine|drug)[s]?[:\s]*([^\n\r]{3,30})/gi,
      /(?:recall|withdraw)[^\n\r]*([^\n\r]{3,30})/gi
    ]

    productPatterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern), m => m[1]?.trim()).filter(Boolean)
      result.productNames.push(...matches)
    })
    result.productNames = [...new Set(result.productNames)]

    // Extract batch numbers
    const batchPatterns = [
      /(?:batch|lot)\s*(?:number|no\.?)?\s*:?\s*([A-Z0-9\-\/\.\s]{15})/gi,
      /([A-Z]\d+[A-Z]?\d*[A-Z]?)/g
    ]

    batchPatterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern), m => m[1]?.trim()).filter(Boolean)
      result.batchNumbers.push(...matches)
    })
    result.batchNumbers = [...new Set(result.batchNumbers)]

    // Determine reason
    if (/(?:fake|counterfeit|falsified)/i.test(text)) {
      result.reason = 'Product found to be counterfeit or falsified'
      result.category = 'COUNTERFEIT'
      result.severity = 'HIGH'
    } else if (/(?:recall|withdraw)/i.test(text)) {
      result.reason = 'Product recalled due to safety concerns'
      result.category = 'RECALL'
      result.severity = 'HIGH'
    } else if (/(?:expired|adulterated)/i.test(text)) {
      result.reason = 'Product expired or found to be adulterated'
      result.category = 'EXPIRED'
      result.severity = 'MEDIUM'
    } else {
      result.reason = 'Quality or safety concern detected'
      result.category = 'QUALITY_ISSUE'
      result.severity = 'MEDIUM'
    }

    // Extract manufacturer
    const manufacturerMatch = text.match(/(?:manufacturer|producer|company)[^\n\r]*([^\n\r]{3,25})/i)
    if (manufacturerMatch) result.manufacturer = manufacturerMatch[1].trim()

    return result
  }

  private calculateCost(inputChars: number, outputChars: number): number {
    // Google Gemini pricing (approximate)
    const inputCostPerChar = 0.00000025 // $0.15 per 1M chars
    const outputCostPerChar = 0.000001 // $0.60 per 1M chars

    const inputCost = inputChars * inputCostPerChar
    const outputCost = outputChars * outputCostPerChar

    return inputCost + outputCost
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Simple health check
      const response = await fetch(
        `${this.baseUrl}/models/${this.config.modelName}?key=${this.apiKey}`
      )
      return response.ok
    } catch {
      return false
    }
  }
}
