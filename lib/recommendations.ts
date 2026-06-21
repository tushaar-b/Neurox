export type StockRecommendations = {
  buy: string[];
  sell: string[];
};

export function getStockRecommendations(experienceLevel: string | undefined, investableSurplus: number): StockRecommendations {
  const level = experienceLevel?.toLowerCase() || "beginner";

  if (level === "beginner") {
    if (investableSurplus < 10000) {
      return {
        buy: ["TMPV", "RVNL"],
        sell: ["Castrol India", "ICICI Bank", "Wockhardt Pharma"],
      };
    } else if (investableSurplus < 25000) {
      return {
        buy: ["Sundaram Finance (Sundaram MFIN)", "Mazagon Dock (MAZDOCK)", "RVNL"],
        sell: ["ICICI Bank", "DMart (Avenue Supermarts)", "AIIL"],
      };
    } else {
      return {
        buy: ["Titan"],
        sell: ["IndiaMART", "Bharti (Nexa)", "OIL (Oil India)", "Five-Star Business Finance"],
      };
    }
  } else if (level === "intermediate") {
    if (investableSurplus < 10000) {
      return {
        buy: ["Engineers India (ENGINERSIN)", "KEC International"],
        sell: ["NTPC", "Dr. Reddy's Laboratories", "ICICI Bank"],
      };
    } else if (investableSurplus < 25000) {
      return {
        buy: ["Mazagon Dock (MAZDOCK)", "Schaeffler India"],
        sell: ["Asian Paints", "DMart (Avenue Supermarts)", "AIIL"],
      };
    } else {
      return {
        buy: ["Bajaj Holdings (BAJAJHLDNG)"],
        sell: ["DMart (Avenue Supermarts)", "Asian Paints", "Navin Fluorine", "Bata India", "CG Power (CGCL)"],
      };
    }
  } else {
    // experienced
    if (investableSurplus < 10000) {
      return {
        buy: ["Sundaram Finance (Sundaram MFIN)", "TMPV", "RVNL", "KAYNES Technology"],
        sell: ["PG Electroplast (PGEL)", "Travel Food Services", "AIIL", "Marico", "Redington"],
      };
    } else if (investableSurplus < 25000) {
      return {
        buy: ["Mazagon Dock (MAZDOCK)", "Titan", "Bharat Dynamics (BDL)", "Jyoti CNC Automation (JYOTICNC)"],
        sell: ["Bharti Airtel", "Niva Bupa", "ENRIN", "Tata Power"],
      };
    } else {
      return {
        buy: ["Titan", "Schaeffler India", "RVNL", "Union Bank of India"],
        sell: ["OIL (Oil India)", "DMart (Avenue Supermarts)", "AIIL", "Bata India", "Piramal Pharma (Piramalphin)", "AIRENG"],
      };
    }
  }
}
