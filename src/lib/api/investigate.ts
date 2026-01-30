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
      body: JSON.stringify({ subject }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP error: ${response.status}`
      };
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Investigation API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to investigation service'
    };
  }
}
