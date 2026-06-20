import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const TICKER_MAP: Record<string, string> = {
  "TMPV": "TVSMOTOR.NS", // Educated guess
  "Castrol India": "CASTROLIND.NS",
  "RVNL": "RVNL.NS",
  "ICICI Bank": "ICICIBANK.NS",
  "Wockhardt Pharma": "WOCKPHARMA.NS",
  "Sundaram Finance (Sundaram MFIN)": "SUNDARMFIN.NS",
  "Mazagon Dock (MAZDOCK)": "MAZDOCK.NS",
  "DMart (Avenue Supermarts)": "DMART.NS",
  "AIIL": "AWL.NS",
  "Titan": "TITAN.NS",
  "IndiaMART": "INDIAMART.NS",
  "Bharti (Nexa)": "BHARTIHEXA.NS",
  "OIL (Oil India)": "OIL.NS",
  "Five-Star Business Finance": "FIVESTAR.NS",
  "Engineers India (ENGINERSIN)": "ENGINERSIN.NS",
  "NTPC": "NTPC.NS",
  "KEC International": "KEC.NS",
  "Dr. Reddy's Laboratories": "DRREDDY.NS",
  "Asian Paints": "ASIANPAINT.NS",
  "Schaeffler India": "SCHAEFFLER.NS",
  "Bajaj Holdings (BAJAJHLDNG)": "BAJAJHLDNG.NS",
  "Navin Fluorine": "NAVINFLUOR.NS",
  "Bata India": "BATAINDIA.NS",
  "CG Power (CGCL)": "CGPOWER.NS",
  "PG Electroplast (PGEL)": "PGEL.NS",
  "Travel Food Services": "", // Unlisted or unknown, skip
  "KAYNES Technology": "KAYNES.NS",
  "Marico": "MARICO.NS",
  "Redington": "REDINGTON.NS",
  "Bharti Airtel": "BHARTIARTL.NS",
  "Niva Bupa": "NIVABUPA.NS",
  "Bharat Dynamics (BDL)": "BDL.NS",
  "ENRIN": "IREDA.NS", 
  "Jyoti CNC Automation (JYOTICNC)": "JYOTICNC.NS",
  "Tata Power": "TATAPOWER.NS",
  "Union Bank of India": "UNIONBANK.NS",
  "Piramal Pharma (Piramalphin)": "PIRAMALPHI.NS",
  "AIRENG": "AIAENG.NS",
};

export async function POST(request: Request) {
  try {
    const { stocks } = await request.json();
    if (!Array.isArray(stocks)) {
      return NextResponse.json({ error: "Invalid payload, expected array of stock names." }, { status: 400 });
    }

    const prices: Record<string, number | null> = {};
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

    await Promise.all(stocks.map(async (stockName) => {
      const ticker = TICKER_MAP[stockName];
      if (!ticker) {
        prices[stockName] = null;
        return;
      }

      try {
        const quote = await yahooFinance.quote(ticker);
        prices[stockName] = quote.regularMarketPrice ?? null;
      } catch (err) {
        console.error(`Failed to fetch quote for ${ticker}:`, err);
        prices[stockName] = null;
      }
    }));

    return NextResponse.json({ prices });
  } catch (error: any) {
    console.error("Stock Prices Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch stock prices." }, { status: 500 });
  }
}
