const { YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const symbol = 'TITAN.NS';
    // fetch quote
    const quote = await yahooFinance.quote(symbol);
    console.log(`Quote for ${symbol}:`, {
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketPreviousClose: quote.regularMarketPreviousClose,
      marketState: quote.marketState,
      longName: quote.longName
    });

    const symbol2 = 'RVNL.NS';
    const quote2 = await yahooFinance.quote(symbol2);
    console.log(`Quote for ${symbol2}:`, {
      regularMarketPrice: quote2.regularMarketPrice,
      regularMarketPreviousClose: quote2.regularMarketPreviousClose,
      marketState: quote2.marketState,
      longName: quote2.longName
    });
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

test();
