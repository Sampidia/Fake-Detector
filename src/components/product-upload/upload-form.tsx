"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UploadZone } from "./upload-zone"
import { Button } from "@/components/ui/button"

interface ProductFormData {
  productName: string
  productDescription: string
  batchNumber: string
  userBatchNumber?: string
}

interface UploadImages {
  front: File | null
  back: File | null
  left: File | null
  right: File | null
}

// Enhanced AI Analysis Response Interface
interface AnalysisResult {
  ocrText: string[]
  extractedBatchNumbers: string[]
  extractedDates: string[]
  extractedManufacturers: string[]
  similarityScore: number
  confidenceLevel: number
  detectedProducts: string[]
  manufacturerHints: string[]
  recommendation: string
  aiConfidence: number
  processingTime: number
}

interface AIAnalysisState {
  isAnalyzing: boolean
  result: AnalysisResult | null
  progress: number
  extractedText: string[]
}

// Enhanced Upload Form with AI Analysis
export function UploadForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    productName: '',
    productDescription: '',
    batchNumber: '',
    userBatchNumber: ''
  })

  const [images, setImages] = useState<UploadImages>({
    front: null,
    back: null,
    left: null,
    right: null
  })

  const [errors, setErrors] = useState<Partial<ProductFormData & { images: string }>>({})
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisState>({
    isAnalyzing: false,
    result: null,
    progress: 0,
    extractedText: []
  })

  const analysisTimeout = useRef<NodeJS.Timeout>()

  // Auto-analyze images when any image is uploaded
  useEffect(() => {
    const hasAnyImage = Object.values(images).some(img => img !== null)

    if (hasAnyImage && !aiAnalysis.isAnalyzing) {
      // Debounce analysis for better UX
      if (analysisTimeout.current) clearTimeout(analysisTimeout.current)

      analysisTimeout.current = setTimeout(() => {
        analyzeImagesAutomatically()
      }, 1500) // Wait 1.5 seconds after last image upload
    }

    return () => {
      if (analysisTimeout.current) clearTimeout(analysisTimeout.current)
    }
  }, [images])

  const handleImageSelect = useCallback((zone: keyof UploadImages, file: File) => {
    setImages(prev => ({ ...prev, [zone]: file }))
    // Clear image error when an image is selected
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: undefined }))
    }
  }, [errors.images])

  const handleImageRemove = useCallback((zone: keyof UploadImages) => {
    setImages(prev => ({ ...prev, [zone]: null }))
  }, [])

  // Enhanced OCR and AI Analysis
  const analyzeImagesAutomatically = async () => {
    const imageFiles = Object.values(images).filter(img => img !== null) as File[]
    if (imageFiles.length === 0) return

    setAiAnalysis(prev => ({ ...prev, isAnalyzing: true, progress: 0 }))

    try {
      // Convert images to base64 for analysis
      const imagePromises = imageFiles.map((file, index) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            setAiAnalysis(prev => ({ ...prev, progress: (index + 1) / imageFiles.length * 50 }))
            resolve(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        })
      })

      const imageData = await Promise.all(imagePromises)

      setAiAnalysis(prev => ({ ...prev, progress: 60 }))

      // Enhanced OCR Analysis using optimized NAFDAC service
      const analysisResponse = await fetch('/api/test-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imageData,
          enhanced: true // Use our enhanced AI service
        })
      })

      if (!analysisResponse.ok) {
        throw new Error('AI analysis failed')
      }

      const analysisResult: AnalysisResult = await analysisResponse.json()

      setAiAnalysis(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 100,
        result: analysisResult,
        extractedText: analysisResult.ocrText
      }))

      // Auto-populate form with extracted data
      if (analysisResult.extractedBatchNumbers.length > 0) {
        setFormData(prev => ({
          ...prev,
          batchNumber: analysisResult.extractedBatchNumbers[0]
        }))
      }

      if (analysisResult.detectedProducts.length > 0) {
        setFormData(prev => ({
          ...prev,
          productName: analysisResult.detectedProducts[0],
          productDescription: analysisResult.ocrText.join(' ')
        }))
      }

      console.log('🎯 Enhanced AI Analysis Complete:', analysisResult)
      console.log('⚡ Analysis took:', analysisResult.processingTime + 'ms')

    } catch (error) {
      console.error('AI Analysis failed:', error)
      setAiAnalysis(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 0,
        result: null
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData & { images: string }> = {}

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required'
    }

    if (!formData.productDescription.trim()) {
      newErrors.productDescription = 'Product description is required'
    }

    // Check if at least one image is uploaded
    const hasImages = Object.values(images).some(img => img !== null)
    if (!hasImages) {
      newErrors.images = 'At least one product image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Convert images to base64
      const imagePromises = Object.entries(images).map(async ([zone, file]) => {
        if (!file) return { zone, data: null }

        return new Promise<{ zone: string; data: string }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              zone,
              data: e.target?.result as string || ''
            })
          }
          reader.readAsDataURL(file)
        })
      })

      const imageData = await Promise.all(imagePromises)

      const payload = {
        productName: formData.productName.trim(),
        productDescription: formData.productDescription.trim(),
        images: imageData.filter(item => item.data !== null).map(item => item.data)
      }

      console.log('Submitting product check:', payload)

      // TODO: Call MCP service for product verification
      // const response = await fetch('/api/mcp/check-product', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // })

      // const result = await response.json()

      // Call the real API for product verification
      const response = await fetch('/api/verify-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Verification failed')
      }

      const result = await response.json()

      // Store result in localStorage for demo
      localStorage.setItem('lastScanResult', JSON.stringify(result))

      // Redirect to results page
      router.push(`/result/${result.resultId}`)

    } catch (error) {
      console.error('Submission error:', error)

      // Provide more specific error messages
      let errorMessage = 'Failed to submit. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please sign in to scan products.'
        } else if (error.message.includes('Insufficient points')) {
          errorMessage = 'You need at least 1 point to scan products. Daily points will be available tomorrow.'
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('Internal Server Error')) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = error.message
        }
      }

      setErrors({ images: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">Scan Your Product</h1>
        <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Upload photos from all angles for accurate detection</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-blue-600">🔍</span>
            <span className="font-medium text-blue-800 text-sm sm:text-base">Professional NAFDAC Database Verification</span>
          </div>
          <p className="text-sm text-blue-700">
            Each scan uses advanced AI to check your product against the official NAFDAC database for counterfeit detection.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📋 Product Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  productName: e.target.value
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Paracetamol 500mg"
                required
              />
              {errors.productName && (
                <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Product Description *
              </label>
              <textarea
                value={formData.productDescription}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  productDescription: e.target.value
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                placeholder="Describe the product, manufacturing details, batch number, expiry date, etc."
                required
              />
              {errors.productDescription && (
                <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>
              )}
            </div>
          </div>
        </div>

        {/* Image Upload Zones */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📸 Product Images
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <UploadZone
              zone="front"
              label="Front View"
              onImageSelect={(file) => handleImageSelect('front', file)}
            />

            <UploadZone
              zone="back"
              label="Back View"
              onImageSelect={(file) => handleImageSelect('back', file)}
            />

            <UploadZone
              zone="left"
              label="Left Side"
              onImageSelect={(file) => handleImageSelect('left', file)}
            />

            <UploadZone
              zone="right"
              label="Right Side"
              onImageSelect={(file) => handleImageSelect('right', file)}
            />
          </div>

          {/* AI Analysis Status */}
          {(aiAnalysis.isAnalyzing || aiAnalysis.result) && (
            <div className="mb-6 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  AI Analysis
                </h3>
                {aiAnalysis.isAnalyzing && (
                  <div className="text-sm text-blue-600 font-medium">
                    Processing: {Math.round(aiAnalysis.progress)}%
                  </div>
                )}
              </div>

              {/* Analysis Progress Bar */}
              {aiAnalysis.isAnalyzing && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${aiAnalysis.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>OCR Reading</span>
                    <span>Pattern Matching</span>
                    <span>NAFDAC Lookup</span>
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {aiAnalysis.result && (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Extracted Information */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">📋 Extracted Information:</h4>

                    {aiAnalysis.result.extractedBatchNumbers.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="text-sm font-medium text-green-800 mb-1">Batch Numbers Found:</div>
                        <div className="text-sm text-green-700">
                          {aiAnalysis.result.extractedBatchNumbers.map((batch, idx) => (
                            <span key={idx} className="inline-block bg-green-100 px-2 py-1 rounded mr-1">
                              {batch}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiAnalysis.result.extractedManufacturers.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="text-sm font-medium text-blue-800 mb-1">Manufacturers Detected:</div>
                        <div className="text-sm text-blue-700">
                          {aiAnalysis.result.extractedManufacturers.join(', ')}
                        </div>
                      </div>
                    )}

                    {aiAnalysis.result.detectedProducts.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <div className="text-sm font-medium text-purple-800 mb-1">Products Identified:</div>
                        <div className="text-sm text-purple-700">
                          {aiAnalysis.result.detectedProducts.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis Confidence */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">🎯 Analysis Quality:</h4>

                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">OCR Confidence:</span>
                        <span className={`font-bold ${
                          aiAnalysis.result.aiConfidence > 80 ? 'text-green-600' :
                          aiAnalysis.result.aiConfidence > 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(aiAnalysis.result.aiConfidence)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            aiAnalysis.result.aiConfidence > 80 ? 'bg-green-500' :
                            aiAnalysis.result.aiConfidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${aiAnalysis.result.aiConfidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Processing Time:</div>
                      <div className="text-lg font-bold text-blue-600">
                        {aiAnalysis.result.processingTime}ms ⚡
                      </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {aiAnalysis.result.processingTime < 1000 ? 'Excellent speed' :
                         aiAnalysis.result.processingTime < 2000 ? 'Good performance' : 'Processing...'}
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <div className="text-sm text-orange-800">
                        <strong>Recommendation:</strong>
                      </div>
                      <div className="text-sm text-orange-700 mt-1">
                        {aiAnalysis.result.recommendation || 'Upload more images for better analysis.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {errors.images && (
            <p className="text-red-500 text-center mb-4">{errors.images}</p>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">💡</span>
              <span className="font-medium text-blue-800">Pro Tips for Better AI Results:</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1 ml-6">
              <li>• Include packaging, labels, and any markings for better OCR</li>
              <li>• Ensure good lighting for clear text and details</li>
              <li>• Capture batch numbers, expiry dates in well-lit conditions</li>
              <li>• Avoid blurry or dark images - AI performs best with clear photos</li>
              <li>• Upload from multiple angles to capture all product details</li>
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Product...
              </span>
            ) : (
              <>🔍 Scan & Verify Product</>
            )}
          </Button>
        </div>

        {/* Cost Information */}
        <div className="text-center text-gray-600">
          <p>Each scan costs <strong>1 point</strong> from your daily balance</p>
          <p className="text-sm">No points? Purchase more or wait for tomorrow's daily allocation</p>
        </div>
      </form>
    </div>
  )
}
