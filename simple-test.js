const axios = require('axios');
const cheerio = require('cheerio');

async function testBasicFetch() {
  try {
    console.log('Testing basic axios fetch...');

    const response = await axios.get('https://nafdac.gov.ng/category/recalls-and-alerts/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });

    console.log(`✅ Page fetched successfully! Status: ${response.status}`);
    console.log(`📄 Content length: ${response.data.length} characters`);

    // Load with cheerio
    const $ = cheerio.load(response.data);

    // Debug: Show title and some basic page info
    const title = $('title').text().trim() || 'No title found';
    console.log(`📋 Page title: ${title}`);

    // Debug: Show all nafdac.gov.ng links (first 10)
    console.log('\n🔍 All NAFDAC links found:');
    const links = [];
    $('a[href*="nafdac.gov.ng"]').each((index, element) => {
      const $elem = $(element);
      const url = $elem.attr('href');
      const text = $elem.text().trim();
      if (url) {
        links.push(`${text}: ${url}`);
      }
      if (links.length >= 10) return false; // limit to 10
    });

    links.forEach((link, i) => {
      console.log(`   ${i+1}. ${link.substring(0, 80)}...`);
    });

    console.log(`\n✅ Found ${links.length} NAFDAC links`);

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test
console.log('Simple NAFDAC page test starting...\n');
testBasicFetch().then(success => {
  console.log(`\n${success ? '✅' : '❌'} Test completed`);
}).catch(console.error);
