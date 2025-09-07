# 🤖 Development Rules & Best Practices Guide

This guide establishes coding standards and best practices for the Fake Detector project to prevent common mistakes and ensure consistent, maintainable code.

## 📋 Table of Contents
- [Next.js Best Practices](#nextjs-best-practices)
- [Prisma Best Practices](#prisma-best-practices)
- [Nodemailer Best Practices](#nodemailer-best-practices)
- [General Development Rules](#general-development-rules)

---

## 🔥 Next.js Best Practices

### 📁 App Router (Next.js 13+)

#### ✅ DOs
- ✅ Use **server components** for data fetching and server-side logic
- ✅ Import **server-only modules** in API routes (`@/lib/*` for database, email, etc.)
- ✅ Use **regular imports** in API routes, avoid dynamic imports
- ✅ Return proper **NextResponse** objects with status codes
- ✅ Validate form data using **server-side validation**
- ✅ Use **environment variables** for configuration
- ✅ Implement **proper error handling** with try/catch blocks
- ✅ Use **Logger** for debugging and monitoring

#### ❌ DON'Ts
- ❌ Don't use **client components** for server logic
- ❌ Don't use **dynamic imports** in API routes (`await import()`)
- ❌ Don't return **plain objects** (use NextResponse.json())
- ❌ Don't handle **authentication** on client-side only
- ❌ Don't use **useState** for server-side data
- ❌ Don't store **secrets** in client-side code

#### 🔧 API Route Structure
```typescript
// ❌ BAD - Dynamic imports
const { sendEmail } = await import('@/lib/email')

// ✅ GOOD - Direct imports
import { sendEmail } from '@/lib/email'
```

#### 🎨 Response Patterns
```typescript
// ✅ GOOD - Proper NextResponse usage
return NextResponse.json(
  { success: true, message: 'Success!' },
  { status: 200 }
)

// ❌ BAD - Plain objects
return { success: true, message: 'Success!' }
```

---

## 🗄️ Prisma Best Practices

### 📊 Database Operations

#### ✅ DOs
- ✅ Use **transactional operations** for related data changes
- ✅ Import **Prisma client** from `@/lib/prisma`
- ✅ Handle **Prisma errors** gracefully with try/catch
- ✅ Use **type-safe queries** with Prisma's generated types
- ✅ Implement **proper logging** for database operations
- ✅ Use **select** to limit returned data
- ✅ Validate **user input** before database operations

#### ❌ DON'Ts
- ❌ Don't create **multiple Prisma instances**
- ❌ Don't use **raw SQL** unless absolutely necessary
- ❌ Don't forget **error handling** in database queries
- ❌ Don't expose **internal errors** to users
- ❌ Don't forget **foreign key relationships** in transactions
- ❌ Don't use **Prisma client** directly in client components

#### 🔧 Database Query Patterns
```typescript
// ✅ GOOD - Proper error handling
try {
  const user = await prisma.user.update({
    where: { id },
    data: { pointsBalance: newBalance },
    select: { id: true, pointsBalance: true }
  })
  return user
} catch (error) {
  Logger.error('Database update failed', { error, userId: id })
  throw new Error('Failed to update balance')
}

// ❌ BAD - No error handling
const user = await prisma.user.update({
  where: { id },
  data: { pointsBalance: newBalance }
})
```

#### 🔐 Data Validation
```typescript
// ✅ GOOD - Server-side validation
if (!name || !email) {
  return NextResponse.json(
    { error: 'Name and email are required' },
    { status: 400 }
  )
}
```

---

## 📧 Nodemailer Best Practices

### 📬 Email Configuration

#### ✅ DOs
- ✅ Use **environment variables** for SMTP configuration
- ✅ Implement **singleton transporter** pattern
- ✅ Handle **email delivery failures** gracefully
- ✅ Use **HTML templates** with proper styling
- ✅ Provide **text fallback** versions
- ✅ Log **email sending events**
- ✅ Validate **recipient email addresses**
- ✅ Use **professional email addresses** (no-reply/domain)

#### ❌ DON'Ts
- ❌ Don't **hardcode email credentials**
- ❌ Don't **skip error handling** for email failures
- ❌ Don't **forget HTML and text versions**
- ❌ Don't use **client-side email sending**
- ❌ Don't **expose SMTP credentials** in logs
- ❌ Don't **forget email validation**

#### 🔧 Email Setup Pattern
```typescript
// ✅ GOOD - Singleton transporter
let transporter: nodemailer.Transporter

function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}
```

#### 📧 Email Sending Pattern
```typescript
// ✅ GOOD - Comprehensive error handling
try {
  const emailResult = await sendEmail({
    to: recipientEmail,
    from: 'hr@sampidia.com.ng',
    subject: `Message from ${name}`,
    html: htmlTemplate,
    text: textFallback
  })

  if (emailResult) {
    Logger.info('Email sent successfully', { recipient: recipientEmail })
  }
} catch (error) {
  Logger.error('Email sending failed', { error, recipient: recipientEmail })
}
```

#### 🔒 Environment Variables Required
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=hr@sampidia.com.ng
```

---

## 🎯 General Development Rules

### 📋 Code Quality

#### ✅ DOs
- ✅ Follow **TypeScript strict mode**
- ✅ Use **descriptive variable names**
- ✅ Add **JSDoc comments** for complex functions
- ✅ Implement **proper logging** with contexts
- ✅ Use **consistent formatting**
- ✅ Handle **edge cases** and **error scenarios**
- ✅ Write **testable code**
- ✅ Use **semantic version control**

#### ❌ DON'Ts
- ❌ Don't use **any type** in TypeScript
- ❌ Don't hardcode **magic numbers/strings**
- ❌ Don't create **deep nesting** (>3 levels)
- ❌ Don't forget **cleanup** in useEffect
- ❌ Don't skip **accessibility** considerations
- ❌ Don't use **deprecated APIs**

### 🔍 Common Mistakes to Avoid

#### 1. Email Address Errors
```typescript
// ❌ Changing email addresses without testing
to: 'wrong@email.com'

// ✅ Double-check email addresses
to: 'sampidia0@gmail.com'
from: 'hr@sampidia.com.ng'
```

#### 2. Missing Error Handling
```typescript
// ❌ No try/catch blocks
const result = await someAsyncOperation()

// ✅ Comprehensive error handling
try {
  const result = await someAsyncOperation()
  Logger.info('Operation successful', { result })
} catch (error) {
  Logger.error('Operation failed', { error })
}
```

#### 3. Dynamic Imports in API Routes
```typescript
// ❌ Dynamic imports in app/api routes
const { module } = await import('@/lib/module')

// ✅ Direct imports in server code
import { module } from '@/lib/module'
```

#### 4. Missing Environment Variables
```typescript
// ❌ Hardcoded values
host: 'smtp.gmail.com'

// ✅ Environment variables
host: process.env.SMTP_HOST || 'smtp.gmail.com'
```

### 🧪 Testing Checklist

#### Before Committing:
- [ ] ✅ All environment variables configured
- [ ] ✅ Email addresses verified
- [ ] ✅ Error handling implemented
- [ ] ✅ TypeScript types checked
- [ ] ✅ Server client separation maintained
- [ ] ✅ Logging statements added
- [ ] ✅ Validation implemented

#### API Routes:
- [ ] ✅ Proper NextResponse usage
- [ ] ✅ Status codes implemented
- [ ] ✅ Input validation
- [ ] ✅ Error boundaries
- [ ] ✅ Logging included

#### Database Operations:
- [ ] ✅ Transactional queries
- [ ] ✅ Error handling
- [ ] ✅ Data validation
- [ ] ✅ Select optimization
- [ ] ✅ Type safety

---

## 📚 Reference Links

### Next.js Resources
- [App Router Documentation](https://nextjs.org/docs/app)
- [API Routes Guide](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

### Prisma Resources
- [Prisma Documentation](https://www.prisma.io/docs)
- [Database Best Practices](https://www.prisma.io/docs/guides/database/best-practices)
- [Error Handling](https://www.prisma.io/docs/concepts/components/prisma-client/error-handling)

### Nodemailer Resources
- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Configuration Guide](https://nodemailer.com/smtp/)
- [Email Best Practices](https://nodemailer.com/message/)

---

## 🔄 Maintenance

**Review Date:** Monthly
**Last Updated:** 2025-01-06
**Updated By:** Claude Assistant

**Add to this guide when you encounter new issues or discover better patterns!**

---

## 🆕 NEW: Vercel Dynamic Server Usage Issues (2024)

### 🚨 Common Problem
Vercel Static Generation Errors like:
```
Dynamic server usage: Route /api/something couldn't be rendered statically because it used `headers`
```

### ✅ Quick Fix: Add 'force-dynamic' to API Routes
**For ANY API route that uses:**
- `headers()` function
- User authentication (`auth()` from NextAuth)
- Request-specific data (cookies, headers, etc.)
- Dynamic responses based on user context

```typescript
// ✅ ADD THIS TO YOUR API ROUTE
export const dynamic = 'force-dynamic'

// Example in your route.ts file:
export async function GET(request: Request) {
  const headers = request.headers // This needs force-dynamic
  return NextResponse.json({ success: true })
}

// Also set force-dynamic
export const dynamic = 'force-dynamic'
```

### 🔍 Affected Routes (Based on Vercel Logs)
1. `/api/admin/ai-providers` - Uses headers for auth
2. `/api/admin/check-access` - Uses headers for session
3. `/api/admin/stats` - Uses headers for user data

### ✅ Verification
After adding `export const dynamic = 'force-dynamic'`:
- ✅ Service works normally
- ✅ No build errors
- ✅ Vercel deployment succeeds
- ✅ API functions correctly

---

*This guide evolves with the project. Please add new rules as you identify patterns and avoid repeating mistakes.*
