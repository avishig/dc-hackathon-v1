import { InvestigationResult } from "@/types/investigation";

interface InvestigateResponse {
  success: boolean;
  data?: InvestigationResult;
  error?: string;
}

/**
 * Calls the backend API to investigate a subject
 */
export async function investigate(subject: string): Promise<InvestigateResponse> {
  try {
    const response = await fetch('/api/investigate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target: subject }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP error: ${response.status}`
      };
    }

    const apiData = await response.json();
    
    // Transform backend response to frontend format
    const findings = apiData.logs.flatMap((log: any, queryIndex: number) => {
      return log.data.map((item: any, itemIndex: number) => {
        // Determine category based on query type
        let category: 'news' | 'legal' | 'social' | 'financial' | 'general' = 'general';
        const queryLower = log.query.toLowerCase();
        if (queryLower.includes('lawsuit') || queryLower.includes('legal') || queryLower.includes('regulatory')) {
          category = 'legal';
        } else if (queryLower.includes('fraud') || queryLower.includes('scam')) {
          category = 'financial';
        } else if (queryLower.includes('review') || queryLower.includes('complaint') || queryLower.includes('allegation')) {
          category = 'social';
        }

        // Extract source from URL if available
        let source = 'Web Search';
        if (item.url && item.url !== '#') {
          try {
            source = new URL(item.url).hostname.replace('www.', '');
          } catch (e) {
            source = 'Web Search';
          }
        }

        return {
          id: `finding_${queryIndex}_${itemIndex}`,
          title: item.title || 'Untitled',
          source: source,
          url: item.url || '#',
          snippet: item.content || 'No content available',
          category,
          date: new Date().toISOString().split('T')[0]
        };
      });
    });

    const result: InvestigationResult = {
      subject,
      findings: findings.slice(0, 10), // Limit to 10 findings
      summary: apiData.report.verdict || `Our investigation into "${subject}" has uncovered ${apiData.report.flags.length} red flags.`,
      legitimacyScore: apiData.report.score,
      verdict: apiData.report.score <= 30 ? 'LIKELY RISKY' : apiData.report.score <= 60 ? 'SORT OF RISKY' : 'SAFE',
      agentLog: [
        `[INIT] Starting deep investigation on "${subject}"`,
        `[PLAN] Generated ${apiData.plan.length} search queries`,
        ...apiData.plan.map((q: string, i: number) => `[PLAN] Query ${i + 1}: ${q}`),
        '[EXECUTE] Initiating web scraping agents...',
        ...apiData.logs.map((log: any) => `[EXECUTE] Query "${log.query}" returned ${log.data.length} results`),
        '[ANALYZE] Processing collected data...',
        `[ANALYZE] Legitimacy score calculated: ${apiData.report.score}%`,
        `[ANALYZE] Red flags identified: ${apiData.report.flags.length}`,
        `[COMPLETE] Investigation finished. Verdict: ${apiData.report.score <= 30 ? 'LIKELY RISKY' : apiData.report.score <= 60 ? 'SORT OF RISKY' : 'SAFE'}`
      ],
      shareableId: undefined,
      createdAt: new Date().toISOString()
    };

    return { success: true, data: result };
    
  } catch (error) {
    console.error('Investigation API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to investigation service'
    };
  }
}
