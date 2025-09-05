# 🧪 Fake Medicine Detector - Testing Guide

## Quick Start Testing

### Option 1: Run All Tests (Recommended)
```bash
npm run test:all
```

This will run:
- Dependency checks
- Prisma client generation
- Database schema setup
- Database connectivity tests
- Basic API endpoint validation

### Option 2: Individual Tests
```bash
# Test database only
npm run test:db

# Test API endpoints (requires dev server running)
npm run test:api

# Manual test runner
node run-tests.js
```

## 🔧 Testing Prerequisites

### 1. Environment Setup
Ensure you have a `.env.local` file with:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/fake_detector_db"
NEXTAUTH_URL="https://fake-detector.vercel.app"
NEXTAUTH_SECRET="your-secret-key"
CRON_SECRET_KEY="your-cron-secret"
```

### 2. Database Setup
```bash
# Ensure PostgreSQL is running
npx prisma generate
npx prisma db push
```

### 3. Dependencies
```bash
npm install
```

## 📋 Test Results

### ✅ Expected Successful Tests:

**Database Test (test:db)**
- Database connection: ✅ WORKING
- Users table exists, current count: X
- NAFDAC alerts table exists, current count: X
- Product checks table exists, current count: X
- Check results table exists, current count: X
- Scraper status table exists, current count: X
- Known fake products loaded: 1+

**API Test (test:api)** _Requires dev server running_
- API health check: ✅ API is alive: 200
- Scraper stats: Shows alert counts
- Cron status: Shows maintenance mode status
- Authentication properly enforced: 401

### ⚠️ Handling Common Issues:

**Issue: Database connection fails**
```bash
# Check PostgreSQL is running
sudo service postgresql start

# Verify DATABASE_URL in .env.local
cat .env.local

# Test database manually
psql $DATABASE_URL -c "SELECT 1"
```

**Issue: Prisma client not generated**
```bash
npx prisma generate
npx prisma db push --force-reset
```

**Issue: API tests fail (not running)**
```bash
# Start dev server in another terminal
npm run dev

# Wait for server to start, then test
npm run test:api
```

## 🎯 Next Steps After Testing

### If Tests Pass ✅
- Start implementing security hardening as planned
- Proceed with database performance optimizations
- Move to production readiness phase

### If Tests Fail ❌
- Fix the specific failing component first
- Re-run tests to verify the fix
- Only proceed to advanced features after core functionality works

## 🧪 Manual Testing Scenarios

### Frontend Testing
1. **Scan Flow**: Upload images → Process OCR → Show results
2. **Authentication**: Login → Scan limits → Points system
3. **Maintenance Mode**: Automatic UI switching during scraper runs

### API Testing
```bash
# Test product verification
curl -X POST https://fake-detector.vercel.app/api/verify-product \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productName":"test","productDescription":"test desc","batchNumber":"TEST"}'

# Test scraper manually
npm run scraper:manual

# Test with cron authentication
curl -X POST https://fake-detector.vercel.app/api/scraper/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Database Testing
```bash
# Open Prisma Studio
npm run db:studio

# Check scraper status
npx prisma studio --schema=prisma/schema.prisma
# SELECT * FROM ScraperStatus
```

## 🔍 Debug Information

Run these commands to get debug info:
```bash
# Environment info
node -e "console.log(process.env)"

# Database connection test
npx prisma db execute --file=./test-db.sql

# Check system resources
free -h  # Linux/Mac
systeminfo # Windows
```

## 📊 Test Reports

### Save Test Results
```bash
# Run tests and save output
npm run test:all > test-results.log 2>&1
npm run test:db > db-test-results.log 2>&1
npm run test:api > api-test-results.log 2>&1
```

### Analyze Performance
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://fake-detector.vercel.app/api/verify-product
```

---

## 📝 Need Help?

If tests are failing:

1. **Run Individual Tests** to identify the problem area
2. **Check Logs** for detailed error messages
3. **Verify Environment Setup** (database, .env, dependencies)
4. **Test Components Separately** (frontend, API, database)

**Remember**: Fix core issues first before adding advanced features! 🏗️
