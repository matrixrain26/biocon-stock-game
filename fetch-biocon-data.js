// Script to fetch BIOCON.NS stock data from Yahoo Finance API
import fs from 'fs';
import https from 'https';

// Use absolute historical dates for the last year of trading data
// End date: August 6, 2023 (actual current date, not simulated)
const endDate = new Date(2023, 7, 6); // August 6, 2023
// Convert to Unix timestamp (seconds)
const endTimestamp = Math.floor(endDate.getTime() / 1000);

// Start date: August 7, 2022 (one year before)
const startDate = new Date(2022, 7, 7); // August 7, 2022
const startTimestamp = Math.floor(startDate.getTime() / 1000);

// Yahoo Finance API URL
const symbol = 'BIOCON.NS';
const interval = '1d'; // daily data
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=${interval}&includePrePost=false`;

console.log(`Fetching data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

// Make the request to Yahoo Finance API
https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.chart && response.chart.result && response.chart.result[0]) {
        const result = response.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        // Format data for our application
        const stockData = timestamps.map((timestamp, index) => {
          const date = new Date(timestamp * 1000).toISOString().split('T')[0];
          return {
            date,
            open: quotes.open[index] || null,
            high: quotes.high[index] || null,
            low: quotes.low[index] || null,
            close: quotes.close[index] || null,
            volume: quotes.volume[index] || 0
          };
        }).filter(item => item.open !== null && item.high !== null && item.low !== null && item.close !== null);
        
        // Take the latest 250 trading days (or all if less than 250)
        const latestData = stockData.slice(-250);
        
        console.log(`Retrieved ${latestData.length} days of data`);
        
        // Write to file
        fs.writeFileSync('biocon-data.json', JSON.stringify(latestData, null, 2));
        console.log('Data saved to biocon-data.json');
      } else {
        console.error('Invalid response format from Yahoo Finance API');
        console.error(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('Error processing data:', error);
    }
  });
}).on('error', (error) => {
  console.error('Error fetching data:', error);
});
