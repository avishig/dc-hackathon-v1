import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { tavily } from "@tavily/core";

// Load config from .env.local
dotenv.config({ path: ".env.local" });

// Initialize OpenAI (MiniMax) with custom base URL
const openai = new OpenAI({
  baseURL: process.env.MINIMAX_BASE_URL,
  apiKey: process.env.MINIMAX_API_KEY,
});

// Initialize Tavily
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());

/** Helper: call MiniMax and return the assistant message text */
async function minimaxChat(systemPrompt, userMessage) {
  const model = process.env.MINIMAX_MODEL || "gpt-4o-mini";
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

/** Parse two search queries from step 1 output (e.g. "1. ... 2. ..." or two lines) */
function parseTwoQueries(text) {
  const lines = text
    .split(/\n/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length >= 2) return [lines[0], lines[1]];
  const parts = text.split(/\s*[;|]\s*|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[1]];
  return [text, text];
}

/** Extract first line or first bullet as a single choice (e.g. best name, tagline) */
function firstLineOrBullet(text) {
  const line = text.split(/\n/).map((s) => s.replace(/^[-*•]\s*/, "").trim()).find(Boolean);
  return line || text.trim();
}

app.post("/api/agent/startup", async (req, res) => {
  const goal = req.body?.goal;
  if (!goal || typeof goal !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'goal' in body" });
  }

  let memory = `Goal: ${goal}\n\n`;
  let analysis = "";
  let brandName = "";
  let tagline = "";
  let pricing = "";
  let pitch = "";
  let email = "";

  try {
    // Step 1 — Plan: generate 2 search queries
    console.log("🚀 Step 1 (Plan): Generating 2 search queries...");
    const planPrompt = `You are a research assistant. Given a startup goal, output exactly 2 web search queries (one per line, no numbering). Queries should help find market and competitor info for: "${goal}".`;
    const planResult = await minimaxChat(planPrompt, goal);
    const [query1, query2] = parseTwoQueries(planResult);
    memory += `Search queries: 1) ${query1} 2) ${query2}\n\n`;
    console.log("🔍 Queries:", query1, "|", query2);

    // Step 2 — Search A
    console.log("🔍 Step 2 (Search A): Tavily searching query 1...");
    const searchResult1 = await tvly.search(query1, { maxResults: 5 });
    const searchText1 = JSON.stringify(searchResult1.results || [], null, 2);
    memory += `Search A results:\n${searchText1}\n\n`;
    console.log("💡 Search A done, results length:", searchText1.length);

    // Step 3 — Search B
    console.log("🔍 Step 3 (Search B): Tavily searching query 2...");
    const searchResult2 = await tvly.search(query2, { maxResults: 5 });
    const searchText2 = JSON.stringify(searchResult2.results || [], null, 2);
    memory += `Search B results:\n${searchText2}\n\n`;
    console.log("💡 Search B done, results length:", searchText2.length);

    // Step 4 — Analysis: summarize into Market Gaps
    console.log("💡 Step 4 (Analysis): Summarizing into Market Gaps...");
    const analysisPrompt = `Using the following search results, write a short "Market Gaps" summary (2–4 sentences) for the startup goal. Focus on unmet needs and opportunities.\n\n${memory}`;
    analysis = await minimaxChat(analysisPrompt, "Summarize market gaps only.");
    memory += `Market Gaps:\n${analysis}\n\n`;
    console.log("🚀 Analysis done.");

    // Step 5 — Ideation: 5 startup names
    console.log("💡 Step 5 (Ideation): Listing 5 startup names...");
    const namesPrompt = `Goal: ${goal}. Market context: ${analysis}. List exactly 5 catchy startup names, one per line, no numbers or bullets.`;
    const namesResult = await minimaxChat(namesPrompt, "List 5 names.");
    memory += `Name ideas:\n${namesResult}\n\n`;
    console.log("🔍 Names generated.");

    // Step 6 — Selection: pick best name
    console.log("🚀 Step 6 (Selection): Picking best name...");
    const pickPrompt = `From these names, choose the single best one for the goal. Reply with only that one name, nothing else.\n\n${namesResult}`;
    brandName = firstLineOrBullet(await minimaxChat(pickPrompt, "Pick one name."));
    memory += `Chosen brand name: ${brandName}\n\n`;
    console.log("💡 Best name:", brandName);

    // Step 7 — Tagline: slogan
    console.log("🔍 Step 7 (Tagline): Writing slogan...");
    const taglinePrompt = `Startup: ${brandName}. Goal: ${goal}. Write one short, memorable slogan/tagline. Reply with only the tagline.`;
    tagline = firstLineOrBullet(await minimaxChat(taglinePrompt, "Write the tagline."));
    memory += `Tagline: ${tagline}\n\n`;
    console.log("💡 Tagline:", tagline);

    // Step 8 — Pricing: CSV string
    console.log("🚀 Step 8 (Pricing): Creating pricing CSV...");
    const pricingPrompt = `Startup: ${brandName}. Goal: ${goal}. Create a simple pricing table as CSV. Use headers like: Plan,Price,Features. Include 2–4 tiers. Reply with only the CSV, no markdown.`;
    pricing = (await minimaxChat(pricingPrompt, "Output CSV only.")).replace(/```[\s\S]*?```/g, "").trim();
    memory += `Pricing CSV:\n${pricing}\n\n`;
    console.log("🔍 Pricing CSV created.");

    // Step 9 — Email: cold email to investors
    console.log("💡 Step 9 (Email): Drafting cold email to investors...");
    const emailPrompt = `Startup: ${brandName}. Tagline: ${tagline}. Goal: ${goal}. Market gaps: ${analysis}. Write a short, professional cold email to investors (3–5 sentences). Reply with only the email body.`;
    email = (await minimaxChat(emailPrompt, "Write the email body only.")).trim();
    memory += `Cold email:\n${email}\n\n`;
    console.log("🚀 Email drafted.");

    // Step 10 — Finalize: return JSON
    console.log("💡 Step 10 (Finalize): Returning response.");
    return res.json({
      analysis,
      brandName,
      tagline,
      pricing,
      pitch: memory.trim(),
      email,
    });
  } catch (err) {
    console.error("❌ Agent error:", err);
    return res.status(500).json({
      error: err.message || "Agent workflow failed",
      analysis: analysis || undefined,
      brandName: brandName || undefined,
      tagline: tagline || undefined,
      pricing: pricing || undefined,
      pitch: pitch || undefined,
      email: email || undefined,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
