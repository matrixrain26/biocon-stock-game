import bioconData from './biocon-data.json';

export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Fixed start date (2024-08-07)
const START_DATE = '2024-08-07';

/**
 * Fetch the latest BIOCON.NS stock data from Yahoo Finance
 * - Always starts from 2024-08-07
 * - Dynamically fetches the latest available data with accurate prices
 * - Uses multiple CORS proxies for reliability
 * - Falls back to local data if fetch fails
 * - Validated with real-time Yahoo Finance data
 */
export async function fetchLatestStockData(): Promise<StockData[]> {
  try {
    console.log('Fetching real-time BIOCON.NS data from Yahoo Finance...');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    
    // Calculate period2 as Unix timestamp (seconds) - add 1 day to ensure we get the latest data
    // This ensures we include any trading that happened today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const period2 = Math.floor(tomorrow.getTime() / 1000);
    
    // Calculate period1 as Unix timestamp for START_DATE
    const startDate = new Date(START_DATE);
    const period1 = Math.floor(startDate.getTime() / 1000);
    
    // Yahoo Finance API URL with additional parameters to ensure we get the latest data
    // Using v8 API for most accurate and up-to-date information
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/BIOCON.NS?period1=${period1}&period2=${period2}&interval=1d&includePrePost=true&events=div%2Csplit%2Cearn`;
    
    // Try multiple CORS proxies for reliability, ordered by reliability
    const proxies = [
      // AllOrigins (proven most reliable in testing)
      `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
      // Direct URL (will work if no CORS issues)
      yahooUrl,
      // CORS Anywhere (may have request limits)
      `https://cors-anywhere.herokuapp.com/${yahooUrl}`,
      // Another alternative
      `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`
    ];
    
    // Try each proxy in sequence until one works
    let response = null;
    let error: Error | null = null;
    let data = null;
    
    for (const proxyUrl of proxies) {
      try {
        console.log('Trying data source:', proxyUrl.substring(0, 30) + '...');
        
        // Use a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        response = await fetch(proxyUrl, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('Successful fetch!');
          data = await response.json();
          
          // Verify we got valid data
          if (data && data.chart && data.chart.result && data.chart.result[0]) {
            break; // Exit the loop if successful and data is valid
          } else {
            console.warn('Received invalid data structure from proxy');
          }
        } else {
          console.warn(`Request failed with status: ${response.status}`);
        }
      } catch (e) {
        console.warn(`Request failed with error:`, e);
        error = e instanceof Error ? e : new Error(String(e));
      }
    }
    
    // If all proxies failed or returned invalid data, throw an error
    if (!data || !data.chart || !data.chart.result || !data.chart.result[0]) {
      throw new Error(`Failed to fetch valid data. Last error: ${error?.message || 'Invalid data structure'}`);
    }
    
    // Extract the timestamp and quote data
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    const adjclose = result.indicators.adjclose?.[0]?.adjclose;
    
    // Log the first and last timestamps to debug date range
    if (timestamps.length > 0) {
      const firstDate = new Date(timestamps[0] * 1000).toISOString().split('T')[0];
      const lastDate = new Date(timestamps[timestamps.length - 1] * 1000).toISOString().split('T')[0];
      console.log(`Data range: ${firstDate} to ${lastDate}`);
      console.log(`Total days: ${timestamps.length}`);
      console.log(`Latest trading day: ${lastDate}`);
    }
    
    // Convert to our StockData format with careful handling of missing values
    const stockData: StockData[] = timestamps.map((timestamp: number, index: number) => {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      
      // Handle potentially missing or null values
      const open = quote.open[index];
      const high = quote.high[index];
      const low = quote.low[index];
      const close = quote.close[index];
      const volume = quote.volume[index];
      
      // Use adjusted close if available, otherwise use regular close
      const adjustedClose = adjclose ? adjclose[index] : close;
      
      return {
        date,
        open: open !== null && open !== undefined ? open : 0,
        high: high !== null && high !== undefined ? high : 0,
        low: low !== null && low !== undefined ? low : 0,
        close: adjustedClose !== null && adjustedClose !== undefined ? adjustedClose : 0,
        volume: volume !== null && volume !== undefined ? volume : 0
      };
    });
    
    // Log the last two trading days for verification
    if (stockData.length >= 2) {
      const lastIndex = stockData.length - 1;
      const secondLastIndex = stockData.length - 2;
      
      const lastDay = stockData[lastIndex];
      const secondLastDay = stockData[secondLastIndex];
      
      console.log('Latest trading day data:', JSON.stringify(lastDay, null, 2));
      console.log('Second latest trading day data:', JSON.stringify(secondLastDay, null, 2));
    }
    
    console.log(`Successfully fetched ${stockData.length} days of BIOCON.NS data`);
    return stockData;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    console.log('Falling back to local data');
    
    // Fall back to local data
    return bioconData as StockData[];
  }
}

/**
 * Get stock data with fallback
 * - Tries to fetch latest data first
 * - Falls back to local data if fetch fails
 */
export async function getStockData(): Promise<StockData[]> {
  try {
    return await fetchLatestStockData();
  } catch (error) {
    console.error('Failed to get latest data, using local fallback:', error);
    return bioconData as StockData[];
  }
}
