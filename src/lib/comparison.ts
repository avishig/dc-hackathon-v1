import { InvestigationResult } from "@/types/investigation";

const STORAGE_KEY = "deep-detective-comparisons";

export function saveInvestigation(result: InvestigationResult): void {
  const comparisons = getComparisons();
  const existingIndex = comparisons.findIndex(r => r.subject === result.subject);
  
  if (existingIndex >= 0) {
    // Preserve shareableId and other metadata if they exist
    const existing = comparisons[existingIndex];
    comparisons[existingIndex] = {
      ...result,
      shareableId: result.shareableId || existing.shareableId,
      createdAt: result.createdAt || existing.createdAt,
      selectedForComparison: result.selectedForComparison !== undefined 
        ? result.selectedForComparison 
        : existing.selectedForComparison,
    };
  } else {
    comparisons.push(result);
  }
  
  // Keep only last 10 investigations
  if (comparisons.length > 10) {
    comparisons.shift();
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisons));
}

export function getComparisons(): InvestigationResult[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getInvestigation(subject: string): InvestigationResult | null {
  const comparisons = getComparisons();
  return comparisons.find(r => r.subject === subject) || null;
}

export function removeInvestigation(subject: string): void {
  const comparisons = getComparisons();
  const filtered = comparisons.filter(r => r.subject !== subject);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearComparisons(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getSelectedForComparison(): InvestigationResult[] {
  const comparisons = getComparisons();
  return comparisons.filter(r => r.selectedForComparison === true);
}

export function toggleComparisonSelection(subject: string): void {
  const comparisons = getComparisons();
  const index = comparisons.findIndex(r => r.subject === subject);
  if (index >= 0) {
    comparisons[index].selectedForComparison = !(comparisons[index].selectedForComparison === true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisons));
  }
}

export function clearComparisonSelection(): void {
  const comparisons = getComparisons();
  comparisons.forEach(r => {
    r.selectedForComparison = false;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisons));
}
