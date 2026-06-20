import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Interface to configure database access dynamically
export interface NotionConfig {
  apiKey: string;
  usersDbId: string;
  plansDbId: string;
}

// Extract configuration from headers or fallback to environment variables
export function getNotionConfig(headers: Headers): NotionConfig {
  const apiKey = headers.get("x-notion-api-key") || process.env.NOTION_API_KEY || "";
  const usersDbId = headers.get("x-notion-users-db") || process.env.NOTION_USERS_DATABASE_ID || "";
  const plansDbId = headers.get("x-notion-plans-db") || process.env.NOTION_PLANS_DATABASE_ID || "";

  return { apiKey, usersDbId, plansDbId };
}

// General fetch wrapper for Notion API
async function callNotionAPI(endpoint: string, apiKey: string, method = "POST", body?: any) {
  const url = `https://api.notion.com/v1/${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// 1. Query user by email with dynamic schema support
export async function queryNotionUser(email: string, config: NotionConfig) {
  // Retrieve database details to discover schema property names dynamically
  const db = await callNotionAPI(`databases/${config.usersDbId}`, config.apiKey, "GET");
  const dbProps = db.properties || {};

  // Find properties by type or case-insensitive matching
  const titleKey = Object.keys(dbProps).find(key => dbProps[key].type === "title") || "Email";
  const passwordKey = Object.keys(dbProps).find(key => key.toLowerCase() === "password") || "Password";
  const nameKey = Object.keys(dbProps).find(key => key.toLowerCase() === "name") || "Name";

  const data = await callNotionAPI(`databases/${config.usersDbId}/query`, config.apiKey, "POST", {
    filter: {
      property: titleKey,
      title: {
        equals: email.trim().toLowerCase(),
      },
    },
  });

  if (data.results && data.results.length > 0) {
    const page = data.results[0];
    const properties = page.properties;

    const emailVal = properties[titleKey]?.title?.[0]?.text?.content || "";
    const passwordHash = properties[passwordKey]?.rich_text?.[0]?.text?.content || "";
    const nameVal = properties[nameKey]?.rich_text?.[0]?.text?.content || "";

    return {
      id: page.id,
      email: emailVal,
      passwordHash,
      name: nameVal,
      url: page.url,
    };
  }

  return null;
}

// 2. Create user page dynamically mapping to schema
export async function createNotionUser(email: string, passwordHash: string, name: string, config: NotionConfig) {
  const db = await callNotionAPI(`databases/${config.usersDbId}`, config.apiKey, "GET");
  const dbProps = db.properties || {};

  const titleKey = Object.keys(dbProps).find(key => dbProps[key].type === "title") || "Email";
  const passwordKey = Object.keys(dbProps).find(key => key.toLowerCase() === "password") || "Password";
  const nameKey = Object.keys(dbProps).find(key => key.toLowerCase() === "name") || "Name";

  const properties: Record<string, any> = {};

  const mapProp = (propName: string, value: any) => {
    const propMeta = dbProps[propName];
    if (!propMeta) return;
    
    const type = propMeta.type;
    if (type === "rich_text") {
      properties[propName] = {
        rich_text: [{ type: "text", text: { content: String(value) } }]
      };
    } else if (type === "select") {
      properties[propName] = { select: { name: String(value) } };
    }
  };

  properties[titleKey] = {
    title: [{ type: "text", text: { content: email.trim().toLowerCase() } }]
  };

  mapProp(passwordKey, passwordHash);
  mapProp(nameKey, name);

  const body = {
    parent: { database_id: config.usersDbId },
    properties
  };

  return callNotionAPI("pages", config.apiKey, "POST", body);
}

// 3. Create financial plan page mapping dynamically to database columns
export async function createNotionPlan(planData: any, aiSummary: string, childBlocks: any[], config: NotionConfig) {
  const db = await callNotionAPI(`databases/${config.plansDbId}`, config.apiKey, "GET");
  const dbProps = db.properties || {};

  // Find Title property dynamically
  const titleKey = Object.keys(dbProps).find(key => dbProps[key].type === "title") || "Name";

  const properties: Record<string, any> = {};

  // Dynamically map values depending on user's database property types
  const mapProp = (propName: string, value: any) => {
    // Perform case-insensitive search if exact name not found
    const actualKey = Object.keys(dbProps).find(k => k.toLowerCase() === propName.toLowerCase()) || propName;
    const propMeta = dbProps[actualKey];
    if (!propMeta) return; // Skip if database doesn't have this column

    const type = propMeta.type;
    if (type === "number") {
      properties[actualKey] = { number: Number(value) };
    } else if (type === "rich_text") {
      properties[actualKey] = {
        rich_text: [{ type: "text", text: { content: String(value) } }]
      };
    } else if (type === "select") {
      properties[actualKey] = { select: { name: String(value) } };
    } else if (type === "status") {
      properties[actualKey] = { status: { name: String(value) } };
    } else if (type === "email") {
      properties[actualKey] = { email: String(value) };
    } else if (type === "url") {
      properties[actualKey] = { url: String(value) };
    }
  };

  // Populate title property
  properties[titleKey] = {
    title: [{ type: "text", text: { content: `${planData.name}'s Financial Suite Plan` } }]
  };

  // Populate other properties case-insensitively and type-insensitively
  mapProp("User Email", planData.userEmail);
  mapProp("Baseline Income", planData.baselineIncome);
  mapProp("Volatility Class", planData.volatilityClass);
  mapProp("Needs Total", planData.needsTotal);
  mapProp("Wants Total", planData.wantsTotal);
  mapProp("Buffer Target Months", planData.bufferTargetMonths);
  mapProp("Buffer Target Dollars", planData.bufferTargetDollars);
  mapProp("Current Buffer Dollars", planData.currentBufferDollars);
  mapProp("Buffer Gap Dollars", planData.bufferGapDollars);
  mapProp("Monthly Buffer Contribution", planData.monthlyBufferContribution);
  mapProp("Investable Surplus", planData.investableSurplus);
  mapProp("Experience Level", planData.experienceLevel || "beginner");
  mapProp("AI Financial Summary", aiSummary);
  mapProp("Buy Recommendations", planData.buyRecommendations);
  mapProp("Sell Recommendations", planData.sellRecommendations);

  const body = {
    parent: { database_id: config.plansDbId },
    properties,
    children: childBlocks
  };

  return callNotionAPI("pages", config.apiKey, "POST", body);
}

