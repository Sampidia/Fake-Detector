import axios from 'axios'

interface PaymentParams {
  amount: number
  email: string
  phone?: string
  name: string
  pointsCount: number
}

interface PaystackResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackMetadataField {
  display_name: string
  variable_name: string
  value: number
}

interface PaystackMetadata {
  pointsCount: number
  custom_fields: PaystackMetadataField[]
}

interface PaystackTransactionData {
  status: string
  amount: number
  metadata: PaystackMetadata
}

interface PaystackVerificationResponse {
  status: boolean
  data: PaystackTransactionData
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string
    }
  }
}

type PaymentError = Error & AxiosErrorResponse

export class PaymentService {
  private baseURL = process.env.NEXTAUTH_URL || 'https://fake-detector.vercel.app'

  /**
   * Initialize Paystack Payment
   */
  async initializePaystackPayment(params: PaymentParams): Promise<{
    success: boolean
    paymentUrl: string
    reference: string
    error?: string
  }> {
    try {
      const response = await axios.post<PaystackResponse>(
        'https://api.paystack.co/transaction/initialize',
        {
          amount: Math.round(params.amount * 100), // Convert to kobo
          email: params.email,
          reference: `fakedetector_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          callback_url: `${this.baseURL}/api/payments/paystack/callback`,
          metadata: {
            pointsCount: params.pointsCount,
            custom_fields: [
              {
                display_name: 'Points Purchase',
                variable_name: 'points_count',
                value: params.pointsCount
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status && response.data.data.authorization_url) {
        return {
          success: true,
          paymentUrl: response.data.data.authorization_url,
          reference: response.data.data.reference
        }
      }

      return {
        success: false,
        paymentUrl: '',
        reference: '',
        error: response.data.message || 'Payment initialization failed'
      }
    } catch (error: unknown) {
      console.error('Paystack payment initialization error:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        && (error as AxiosErrorResponse).response?.data?.message
        || 'Failed to initialize payment'
      return {
        success: false,
        paymentUrl: '',
        reference: '',
        error: typeof errorMessage === 'string' ? errorMessage : 'Failed to initialize payment'
      }
    }
  }

  /**
   * Initialize Flutterwave Payment
   */
  async initializeFlutterwavePayment(params: PaymentParams): Promise<{
    success: boolean
    paymentUrl: string
    transactionId: string
    error?: string
  }> {
    try {
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref: transactionId,
          amount: params.amount,
          currency: 'NGN',
          redirect_url: `${this.baseURL}/api/payments/flutterwave/callback`,
          payment_options: 'card,mobilemoney,ussd',
          customer: {
            email: params.email,
            phonenumber: params.phone || '',
            name: params.name
          },
          customizations: {
            title: 'Fake Detector Points Purchase',
            description: `Purchase ${params.pointsCount} points for ₦${params.amount}`,
            logo: `${this.baseURL}/logo.png`
          },
          meta: {
            pointsCount: params.pointsCount
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status === 'success') {
        return {
          success: true,
          paymentUrl: response.data.data.link,
          transactionId: response.data.data.id.toString()
        }
      }

      return {
        success: false,
        paymentUrl: '',
        transactionId: '',
        error: response.data.message || 'Payment initialization failed'
      }
    } catch (error: unknown) {
      console.error('Flutterwave payment initialization error:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        && (error as AxiosErrorResponse).response?.data?.message
        || 'Failed to initialize payment'
      return {
        success: false,
        paymentUrl: '',
        transactionId: '',
        error: typeof errorMessage === 'string' ? errorMessage : 'Failed to initialize payment'
      }
    }
  }

  /**
   * Verify Paystack Payment
   */
  async verifyPaystackPayment(reference: string): Promise<{
    success: boolean
    verified: boolean
    amount?: number
    pointsCount?: number
    error?: string
  }> {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          }
        }
      )

      if (response.data.status && response.data.data.status === 'success') {
        const metadata = response.data.data.metadata
        return {
          success: true,
          verified: true,
          amount: response.data.data.amount / 100, // Convert from kobo
          pointsCount: metadata.custom_fields?.find((f: PaystackMetadataField) => f.variable_name === 'points_count')?.value
        }
      }

      return {
        success: false,
        verified: false,
        error: 'Payment verification failed'
      }
    } catch (error: unknown) {
      console.error('Paystack verification error:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        && (error as AxiosErrorResponse).response?.data?.message
        || 'Verification failed'
      return {
        success: false,
        verified: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Verification failed'
      }
    }
  }

  /**
   * Verify Flutterwave Payment
   */
  async verifyFlutterwavePayment(transactionId: string): Promise<{
    success: boolean
    verified: boolean
    amount?: number
    pointsCount?: number
    error?: string
  }> {
    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          }
        }
      )

      if (response.data.status === 'success' && response.data.data.status === 'successful') {
        return {
          success: true,
          verified: true,
          amount: response.data.data.amount,
          pointsCount: response.data.data.meta?.pointsCount
        }
      }

      return {
        success: false,
        verified: false,
        error: 'Payment verification failed'
      }
    } catch (error: unknown) {
      console.error('Flutterwave verification error:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        && (error as AxiosErrorResponse).response?.data?.message
        || 'Verification failed'
      return {
        success: false,
        verified: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Verification failed'
      }
    }
  }

  /**
   * Calculate amount for points purchase
   */
  calculatePointsAmount(pointsCount: number): number {
    const pointsPrice = parseInt(process.env.POINTS_PRICE_PER_NAIRA || '100')
    return pointsCount * pointsPrice
  }

  /**
   * Get supported payment methods
   */
  getSupportedPayments(): Array<{
    gateway: 'paystack' | 'flutterwave'
    name: string
    enabled: boolean
  }> {
    return [
      {
        gateway: 'paystack',
        name: 'Paystack',
        enabled: !!process.env.PAYSTACK_SECRET_KEY
      },
      {
        gateway: 'flutterwave',
        name: 'Flutterwave',
        enabled: !!process.env.FLUTTERWAVE_SECRET_KEY
      }
    ]
  }
}