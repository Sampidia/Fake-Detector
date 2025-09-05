// Quick test runner for the Fake Medicine Detector
// Run with: node run-tests.js

const { spawn } = require('child_process')

console.log('🧪 FAKE MEDICINE DETECTOR - TESTING SUITE\n')

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 ${description}...\n`)

    const process = spawn('cmd', ['/c', command], {
      cwd: __dirname,
      stdio: 'inherit'
    })

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${description} COMPLETED\n`)
        resolve()
      } else {
        console.log(`\n❌ ${description} FAILED (exit code: ${code})\n`)
        reject(code)
      }
    })
  })
}

async function runTests() {
  try {
    console.log('🎯 STARTING COMPREHENSIVE SYSTEM TEST...\n')

    // Step 1: Check dependencies
    console.log('📦 STEP 1: Checking Dependencies')
    await runCommand('npm list --depth=0', 'Checking installed dependencies')

    // Step 2: Generate Prisma client
    console.log('📊 STEP 2: Generating Prisma Client')
    await runCommand('npx prisma generate', 'Generating Prisma client')

    // Step 3: Push database schema
    console.log('🗃️ STEP 3: Database Schema Setup')
    await runCommand('npx prisma db push', 'Pushing database schema')

    // Step 4: Database tests
    console.log('🚀 STEP 4: Database Functionality Tests')
    await runCommand('node test-database.js', 'Testing database connections')

    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!')
    console.log('\n🔎 NEXT STEPS:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Test API endpoints with: node test-api.js')
    console.log('3. Test the scraper: npm run scraper:test')
    console.log('4. Test manual verification endpoint')

  } catch (error) {
    console.error(`\n❌ Test suite stopped at step with exit code: ${error}`)
    console.log('\n🔧 TROUBLESHOOTING STEPS:')
    console.log('1. Check your .env file has correct DATABASE_URL')
    console.log('2. Ensure PostgreSQL is running')
    console.log('3. Run individual tests to identify the issue')
    console.log('4. Check logs for specific error messages')
  }
}

// Check what arguments were passed
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log('🛠️  Usage:')
  console.log('  node run-tests.js        # Run all tests')
  console.log('  node test-database.js   # Test database only')
  console.log('  node test-api.js        # Test API endpoints')
  console.log('\n📋 Test Requirements:')
  console.log('  • PostgreSQL running')
  console.log('  • .env file configured')
  console.log('  • Dependencies installed')
} else {
  runTests()
}
