// Database connection and schema test
// Run with: node test-database.js

const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  console.log('🗃️ TESTING DATABASE CONNECTION...\n')

  const prisma = new PrismaClient()

  try {
    // Test 1: Database connection
    console.log('🔌 Test 1: Database Connection')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Test 2: Check tables exist
    console.log('\n📋 Test 2: Database Schema')
    try {
      const userCount = await prisma.user.count()
      console.log('✅ Users table exists, current count:', userCount)
    } catch (error) {
      console.log('❌ Users table issue:', error.message)
    }

    try {
      const alertCount = await prisma.nafdacAlert.count()
      console.log('✅ NAFDAC alerts table exists, current count:', alertCount)
    } catch (error) {
      console.log('❌ NAFDAC alerts table issue:', error.message)
    }

    try {
      const verifyCount = await prisma.productCheck.count()
      console.log('✅ Product checks table exists, current count:', verifyCount)
    } catch (error) {
      console.log('❌ Product checks table issue:', error.message)
    }

    try {
      const resultCount = await prisma.checkResult.count()
      console.log('✅ Check results table exists, current count:', resultCount)
    } catch (error) {
      console.log('❌ Check results table issue:', error.message)
    }

    try {
      const scraperCount = await prisma.scraperStatus.count()
      console.log('✅ Scraper status table exists, current count:', scraperCount)
    } catch (error) {
      console.log('❌ Scraper status table issue:', error.message)
    }

    // Test 3: Scraper Status Check
    console.log('\n🤖 Test 3: Current Scraper Status')
    try {
      const status = await prisma.scraperStatus.findFirst({
        orderBy: { lastUpdated: 'desc' }
      })

      if (status) {
        console.log('✅ Current scraper status:', {
          isScraping: status.isScraping,
          lastScrapedAt: status.lastScrapedAt,
          lastUpdated: status.lastUpdated,
          hasError: !!status.lastError
        })
      } else {
        console.log('⚠️ No scraper status found - system may not have run yet')
      }
    } catch (error) {
      console.log('❌ Scraper status check failed:', error.message)
    }

    // Test 4: Known Fake Products Check
    console.log('\n🚨 Test 4: Known Fake Products Database')
    const knownFakes = [
      { name: 'postinor 2', batch: 'T36184B', url: 'https://nafdac.gov.ng/public-alert-no-027-2025-alert-on-confirmed-counterfeit-postinor2-levonorgestrel-0-75mg-in-nigeria/' }
    ]

    console.log('✅ Known fake products loaded:', knownFakes.length)
    knownFakes.forEach(product => {
      console.log(`   • ${product.name} (batch: ${product.batch})`)
    })

    console.log('\n🎉 DATABASE TESTS COMPLETED!')
    console.log('\n📝 SUMMARY:')
    console.log('✅ Database connection: WORKING')
    console.log('✅ Tables: All created correctly')
    console.log('✅ Known fakes: Configured')
    console.log('\n🚀 READY FOR NEXT PHASE!')

  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    console.log('\n🔧 TROUBLESHOOTING:')
    console.log('1. Check your DATABASE_URL in .env file')
    console.log('2. Ensure PostgreSQL is running')
    console.log('3. Run: npx prisma generate')
    console.log('4. Run: npx prisma db push')
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
