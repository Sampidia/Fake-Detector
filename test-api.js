// Test script to verify API endpoints work correctly
// Run with: node test-api.js

const axios = require('axios')

async function testAPI() {
  console.log('🧪 STARTING API TESTS...\n')

  const baseURL = 'https://fake-detector.vercel.app'

  try {
    // Test 1: Basic health check
    console.log('🔍 Test 1: Basic API Health Check')
    try {
      const healthResponse = await axios.get(`${baseURL}/api`)
      console.log('✅ API is alive:', healthResponse.status)
    } catch (error) {
      console.log('❌ API health check failed:', error.message)
    }

    // Test 2: Scraper stats endpoint
    console.log('\n📰 Test 2: NAFDAC Scraper Stats')
    try {
      const statsResponse = await axios.get(`${baseURL}/api/scraper/stats`)
      console.log('✅ Scraper stats:', statsResponse.data)
    } catch (error) {
      console.log('❌ Scraper stats failed:', error.message)
    }

    // Test 3: Cron job status check
    console.log('\n⏰ Test 3: Cron Job Status')
    try {
      const cronResponse = await axios.get(`${baseURL}/api/scraper/cron`)
      console.log('✅ Cron status:', cronResponse.data)
    } catch (error) {
      console.log('❌ Cron status failed:', error.message)
    }

    // Test 4: Product verification (without authentication first)
    console.log('\n🔍 Test 4: Product Verification (should fail without auth)')
    try {
      const testData = {
        productName: 'test product',
        productDescription: 'test description',
        batchNumber: 'TEST001'
      }

      const verifyResponse = await axios.post(`${baseURL}/api/verify-product`, testData)
      console.log('✅ Verification worked:', verifyResponse.data)
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication properly enforced:', error.response.status)
      } else {
        console.log('❌ Unexpected error:', error.message)
      }
    }

    console.log('\n🎉 API TESTS COMPLETED!')
    console.log('\n📝 NEXT STEPS:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Re-run this test to see API responses')
    console.log('3. Then we can proceed with security testing')

  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
  }
}

testAPI()
