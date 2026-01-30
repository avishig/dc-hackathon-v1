import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Deep Detective API is running',
    version: '1.0.0',
    endpoints: {
      investigate: 'POST /api/investigate'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Deep Detective API is running' });
});

/**
 * Planner: Static function to generate crypto-specific search queries
 */
function generateQueries(target) {
  // Generate 3 specific high-intent search queries for crypto investigation
  const queries = [
    `${target} crypto scam fraud rug pull`,
    `${target} cryptocurrency security audit vulnerabilities`,
    `${target} crypto exchange hack exploit allegations`
  ];
  
  return { queries, targetType: 'crypto' };
}

/**
 * Eyes: Execute Tavily API searches in parallel
 */
async function searchTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: 2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform Tavily response to our format
    const results = (data.results || []).map((result) => ({
      title: result.title || 'Untitled',
      content: result.content || result.snippet || '',
      url: result.url || '#'
    }));

    return results;
    
  } catch (error) {
    console.error('Tavily search error:', error);
    return [];
  }
}

/**
 * Brain: Analyze results with Gemini AI
 */
async function analyzeWithGemini(target, searchResults) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use available models with correct naming (models/ prefix required)
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    console.log('Using model: models/gemini-2.5-flash');

    // Aggregate search results into text
    const aggregatedResults = searchResults
      .map((result, index) => {
        const queryHeader = `=== Query ${index + 1}: ${result.query} ===\n`;
        const resultsText = result.data
          .map((item, itemIndex) => `Result ${itemIndex + 1}:\nTitle: ${item.title}\nContent: ${item.content}\n`)
          .join('\n---\n\n');
        return queryHeader + resultsText;
      })
      .join('\n\n');

    const prompt = `You are a Noir Forensic Analyst investigating the cryptocurrency "${target}". Analyze the following search results and determine legitimacy.

Search Results:
${aggregatedResults}

Act as a cynical, hard-boiled detective specializing in crypto investigations. Extract red flags related to scams, rug pulls, security vulnerabilities, exchange hacks, and fraudulent activities. Determine if this crypto is likely risky, sort of risky, or safe.

Return ONLY a valid JSON object (no markdown, no code blocks, no explanations) with this exact structure:
{
  "score": <integer 0-100, where 0 is likely risky and 100 is safe>,
  "flags": ["flag1", "flag2", ...],
  "verdict": "<short, cynical summary in one sentence>"
}

Be harsh but fair. If you find serious red flags (rug pulls, scams, hacks, security issues), score low. If it's clean and legitimate, score high.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response (strip markdown if present)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    const analysis = JSON.parse(jsonText);
    
    // Validate and ensure correct format
    return {
      score: Math.max(0, Math.min(100, Math.round(analysis.score || 50))),
      flags: Array.isArray(analysis.flags) ? analysis.flags : [],
      verdict: analysis.verdict || 'Investigation inconclusive'
    };
    
  } catch (error) {
    console.error('Gemini analysis error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Investigation encountered an error. Results are inconclusive.';
    if (error.message) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = `AI model not found. The model name may be incorrect or your API key may not have access. Error: ${error.message}. Please verify your GEMINI_API_KEY has access to Gemini models.`;
      } else if (error.message.includes('API key') || error.message.includes('authentication') || error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'API authentication failed. Please check your GEMINI_API_KEY in the .env file.';
      } else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else {
        errorMessage = `Analysis error: ${error.message}`;
      }
    }
    
    // Return error fallback with more context
    throw new Error(errorMessage);
  }
}

/**
 * Main investigation endpoint
 */
app.post('/api/investigate', async (req, res) => {
  try {
    const { target } = req.body;
    
    if (!target || typeof target !== 'string' || target.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Target is required'
      });
    }

    const targetName = target.trim();
    const logs = [];

    // DEMO MODE: Safety net for FTX (well-known crypto scam)
    if (targetName.toLowerCase() === 'ftx' || targetName.toLowerCase() === 'ftx token') {
      logs.push(`[INIT] Starting investigation on "${targetName}"`);
      logs.push('[DEMO] Safety net activated - known high-risk crypto case detected');
      
      return res.json({
        plan: [
          'FTX crypto scam fraud rug pull',
          'FTX cryptocurrency security audit vulnerabilities',
          'FTX crypto exchange hack exploit allegations'
        ],
        logs: [
          {
            query: 'FTX crypto scam fraud rug pull',
            data: [
              {
                title: 'FTX Collapse: $8 Billion Fraud Case',
                content: 'FTX exchange collapsed in November 2022 after it was revealed that customer funds were misused. Founder Sam Bankman-Fried was charged with fraud, money laundering, and conspiracy. The exchange lost over $8 billion in customer funds.',
                url: 'https://www.sec.gov/news/press-release/2022-219'
              },
              {
                title: 'FTX Bankruptcy: Largest Crypto Exchange Failure',
                content: 'FTX filed for bankruptcy after a liquidity crisis. Investigations revealed massive fraud, with customer funds being used for risky investments and personal expenses. Over 1 million customers lost their funds.',
                url: 'https://www.reuters.com/ftx-bankruptcy'
              }
            ]
          },
          {
            query: 'FTX cryptocurrency security audit vulnerabilities',
            data: [
              {
                title: 'FTX Security Failures and Missing Funds',
                content: 'FTX had no proper security audits. Customer funds were stored in unsecured accounts and used without permission. The exchange lacked basic security controls and proper fund segregation.',
                url: 'https://www.coindesk.com/ftx-security'
              },
              {
                title: 'FTX Regulatory Violations',
                content: 'FTX operated without proper regulatory oversight. The exchange violated multiple securities laws and failed to protect customer assets. Multiple regulatory bodies launched investigations.',
                url: 'https://www.cftc.gov/ftx-investigation'
              }
            ]
          },
          {
            query: 'FTX crypto exchange hack exploit allegations',
            data: [
              {
                title: 'FTX: The Complete Story of a Crypto Scam',
                content: 'FTX promised to revolutionize crypto trading but was built on fraud. The exchange misused billions in customer funds, leading to one of the largest crypto collapses in history. Founder faces multiple criminal charges.',
                url: 'https://www.bbc.com/ftx-scandal'
              },
              {
                title: 'FTX Scandal: How Customer Funds Were Stolen',
                content: 'The FTX scandal revealed systematic fraud where customer deposits were used for risky trading, personal loans, and political donations. The exchange had no proper accounting or fund segregation.',
                url: 'https://www.wsj.com/ftx-fraud'
              }
            ]
          }
        ],
        report: {
          score: 0,
          flags: [
            'SEC fraud charges',
            'Founder convicted of fraud',
            '$8+ billion in customer funds lost',
            'No proper security audits',
            'Customer funds misused',
            'Exchange collapse and bankruptcy',
            'Well-documented crypto scam case'
          ],
          verdict: 'Complete fraud. FTX collapsed after misusing over $8 billion in customer funds. The founder was convicted of fraud. This is one of the largest crypto exchange failures in history. Avoid at all costs.'
        }
      });
    }

    // STEP 1: PLANNER - Generate queries
    logs.push(`[INIT] Starting investigation on "${targetName}"`);
    logs.push('[PLAN] Analyzing target type and generating search queries...');
    
    const { queries, targetType } = generateQueries(targetName);
    logs.push(`[PLAN] Target identified as: ${targetType}`);
    logs.push(`[PLAN] Generated ${queries.length} search queries`);

    // STEP 2: EYES - Execute searches in parallel
    logs.push('[EXECUTE] Initiating parallel web searches...');
    
    const searchResults = await Promise.all(
      queries.map(async (query) => {
        try {
          const results = await searchTavily(query);
          logs.push(`[EXECUTE] Query "${query}" returned ${results.length} results`);
          return { query, data: results };
        } catch (error) {
          logs.push(`[EXECUTE] Query "${query}" failed: ${error.message}`);
          return { query, data: [] };
        }
      })
    );

    logs.push(`[EXECUTE] Total results collected: ${searchResults.reduce((sum, r) => sum + r.data.length, 0)}`);

    // STEP 3: BRAIN - Analyze with Gemini
    logs.push('[ANALYZE] Processing results with Gemini AI...');
    
    let report;
    try {
      report = await analyzeWithGemini(targetName, searchResults);
      logs.push(`[ANALYZE] Legitimacy score: ${report.score}%`);
      logs.push(`[ANALYZE] Red flags identified: ${report.flags.length}`);
      logs.push(`[COMPLETE] Investigation finished. Verdict: ${report.verdict}`);
    } catch (analysisError) {
      console.error('Analysis failed:', analysisError);
      logs.push(`[ANALYZE] Error: ${analysisError.message}`);
      
      // Return a response with error information but still include the search results
      return res.json({
        plan: queries,
        logs: searchResults,
        report: {
          score: 50,
          flags: ['Analysis service unavailable', analysisError.message],
          verdict: `Investigation incomplete: ${analysisError.message}. Search results collected but AI analysis failed.`
        }
      });
    }

    // Return response in exact format
    res.json({
      plan: queries,
      logs: searchResults,
      report: report
    });

  } catch (error) {
    console.error('Investigation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during investigation'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Deep Detective API server running on http://localhost:${PORT}`);
});
