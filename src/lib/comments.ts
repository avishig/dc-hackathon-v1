import { Comment, Finding, InvestigationResult } from "@/types/investigation";
import { getComparisons, saveInvestigation } from "./comparison";

// Generate comment ID
function generateCommentId(): string {
  return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Add comment to a finding
export function addComment(
  subject: string,
  findingId: string,
  text: string,
  author: string = "Anonymous"
): Comment | null {
  const investigations = getComparisons();
  const investigation = investigations.find(inv => inv.subject === subject);
  
  if (!investigation) return null;
  
  const finding = investigation.findings.find(f => f.id === findingId);
  if (!finding) return null;
  
  const comment: Comment = {
    id: generateCommentId(),
    findingId,
    text,
    author,
    timestamp: new Date().toISOString(),
    replies: []
  };
  
  if (!finding.comments) {
    finding.comments = [];
  }
  
  finding.comments.push(comment);
  saveInvestigation(investigation);
  
  return comment;
}

// Add reply to a comment
export function addReply(
  subject: string,
  findingId: string,
  commentId: string,
  text: string,
  author: string = "Anonymous"
): Comment | null {
  const investigations = getComparisons();
  const investigation = investigations.find(inv => inv.subject === subject);
  
  if (!investigation) return null;
  
  const finding = investigation.findings.find(f => f.id === findingId);
  if (!finding || !finding.comments) return null;
  
  const comment = finding.comments.find(c => c.id === commentId);
  if (!comment) return null;
  
  const reply: Comment = {
    id: generateCommentId(),
    findingId,
    text,
    author,
    timestamp: new Date().toISOString()
  };
  
  if (!comment.replies) {
    comment.replies = [];
  }
  
  comment.replies.push(reply);
  saveInvestigation(investigation);
  
  return reply;
}

// Delete comment
export function deleteComment(
  subject: string,
  findingId: string,
  commentId: string
): boolean {
  const investigations = getComparisons();
  const investigation = investigations.find(inv => inv.subject === subject);
  
  if (!investigation) return false;
  
  const finding = investigation.findings.find(f => f.id === findingId);
  if (!finding || !finding.comments) return false;
  
  finding.comments = finding.comments.filter(c => c.id !== commentId);
  saveInvestigation(investigation);
  
  return true;
}

// Get comments for a finding
export function getComments(subject: string, findingId: string): Comment[] {
  const investigations = getComparisons();
  const investigation = investigations.find(inv => inv.subject === subject);
  
  if (!investigation) return [];
  
  const finding = investigation.findings.find(f => f.id === findingId);
  return finding?.comments || [];
}
