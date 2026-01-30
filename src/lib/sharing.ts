import { InvestigationResult } from "@/types/investigation";
import { getComparisons, saveInvestigation } from "./comparison";

const SHARED_STORAGE_KEY = "deep-detective-shared";

// Generate a unique shareable ID
export function generateShareableId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get shareable link
export function getShareableLink(shareableId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${shareableId}`;
}

// Make investigation shareable
export function makeShareable(subject: string): string | null {
  const investigations = getComparisons();
  const investigation = investigations.find(inv => inv.subject === subject);
  
  if (!investigation) return null;
  
  // Generate shareable ID if doesn't exist
  if (!investigation.shareableId) {
    investigation.shareableId = generateShareableId();
    investigation.createdAt = new Date().toISOString();
    saveInvestigation(investigation);
  }
  
  // Also save to shared storage
  saveSharedInvestigation(investigation);
  
  return getShareableLink(investigation.shareableId);
}

// Get shared investigation by ID
export function getSharedInvestigation(shareableId: string): InvestigationResult | null {
  try {
    const investigations = getComparisons();
    const investigation = investigations.find(inv => inv.shareableId === shareableId);
    return investigation || null;
  } catch {
    return null;
  }
}

// Save shared investigation (for viewing shared links)
export function saveSharedInvestigation(investigation: InvestigationResult): void {
  try {
    const shared = getSharedInvestigations();
    shared[investigation.shareableId!] = investigation;
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(shared));
  } catch (error) {
    console.error("Failed to save shared investigation:", error);
  }
}

// Get all shared investigations
export function getSharedInvestigations(): Record<string, InvestigationResult> {
  try {
    const stored = localStorage.getItem(SHARED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
