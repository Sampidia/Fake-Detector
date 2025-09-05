# ⚡ Quick Setup Guide - Fake Products Detector

## 🛠️ Installation & Setup

### Step 1: Install Dependencies
```bash
cd fake-detector-app
npm install

# If you get peer dependency warnings, you can use:
npm install --legacy-peer-deps

# OR force the installation (if still having issues):
npm install --force
```

### Step 2: Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

**Essential Required Variables:**
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/fake_detector_db"

# NextAuth Configuration
NEXTAUTH_URL="https://fake-detector.vercel.app"
NEXTAUTH_SECRET="your-random-secret-key-here"

# Google OAuth (Get from Google Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# At least one payment gateway
PAYSTACK_SECRET_KEY="your-paystack-secret"  # OR
FLUTTERWAVE_SECRET_KEY="your-flutterwave-secret"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Step 3: Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Optional: Seed database with initial data
npm run db:studio  # Opens Prisma Studio
```

### Step 4: Start Development Server
```bash
npm run dev
```

Visit: https://fake-detector.vercel.app

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Update database schema
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create migration (production)

# Code Quality
npm run lint         # Run ESLint
```

## 🚀 Getting Help

If you encounter issues:

1. **Error: `Cannot find module`**: Run `npm install` again
2. **Database connection errors**: Check your DATABASE_URL
3. **Auth errors**: Verify Google OAuth setup
4. **Payment errors**: Ensure gateway API keys are correct

## 📋 What's Working

After setup, you'll have:
- ✅ Next.js 14 with TypeScript
- ✅ Tailwind CSS with custom styling
- ✅ Authentication system (Google OAuth ready)
- ✅ Database with Prisma ORM
- ✅ Payment gateway integration
- ✅ Email system (SMTP ready)
- ✅ MCP server integration ready
- ✅ Custom UI components configured

## 🎯 Next Steps

Once everything is installed:

1. **Set up database** (Prisma schema creation)
2. **Configure authentication** (Google OAuth setup)
3. **Implement MCP server** (NAFDAC integration)
4. **Build UI components** (upload zones, result cards)
5. **Set up payments** (Paystack/Flutterwave)
6. **Deploy to Vercel** (production hosting)

## 🔍 Environment Variables Details

### Google Console Setup
1. Go to https://console.cloud.google.com
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URI: `https://fake-detector.vercel.app/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

### Database Setup (PostgreSQL)
```bash
# Using Docker
docker run -d --name postgres-fake-detector \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=fake_detector_db \
  -e POSTGRES_USER=myuser \
  -p 5432:5432 postgres:15

# Connection String
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/fake_detector_db"
```

## 💡 Tips

- **Development**: Use Turbopack for faster builds
- **TypeScript**: Full type safety configured
- **Styling**: Tailwind with custom design system
- **Database**: Prisma Studio for visual database management
- **Version Control**: Commit frequently, ignore node_modules

**Your fake products detector project is ready!** 🚀