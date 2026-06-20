export type StockRecommendations = {
  buy: string[];
  sell: string[];
};

export function getStockRecommendations(experienceLevel: string | undefined, investableSurplus: number): StockRecommendations {
  const level = experienceLevel?.toLowerCase() || "beginner";

  if (level === "beginner") {
    if (investableSurplus < 10000) {
      return {
        buy: ["TMPV", "Castrol India", "RVNL"],
        sell: ["ICICI Bank", "Wockhardt Pharma"],
      };
    } else if (investableSurplus < 25000) {
      return {
        buy: ["Sundaram Finance (Sundaram MFIN)", "ICICI Bank", "Mazagon Dock (MAZDOCK)", "DMart (Avenue Supermarts)"],
        sell: ["RVNL", "AIIL"],
      };
    } else {
      return {
        buy: ["Titan", "IndiaMART", "Bharti (Nexa)"],
        sell: ["OIL (Oil India)", "Five-Star Business Finance"],
      };
    }
  } else if (level === "intermediate") {
    if (investableSurplus < 10000) {
      return {
        buy: ["Engineers India (ENGINERSIN)", "NTPC", "KEC International"],
        sell: ["Dr. Reddy's Laboratories", "ICICI Bank"],
      };
    } else if (investableSurplus < 25000) {
      return {
        buy: ["Mazagon Dock (MAZDOCK)", "Asian Paints", "Schaeffler India"],
        sell: ["DMart (Avenue Supermarts)", "AIIL"],
      };
    } else {
      return {
        buy: ["Bajaj Holdings (BAJAJHLDNG)", "DMart (Avenue Supermarts)", "Asian Paints"],
        sell: ["Navin Fluorine", "Bata India", "CG Power (CGCL)"],
      };
    }
  } else {
    // experienced
    if (investableSurplus < 10000) {
      return {
        buy: ["Sundaram Finance (Sundaram MFIN)", "PG Electroplast (PGEL)", "TMPV", "Travel Food Services"],
        sell: ["RVNL", "AIIL", "KAYNES Technology", "Marico", "Redington"],
      };
    } else if (investableSurplus < 25000) {
      return {
        buy: ["Mazagon Dock (MAZDOCK)", "Bharti Airtel", "Titan", "Niva Bupa"],
        sell: ["Bharat Dynamics (BDL)", "ENRIN", "Jyoti CNC Automation (JYOTICNC)", "Tata Power"],
      };
    } else {
      return {
        buy: ["Titan", "OIL (Oil India)", "Schaeffler India", "DMart (Avenue Supermarts)"],
        sell: ["RVNL", "AIIL", "Union Bank of India", "Bata India", "Piramal Pharma (Piramalphin)", "AIRENG"],
      };
    }
  }
}
