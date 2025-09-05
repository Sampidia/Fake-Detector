const axios = require('axios');
const cheerio = require('cheerio');

// Simple alert data structure (JavaScript equivalent)
// This represents the structure of scraped alert data:
// {
//   title: string,
//   url: string,
//   excerpt: string,
//   date: string,
//   fullContent: string,
//   productNames: string[],
//   batchNumbers: string[]
// }

// Simple NAFDAC Web Scraper
class NafdacSimpleScraper {
  constructor() {
    this.baseUrl = 'https://nafdac.gov.ng/category/recalls-and-alerts/';
  }

  async scrapeAndStoreAlerts(limit = 5) {
    console.log('🚀 Starting SIMPLE NAFDAC scraping...');

    const result = {
      success: false,
      newAlerts: 0,
      totalProcessed: 0,
      errors: []
    };

    try {
      // Fetch main alerts page
      console.log('📄 Fetching NAFDAC alerts page...');
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // SIMPLE STRING-BASED LINK EXTRACTION
      console.log('🔍 Looking for alert links...');
      const alertLinks = [];

      // Simple alert detection using string contains
      const alertKeywords = ['alert', 'recall', 'counterfeit', 'fake', 'substandard', 'falsified'];

      $('a[href*="nafdac.gov.ng"]').each((index, element) => {
        const $elem = $(element);
        const url = $elem.attr('href');

        // Skip if no URL
        if (!url) return;

        let title = $elem.text().trim();

        // Get title from parent if link text is empty
        if (!title || title.length < 5) {
          title = $elem.closest('h1, h2, h3, .entry-title, article').find('a, .title').first().text().trim() ||
                 $elem.parents().find('h1, h2, h3, .entry-title').first().text().trim() ||
                 'Unknown Alert';
        }

        // Simple string matching for alerts
        const isAlert = alertKeywords.some(keyword =>
          title.toLowerCase().includes(keyword) ||
          url.toLowerCase().includes(keyword) ||
          url.includes('/recalls-and-alerts/')
        );

        // Avoid duplicates and category pages
        const isNew = !alertLinks.some(link => link.url === url);
        const isNotCategory = !url.includes('/category/') || url === this.baseUrl;

        if (isAlert && isNew && isNotCategory && url.startsWith('http')) {
          alertLinks.push({ url, title: title || 'Unnamed Alert' });
          console.log(`🎯 FOUND ALERT: "${title}" -> ${url}`);
        }

        if (alertLinks.length >= limit) return false;
      });

      console.log(`🔗 Found ${alertLinks.length} alert links`);

      result.success = true;

      // Process ONE alert at a time for debugging
      if (alertLinks.length > 0) {
        console.log('📝 Processing first alert...');
        const firstAlert = alertLinks[0];

        const alertData = await this.scrapeSingleAlert(firstAlert.url, firstAlert.title);

        if (alertData) {
          console.log(`✅ Successfully extracted alert: ${alertData.title}`);
          console.log(`📄 Content length: ${alertData.fullContent.length} characters`);

          // Store in database (simplified)
          const saved = await this.storeAlertToDatabase(alertData);
          if (saved) {
            result.newAlerts = 1;
          }
        } else {
          result.errors.push('Failed to extract alert data');
        }

        result.totalProcessed = 1;
      }

    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      result.errors.push(`Main scraping error: ${error.message}`);
    }

    return result;
  }

  async scrapeSingleAlert(url, fallbackTitle) {
    try {
      console.log(`🔍 Fetching alert page: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // EXTRACT TITLE - try multiple simple selectors
      const title = $('.entry-title, h1').first().text().trim() ||
                   $('h1').first().text().trim() ||
                   $('title').text().trim() ||
                   fallbackTitle;

      // EXTRACT DATE - simple string search
      const dateText = $('.entry-date, .published, time').first().text().trim() ||
                      $('time').first().text().trim() ||
                      new Date().toISOString().split('T')[0];

      let date = new Date().toISOString().split('T')[0]; // fallback
      try {
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString().split('T')[0];
        }
      } catch (e) {
        console.log('⚠️ Could not parse date, using today');
      }

      // EXTRACT CONTENT - simple selectors
      const fullContent = $('.entry-content, .content, article').text().trim() ||
                         $('p').text().trim() ||
                         title;

      // SIMPLE PRODUCT EXTRACTION - basic string matching
      const productNames = [];
      const batchNumbers = [];

      const lowerContent = fullContent.toLowerCase();

      // Look for common drug names using simple contains
      const commonDrugs = ['paracetamol', 'ibuprofen', 'metronidazole', 'ciprofloxacin'];

      commonDrugs.forEach(drug => {
        if (lowerContent.includes(drug.toLowerCase())) {
          productNames.push(drug);
        }
      });

      // Look for "Batch" or "Lot" followed by numbers/letters
      const batchMatches = fullContent.match(/\bbatch\s+(\w+)/gi) ||
                          fullContent.match(/\blot\s+(\w+)/gi) ||
                          [];
      batchNumbers.push(...batchMatches.map(match => match.split(/\s+/)[1]));

      // Create excerpt from first paragraph
      const excerpt = $('p').first().text().trim() || fullContent.substring(0, 200) + '...';

      const alertData = {
        title: title || 'Untitled Alert',
        url,
        excerpt,
        date,
        fullContent,
        productNames,
        batchNumbers
      };

      console.log('📋 Extracted alert data:');
      console.log(`   Title: ${alertData.title}`);
      console.log(`   Date: ${alertData.date}`);
      console.log(`   Products: ${alertData.productNames.join(', ')}`);
      console.log(`   Batches: ${alertData.batchNumbers.join(', ')}`);
      console.log(`   Content preview: ${alertData.excerpt.substring(0, 100)}...`);

      return alertData;

    } catch (error) {
      console.error(`❌ Failed to scrape alert: ${url}`, error.message);
      return null;
    }
  }

  async storeAlertToDatabase(alertData) {
    try {
      console.log(`💾 Storing alert: ${alertData.title}`);

      // For now, just log what we would store
      console.log('📦 Would store in database:');
      console.log(`   - Title: ${alertData.title}`);
      console.log(`   - URL: ${alertData.url}`);
      console.log(`   - Date: ${alertData.date}`);
      console.log(`   - Products: ${JSON.stringify(alertData.productNames)}`);
      console.log(`   - Batches: ${JSON.stringify(alertData.batchNumbers)}`);

      return true;

    } catch (error) {
      console.error('❌ Database storage failed:', error.message);
      return false;
    }
  }
}

// Test the scraper
async function testScraper() {
  console.log('Testing simplified NAFDAC scraper...\n');

  const scraper = new NafdacSimpleScraper();

  try {
    const result = await scraper.scrapeAndStoreAlerts(1);
    console.log('\n🎯 TEST COMPLETED');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testScraper().catch(console.error);
