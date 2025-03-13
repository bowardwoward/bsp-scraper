import { Hono } from 'hono';
import { BspIssuanceScraper } from './scraper.js';

const app = new Hono();

app.get('/issuances', async (c) => {
  try {
    const yearStart = parseInt(c.req.query('yearStart') || '2014');
    const yearEnd = parseInt(c.req.query('yearEnd') || '2025');
    
    const scraper = new BspIssuanceScraper();
    const issuances = await scraper.scrapeAllIssuances(yearStart, yearEnd);
    
    return c.json({
      success: true,
      count: issuances.length,
      issuances
    });
  } catch (error) {
    console.error('Error scraping issuances:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/issuances/paginated', async (c) => {
  try {
    const yearStart = parseInt(c.req.query('yearStart') || '2014');
    const yearEnd = parseInt(c.req.query('yearEnd') || '2025');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '50');
    
    if (page < 1 || pageSize < 1 || pageSize > 500) {
      return c.json({
        success: false,
        error: 'Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 500.'
      }, 400);
    }
    
    // Calculate how many items to skip
    const skip = (page - 1) * pageSize;
    
    // Create scraper with appropriate chunk size
    const scraper = new BspIssuanceScraper({
      chunkSize: pageSize,
      maxChunks: 1
    });
    
    // Get the first chunk from the generator
    const generator = scraper.scrapeIssuancesInChunks(yearStart, yearEnd);
    const result = await generator.next();
    
    if (result.done) {
      return c.json({
        success: true,
        count: 0,
        issuances: [],
        pagination: {
          page,
          pageSize,
          hasMore: false
        }
      });
    }
    
    const issuances = result.value;
    
    return c.json({
      success: true,
      count: issuances.length,
      issuances,
      pagination: {
        page,
        pageSize,
        hasMore: issuances.length === pageSize
      }
    });
  } catch (error) {
    console.error('Error scraping issuances:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;