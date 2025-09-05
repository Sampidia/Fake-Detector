import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

// Contact form data interface
interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data from request body
    const body = await request.json() as ContactFormData
    const { name, email, phone, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Format contact form email
    const contactEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFD700 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #1E40AF; }
            .value { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #FFD700; margin-top: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📧 New Contact Form Submission</h1>
            <p>You have received a new message from your website</p>
          </div>

          <div class="content">
            <div class="field">
              <div class="label">👤 Name:</div>
              <div class="value">${name}</div>
            </div>

            <div class="field">
              <div class="label">✉️ Email:</div>
              <div class="value">${email}</div>
            </div>

            ${phone ? `
            <div class="field">
              <div class="label">📞 Phone:</div>
              <div class="value">${phone}</div>
            </div>
            ` : ''}

            <div class="field">
              <div class="label">💬 Message:</div>
              <div class="value" style="white-space: pre-wrap;">${message}</div>
            </div>
          </div>

          <div class="footer">
            <p>This message was sent from the Fake Products Detector contact form</p>
            <p>Source: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `

    const contactEmailText = `
      New Contact Form Submission

      Name: ${name}
      Email: ${email}
      ${phone ? `Phone: ${phone}` : ''}
      Message: ${message}

      Sent from Fake Products Detector contact form
      Date: ${new Date().toLocaleString()}
    `

    // Send email to sampidia02@gmail.com
    const emailResult = await sendEmail({
      to: 'sampidia0@gmail.com',
      subject: `Contact Form: Message from ${name}`,
      html: contactEmailHtml,
      text: contactEmailText,
      from: `"Fake Detector Contact" <noreply@fake-detector-app.com>`
    })

    if (emailResult) {
      console.log('Contact form email sent successfully to sampidia02@gmail.com')
      return NextResponse.json(
        {
          success: true,
          message: 'Message sent successfully! We will get back to you soon.'
        },
        { status: 200 }
      )
    } else {
      console.error('Failed to send contact form email')
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