// 4. Retrieve saved financial plan summary from page properties or child blocks
export async function getNotionPlanSummary(pageId: string, config: NotionConfig): Promise<string> {
  try {
    // 1. Try to fetch the page properties first
    const pageData = await callNotionAPI(`pages/${pageId}`, config.apiKey, "GET");
    const dbProps = pageData.properties || {};
    
    // Find the property name case-insensitively
    const summaryKey = Object.keys(dbProps).find(k => k.toLowerCase() === "ai financial summary" || k.replace(/\s+/g, "").toLowerCase() === "aifinancialsummary") || "AI Financial Summary";
    const summaryProp = dbProps[summaryKey];
    if (summaryProp && summaryProp.type === "rich_text" && summaryProp.rich_text?.length > 0) {
      return summaryProp.rich_text[0].text?.content || "";
    }
  } catch (propErr) {
    console.warn("Failed to fetch summary property from page:", propErr);
  }

  try {
    // 2. If property fetch failed or was empty, query page blocks and find the callout block
    const blocksData = await callNotionAPI(`blocks/${pageId}/children`, config.apiKey, "GET");
    const calloutBlock = blocksData.results?.find((b: any) => b.type === "callout");
    if (calloutBlock && calloutBlock.callout?.rich_text?.length > 0) {
      return calloutBlock.callout.rich_text[0].text?.content || "";
    }
  } catch (blockErr) {
    console.warn("Failed to fetch summary from block children:", blockErr);
  }

  return "";
}

// 5. Query all financial plans for a specific user
export async function queryNotionPlansByUserEmail(email: string, config: NotionConfig) {
  // We need to find the "User Email" property name dynamically
  const db = await callNotionAPI(`databases/${config.plansDbId}`, config.apiKey, "GET");
  const dbProps = db.properties || {};
  
  const emailKey = Object.keys(dbProps).find(key => key.toLowerCase() === "user email") || "User Email";
  const titleKey = Object.keys(dbProps).find(key => dbProps[key].type === "title") || "Name";

  // Query database
  const data = await callNotionAPI(`databases/${config.plansDbId}/query`, config.apiKey, "POST", {
    filter: {
      property: emailKey,
      email: {
        equals: email.trim().toLowerCase(),
      },
    },
    sorts: [
      {
        timestamp: "created_time",
        direction: "descending"
      }
    ]
  });

  if (!data.results || data.results.length === 0) {
    return [];
  }

  // Map results and fetch summaries
  const plans = await Promise.all(data.results.map(async (page: any) => {
    const summary = await getNotionPlanSummary(page.id, config);
    const title = page.properties[titleKey]?.title?.[0]?.text?.content || "Financial Plan";
    
    return {
      id: page.id,
      title,
      summary,
      createdTime: page.created_time,
      url: page.url
    };
  }));

  return plans;
}
