// ESM-compatible script to test Yahoo Finance API
import { promises as fs } from 'fs';

// Function to fetch data from URL
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    console.log('Fetching BIOCON.NS data from Yahoo Finance...');
    
    // Fixed start date (2024-08-07)
    const startDate = new Date('2024-08-07');
    const period1 = Math.floor(startDate.getTime() / 1000);
    
    // Get tomorrow to ensure we include today's data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const period2 = Math.floor(tomorrow.getTime() / 1000);
    
    // Encoded URL for AllOrigins proxy
    const encodedUrl = encodeURIComponent(
      `https://query1.finance.yahoo.com/v8/finance/chart/BIOCON.NS?period1=${period1}&period2=${period2}&interval=1d&includePrePost=true&events=div%2Csplit%2Cearn`
    );
    
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodedUrl}`;
    console.log('Using proxy URL:', proxyUrl);
    
    const data = await fetchData(proxyUrl);
    
    if (!data || !data.chart || !data.chart.result || !data.chart.result[0]) {
      console.error('Invalid data structure received');
      return;
    }
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    
    // Log data range
    if (timestamps.length > 0) {
      const firstDate = new Date(timestamps[0] * 1000).toISOString().split('T')[0];
      const lastDate = new Date(timestamps[timestamps.length - 1] * 1000).toISOString().split('T')[0];
      console.log(`Data range: ${firstDate} to ${lastDate}`);
      console.log(`Total days: ${timestamps.length}`);
    }
    
    // Log the last two trading days for verification
    if (timestamps.length >= 2) {
      const lastIndex = timestamps.length - 1;
      const secondLastIndex = timestamps.length - 2;
      
      const lastDay = {
        date: new Date(timestamps[lastIndex] * 1000).toISOString().split('T')[0],
        open: quote.open[lastIndex],
        high: quote.high[lastIndex],
        low: quote.low[lastIndex],
        close: quote.close[lastIndex],
        volume: quote.volume[lastIndex]
      };
      
      const secondLastDay = {
        date: new Date(timestamps[secondLastIndex] * 1000).toISOString().split('T')[0],
        open: quote.open[secondLastIndex],
        high: quote.high[secondLastIndex],
        low: quote.low[secondLastIndex],
        close: quote.close[secondLastIndex],
        volume: quote.volume[secondLastIndex]
      };
      
      console.log('Latest trading day:', JSON.stringify(lastDay, null, 2));
      console.log('Second latest trading day:', JSON.stringify(secondLastDay, null, 2));
      
      // Save the data to a file for reference
      await fs.writeFile('latest-biocon-data.json', JSON.stringify({
        latestDay: lastDay,
        secondLatestDay: secondLastDay
      }, null, 2));
      console.log('Saved latest data to latest-biocon-data.json');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
main();
