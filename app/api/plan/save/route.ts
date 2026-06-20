import { NextResponse } from "next/server";
import { createNotionPlan, getNotionPlanSummary, getNotionConfig } from "../../../../lib/notion";
import { getStockRecommendations } from "../../../../lib/recommendations";

// Helper to format currency
const f = (val: number) => `₹${val.toLocaleString("en-IN")}`;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      userEmail,
      userName,
      baselineIncome,
      volatilityClass,
      actualNeeds,
      actualWants,
      bufferTargetMonths,
      bufferTargetDollars,
      currentBufferDollars,
      bufferGapDollars,
      monthlyBufferContribution,
      investableSurplus,
      experienceLevel,
      timelineAdjustedMonths,
    } = data;

    if (!userEmail || !userName) {
      return NextResponse.json(
        { error: "User profile details are missing" },
        { status: 400 }
      );
    }

    const config = getNotionConfig(request.headers);

    if (!config.apiKey || !config.plansDbId) {
      return NextResponse.json(
        { error: "Database configuration is incomplete" },
        { status: 500 }
      );
    }

    // --- Generate Server-Side AI Financial Summary ---
    const needsPct = ((actualNeeds / baselineIncome) * 100).toFixed(1);
    const wantsPct = ((actualWants / baselineIncome) * 100).toFixed(1);
    const savePct = (((monthlyBufferContribution + investableSurplus) / baselineIncome) * 100).toFixed(1);

    let volatilityAdvice = "";
    if (volatilityClass === "highly_variable" || volatilityClass === "variable") {
      volatilityAdvice = `Your income exhibits high volatility (${volatilityClass}). AarthiAI has applied a defensive buffer target of ${bufferTargetMonths} months to protect against earnings shocks. Focus aggressively on closing your buffer gap.`;
    } else {
      volatilityAdvice = `Your stable salary stream allows a lower risk adjustment. Your target emergency buffer is set at ${bufferTargetMonths} months. You can compile long-term compound interest with high efficiency.`;
    }

    let bufferAdvice = "";
    if (bufferGapDollars > 0) {
      const timelineInfo = timelineAdjustedMonths
        ? `Given your net surplus, securing this fund will take ${timelineAdjustedMonths} months.`
        : `At a saving rate of ${f(monthlyBufferContribution)}/mo, you are on track to bridge this deficit.`;
      bufferAdvice = `You currently have an emergency reserve gap of ${f(bufferGapDollars)}. ${timelineInfo} During this period, we advise holding market investments in check to secure your baseline needs.`;
    } else {
      bufferAdvice = `Your safety reserves are fully secured at ${f(currentBufferDollars)}. Excellent job! This unlocks 100% of your net monthly surplus (${f(investableSurplus)}) to flow directly into wealth building.`;
    }

    let experienceAdvice = "";
    if (experienceLevel === "beginner") {
      experienceAdvice = `As a beginner investor, we recommend allocating your surplus of ${f(investableSurplus)}/mo into diversified low-cost broad index ETFs or systematic investment plans (SIPs) rather than individual stocks.`;
    } else if (experienceLevel === "intermediate") {
      experienceAdvice = `With intermediate experience, look to diversify your ${f(investableSurplus)}/mo surplus across equity mutual funds, blue-chip stocks, and fixed income assets according to your age-profile risk tolerance.`;
    } else {
      experienceAdvice = `As an experienced Regular Investor, your investable surplus rate of ${f(investableSurplus)}/mo can be deployed directly into active tactical allocations, opportunistic options strategies, or sector-specific capital.`;
    }

    const aiSummary = `Financial Diagnosis for ${userName}: Income is classified as ${volatilityClass} with a baseline of ${f(baselineIncome)}/mo. Needs stand at ${needsPct}%, Wants at ${wantsPct}%, and Surplus Savings at ${savePct}%. ${volatilityAdvice} ${bufferAdvice} ${experienceAdvice}`;

    // --- Build Notion Block Elements ---
    const childBlocks: any[] = [
      {
        object: "block",
        "type": "heading_1",
        heading_1: {
          rich_text: [{ "type": "text", "text": { content: "AarthiAI Institutional Plan Diagnosis" } }]
        }
      },
      {
        object: "block",
        "type": "paragraph",
        paragraph: {
          rich_text: [
            {
              "type": "text",
              "text": { content: `Generated on ${new Date().toLocaleDateString("en-IN")} for ` }
            },
            {
              "type": "text",
              "text": { content: userName, link: null },
              annotations: { bold: true }
            },
            {
              "type": "text",
              "text": { content: ` (${userEmail}). This diagnostic report provides volatility-adjusted allocation guidelines aligned with the TradeSignal PRO system.` }
            }
          ]
        }
      },
      {
        object: "block",
        "type": "divider",
        divider: {}
      },
      {
        object: "block",
        "type": "heading_2",
        heading_2: {
          rich_text: [{ "type": "text", "text": { content: "💡 AI Advisory Summary" } }]
        }
      },
      {
        object: "block",
        "type": "callout",
        callout: {
          rich_text: [{ "type": "text", "text": { content: aiSummary } }],
          icon: { emoji: "🛡️" },
          color: "orange_background"
        }
      },
      {
        object: "block",
        "type": "heading_2",
        heading_2: {
          rich_text: [{ "type": "text", "text": { content: "📊 Allocation Allocation Guidelines (50/30/20 Comparison)" } }]
        }
      },
      {
        object: "block",
        "type": "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { "type": "text", "text": { content: "Net Baseline Income: " } },
            { "type": "text", "text": { content: f(baselineIncome) }, annotations: { bold: true } },
            { "type": "text", "text": { content: ` (${volatilityClass} volatility risk profile)` } }
          ]
        }
      },
      {
        object: "block",
        "type": "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { "type": "text", "text": { content: "Needs (Survival Essentials): " } },
            { "type": "text", "text": { content: `${f(actualNeeds)} (${needsPct}%)` }, annotations: { bold: true } },
            { "type": "text", "text": { content: ` | Target: 50%` } }
          ]
        }
      },
      {
        object: "block",
        "type": "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { "type": "text", "text": { content: "Wants (Lifestyle Choices): " } },
            { "type": "text", "text": { content: `${f(actualWants)} (${wantsPct}%)` }, annotations: { bold: true } },
            { "type": "text", "text": { content: ` | Target: 30%` } }
          ]
        }
      },
      {
        object: "block",
        "type": "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { "type": "text", "text": { content: "Savings & Reserves: " } },
            { "type": "text", "text": { content: `${f(monthlyBufferContribution + investableSurplus)} (${savePct}%)` }, annotations: { bold: true } },
            { "type": "text", "text": { content: ` | Target: 20%` } }
          ]
        }
      },
      {
        object: "block",
        "type": "divider",
        divider: {}
      },
      {
        object: "block",
        "type": "heading_2",
        heading_2: {
          rich_text: [{ "type": "text", "text": { content: "🛡️ Reserves Buffer Progress" } }]
        }
      },
      {
        object: "block",
        "type": "paragraph",
        paragraph: {
          rich_text: [
            { "type": "text", "text": { content: `Your emergency safety buffer target is ` } },
            { "type": "text", "text": { content: `${bufferTargetMonths} months` }, annotations: { bold: true } },
            { "type": "text", "text": { content: ` of essential needs, representing ` } },
            { "type": "text", "text": { content: f(bufferTargetDollars) }, annotations: { bold: true } },
            { "type": "text", "text": { content: `. Currently you have ` } },
            { "type": "text", "text": { content: f(currentBufferDollars) }, annotations: { bold: true } },
            { "type": "text", "text": { content: ` saved, leaving a remaining gap of ` } },
            { "type": "text", "text": { content: f(bufferGapDollars) }, annotations: { bold: true, color: "red" } },
            { "type": "text", "text": { content: `.` } }
          ]
        }
      },
      {
        object: "block",
        "type": "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { "type": "text", "text": { content: "Monthly Buffer Contribution rate: " } },
            { "type": "text", "text": { content: `${f(monthlyBufferContribution)}/mo` }, annotations: { bold: true } }
          ]
        }
      },
      {
        object: "block",
        "type": "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { "type": "text", "text": { content: "Monthly Investable Surplus: " } },
            { "type": "text", "text": { content: `${f(investableSurplus)}/mo` }, annotations: { bold: true } },
            { "type": "text", "text": { content: ` (compounds into long-term assets)` } }
          ]
        }
      },
      {
        object: "block",
        "type": "paragraph",
        paragraph: {
          rich_text: [
            {
              "type": "text",
              "text": { content: "Note: In Notion Databases, you can turn on Notion AI Autofill properties. Add an AI Custom Autofill column to this database with a custom prompt to have Notion natively summarize your plans as they sync!" }
            }
          ]
        }
      }
    ];

    const recommendations = investableSurplus > 0 ? getStockRecommendations(experienceLevel, investableSurplus) : { buy: [], sell: [] };

    if (recommendations.buy.length > 0 || recommendations.sell.length > 0) {
      childBlocks.push(
        {
          object: "block",
          "type": "divider",
          divider: {}
        },
        {
          object: "block",
          "type": "heading_2",
          heading_2: {
            rich_text: [{ "type": "text", "text": { content: "📈 Stock Trade Recommendations" } }]
          }
        },
        {
          object: "block",
          "type": "paragraph",
          paragraph: {
            rich_text: [{ "type": "text", "text": { content: `Based on your ${experienceLevel} experience level and investable surplus.` } }]
          }
        }
      );

      if (recommendations.buy.length > 0) {
        childBlocks.push({
          object: "block",
          "type": "heading_3",
          heading_3: {
            rich_text: [{ "type": "text", "text": { content: "🟢 Buy Suggestions" } }]
          }
        });
        recommendations.buy.forEach(stock => {
          childBlocks.push({
            object: "block",
            "type": "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ "type": "text", "text": { content: stock } }]
            }
          });
        });
      }

      if (recommendations.sell.length > 0) {
        childBlocks.push({
          object: "block",
          "type": "heading_3",
          heading_3: {
            rich_text: [{ "type": "text", "text": { content: "🔴 Sell Suggestions" } }]
          }
        });
        recommendations.sell.forEach(stock => {
          childBlocks.push({
            object: "block",
            "type": "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ "type": "text", "text": { content: stock } }]
            }
          });
        });
      }
    }

    const responseData = await createNotionPlan(
      {
        name: userName,
        userEmail,
        baselineIncome,
        volatilityClass,
        needsTotal: actualNeeds,
        wantsTotal: actualWants,
        bufferTargetMonths,
        bufferTargetDollars,
        currentBufferDollars,
        bufferGapDollars,
        monthlyBufferContribution,
        investableSurplus,
        experienceLevel,
        buyRecommendations: recommendations.buy.join(", "),
        sellRecommendations: recommendations.sell.join(", "),
      },
      aiSummary,
      childBlocks,
      config
    );

    // Fetch the stored AI summary back from the database
    let databaseAiSummary = "";
    try {
      databaseAiSummary = await getNotionPlanSummary(responseData.id, config);
    } catch (fetchErr) {
      console.warn("Failed to fetch summary from database, falling back to local:", fetchErr);
    }
    
    // Fallback if returned summary from DB was empty/failed
    if (!databaseAiSummary) {
      databaseAiSummary = aiSummary;
    }

    return NextResponse.json({
      success: true,
      notionPageId: responseData.id,
      notionPageUrl: responseData.url,
      aiSummary: databaseAiSummary,
    });
  } catch (err: any) {
    console.error("Plan Sync API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
