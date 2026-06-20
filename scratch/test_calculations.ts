import { runFinancialAssessment } from "../lib/calculations";
import { IncomeInput, ExpenseInput, BufferInput, InvestingProfile } from "../types";

const income: IncomeInput = {
  employmentType: "self_employed",
  last6MonthsIncome: [4200, 3800, 5100, 3000, 4600, 4300],
};

const expense: ExpenseInput = {
  needs: {
    housing: 2100,
    utilities: 0,
    groceries: 0,
    transportation: 0,
    healthInsurance: 0,
    minDebtPayments: 0,
    otherNeeds: 0,
  },
  wants: {
    diningOut: 900,
    entertainment: 0,
    shopping: 0,
    travelHobbies: 0,
    otherWants: 0,
  },
};

const buffer: BufferInput = {
  hasExistingBuffer: true,
  currentBufferDollars: 4000,
  bufferTimelineMonths: 12,
};

const investing: InvestingProfile = {
  hasInvestedBefore: true,
  experienceLevel: "intermediate",
};

const result = runFinancialAssessment(income, expense, buffer, investing);

console.log("=== CALCULATION ASSESSMENT RESULT ===");
console.log(JSON.stringify(result, null, 2));

console.log("\n=== VERIFYING WORKED EXAMPLE ===");

// We will allow slight differences due to rounding (e.g. baseline 3511.77 vs 3506.67 from rounded std dev)
const matchesBaseline = Math.abs(result.baselineIncome - 3511.77) < 1;
const matchesVolatility = result.volatilityClass === "moderate";
const matchesTarget = result.bufferTargetDollars === 12600;
const matchesGap = result.bufferGapDollars === 8600;
const matchesSurplus = Math.abs(result.surplus - 511.77) < 1;
const matchesContribution = Math.abs(result.monthlyBufferContribution - result.surplus) < 1;
const matchesInvestable = result.investableSurplus === 0;
const matchesTimeline = Math.abs(result.timelineAdjustedMonths! - 17) < 1;

console.log(`Baseline matches (approx 3511): ${matchesBaseline ? "✅ PASS" : "❌ FAIL"} (${result.baselineIncome})`);
console.log(`Volatility matches (moderate): ${matchesVolatility ? "✅ PASS" : "❌ FAIL"} (${result.volatilityClass})`);
console.log(`Buffer Target matches ($12,600): ${matchesTarget ? "✅ PASS" : "❌ FAIL"} ($${result.bufferTargetDollars})`);
console.log(`Buffer Gap matches ($8,600): ${matchesGap ? "✅ PASS" : "❌ FAIL"} ($${result.bufferGapDollars})`);
console.log(`Surplus matches (approx 511): ${matchesSurplus ? "✅ PASS" : "❌ FAIL"} (${result.surplus})`);
console.log(`Buffer Contribution matches surplus (approx 511): ${matchesContribution ? "✅ PASS" : "❌ FAIL"} (${result.monthlyBufferContribution})`);
console.log(`Investable Surplus matches ($0): ${matchesInvestable ? "✅ PASS" : "❌ FAIL"} ($${result.investableSurplus})`);
console.log(`Adjusted Timeline matches (approx 17 months): ${matchesTimeline ? "✅ PASS" : "❌ FAIL"} (${result.timelineAdjustedMonths} months)`);

const allPass = matchesBaseline && matchesVolatility && matchesTarget && matchesGap && matchesSurplus && matchesContribution && matchesInvestable && matchesTimeline;

if (allPass) {
  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The calculations engine is verified. 🎉");
  process.exit(0);
} else {
  console.error("\n❌ SOME TESTS FAILED. Please verify calculation rules. ❌");
  process.exit(1);
}
