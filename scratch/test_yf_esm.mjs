import YahooFinance from 'yahoo-finance2';

async function test() {
  const yahooFinance = new YahooFinance();
  try {
    const results = await yahooFinance.search('Titan');
    console.log('Search Titan:', results.quotes.slice(0, 3));
    
    const quote = await yahooFinance.quote('TITAN.NS');
    console.log('Quote TITAN.NS:', quote.regularMarketPrice);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
