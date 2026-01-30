export interface Comment {
  id: string;
  findingId: string;
  text: string;
  author: string;
  timestamp: string;
  replies?: Comment[];
}

export interface Finding {
  id: string;
  title: string;
  source: string;
  url: string;
  snippet: string;
  category: 'news' | 'legal' | 'social' | 'financial' | 'general';
  date?: string;
  comments?: Comment[];
}

export interface InvestigationResult {
  subject: string;
  findings: Finding[];
  summary: string;
  legitimacyScore: number;
  verdict: string;
  agentLog: string[];
  selectedForComparison?: boolean;
  shareableId?: string;
  createdAt?: string;
}
