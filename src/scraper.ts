import * as cheerio from 'cheerio';
import type { ScraperOptions, IssuanceItem, ExtractedIssuance, ApiResponse } from './types.js';
import axios from 'axios';

export class BspIssuanceScraper {
    private baseUrl: string;
    private chunkSize: number;
    private maxChunks: number | null;
  
    constructor(options: ScraperOptions = {}) {
      this.baseUrl = options.baseUrl || 'https://www.bsp.gov.ph';
      this.chunkSize = options.chunkSize || 100;
      this.maxChunks = options.maxChunks || null;
      
      // Validate options
      if (this.chunkSize <= 0) {
        throw new Error('chunkSize must be a positive number');
      }
    }
  

    private extractDownloadLink(htmlContent: string): string | null {
      const $ = cheerio.load(htmlContent);
      let downloadLink: string | null = null;
      
      $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('.pdf')) {
          // If the href is a relative URL, make it absolute
          if (href.startsWith('/')) {
            downloadLink = `${this.baseUrl}${href}`;
          } else {
            downloadLink = href;
          }
          return false; // Break the each loop once we find a PDF link
        }
      });
      
      return downloadLink;
    }

    private processIssuanceItems(items: IssuanceItem[]): ExtractedIssuance[] {
      return items.map(item => ({
        id: item.Id,
        title: item.Title,
        circularNumber: item.CircularNumber,
        issuanceType: item.IssuanceType,
        dateIssued: item.DateIssued,
        downloadLink: this.extractDownloadLink(item.Content)
      }));
    }
  

    private generateApiUrl(yearStart: number, yearEnd: number, skip: number = 0): string {
      const startDate = `${yearStart}-12-31T16:00:00.000Z`;
      const endDate = `${yearEnd}-12-31T15:59:59.000Z`;
      
      return `${this.baseUrl}/_api/web/lists/getByTitle('Issuances')/items?` +
        `$select=*` +
        `&$filter=DateIssued%20ge%20%27${encodeURIComponent(startDate)}%27%20and%20` +
        `DateIssued%20le%20%27${encodeURIComponent(endDate)}%27%20and%20` +
        `OData__ModerationStatus%20eq%200%20` +
        `&$top=${this.chunkSize}` +
        `&$skip=${skip}` +
        `&$orderby=DateIssued%20desc`;
    }

    private async fetchChunk(yearStart: number, yearEnd: number, skip: number = 0): Promise<ApiResponse> {
      const url = this.generateApiUrl(yearStart, yearEnd, skip);
      console.log(url);
      try {
        const response = await axios.get<ApiResponse>(url, {
          headers: {
            'Accept': 'application/json',
            "ngrok-skip-browser-warning": "69420",
            'Content-Type': 'application/json;odata=verbose;charset=utf-8'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error(`Error fetching chunk with skip=${skip}:`, error);
        throw error;
      }
    }
  
    public async *scrapeIssuancesInChunks(
      yearStart: number = 2014, 
      yearEnd: number = 2025
    ): AsyncGenerator<ExtractedIssuance[], void, unknown> {
      let skip = 0;
      let chunksProcessed = 0;
      let hasMoreData = true;
      
      while (hasMoreData) {
        if (this.maxChunks !== null && chunksProcessed >= this.maxChunks) {
          break;
        }
        
        console.log(`Fetching chunk ${chunksProcessed + 1} with skip=${skip}...`);
        
        const data = await this.fetchChunk(yearStart, yearEnd, skip);
        const items = data.value;
        
        if (!items || items.length === 0) {
          hasMoreData = false;
        } else {
          const processedItems = this.processIssuanceItems(items);
          yield processedItems;
          
          skip += this.chunkSize;
          chunksProcessed++;
          
          if (items.length < this.chunkSize) {
            hasMoreData = false;
          }
        }
      }
    }

    public async scrapeAllIssuances(
      yearStart: number = 2014, 
      yearEnd: number = 2025
    ): Promise<ExtractedIssuance[]> {
      const allIssuances: ExtractedIssuance[] = [];
      
      for await (const chunk of this.scrapeIssuancesInChunks(yearStart, yearEnd)) {
        allIssuances.push(...chunk);
      }
      
      return allIssuances;
    }
  }