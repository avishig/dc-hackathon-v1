import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";
import { toggleComparisonSelection, getInvestigation } from "@/lib/comparison";
import { useState, useEffect } from "react";
import ShareInvestigation from "./ShareInvestigation";

interface VerdictPanelProps {
  subject: string;
  legitimacyScore: number;
  verdict: string;
  summary: string;
  shareableId?: string;
}

const VerdictPanel = ({ subject, legitimacyScore, verdict, summary, shareableId }: VerdictPanelProps) => {
  const navigate = useNavigate();
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const inv = getInvestigation(subject);
    setIsSelected(inv?.selectedForComparison === true);
  }, [subject]);

  const handleAddToComparison = () => {
    toggleComparisonSelection(subject);
    setIsSelected(!isSelected);
  };

  const getVerdictColor = () => {
    if (verdict === 'SAFE') return 'text-green-400';
    if (verdict === 'SORT OF RISKY') return 'text-yellow-400';
    if (verdict === 'LIKELY RISKY') return 'text-accent';
    return 'text-muted-foreground';
  };

  const getScoreColor = () => {
    if (legitimacyScore >= 70) return 'bg-green-500';
    if (legitimacyScore >= 40) return 'bg-yellow-500';
    return 'bg-accent';
  };

  return (
    <div className="bg-secondary/80 backdrop-blur-sm rounded-sm border border-border p-4 min-h-full flex flex-col">
      <h3 className="font-typewriter text-sm uppercase tracking-wider text-primary mb-4 border-b border-primary/30 pb-2">
        Crypto Analysis
      </h3>
      
      <div className="space-y-6">
        {/* Crypto */}
        <div>
          <p className="font-typewriter text-xs text-muted-foreground uppercase">Crypto</p>
          <p className="font-serif text-lg text-foreground break-words">{subject}</p>
        </div>

        {/* Legitimacy Score */}
        <div>
          <p className="font-typewriter text-xs text-muted-foreground uppercase mb-2">Legitimacy Score</p>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 ${getScoreColor()} transition-all duration-1000`}
              style={{ width: `${legitimacyScore}%` }}
            />
          </div>
          <p className="font-typewriter text-2xl text-foreground mt-1">{legitimacyScore}%</p>
        </div>

        {/* Verdict */}
        <div>
          <p className="font-typewriter text-xs text-muted-foreground uppercase">Verdict</p>
          <p className={`font-typewriter text-xl uppercase ${getVerdictColor()}`}>
            {verdict}
          </p>
        </div>

        {/* Summary */}
        <div>
          <p className="font-typewriter text-xs text-muted-foreground uppercase mb-2">Summary</p>
          <p className="font-serif text-sm text-foreground/80 leading-relaxed break-words">
            {summary}
          </p>
        </div>

        {/* Share */}
        <div className="pt-4 border-t border-border/50">
          <ShareInvestigation subject={subject} shareableId={shareableId} />
        </div>

        {/* Comparison Actions */}
        <div className="pt-4 border-t border-border/50 space-y-2">
          <Button
            variant={isSelected ? "default" : "outline"}
            onClick={handleAddToComparison}
            className="w-full font-typewriter text-xs"
            size="sm"
          >
            <Scale className="w-3 h-3 mr-2" />
            {isSelected ? "Remove from Comparison" : "Add to Comparison"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/comparison")}
            className="w-full font-typewriter text-xs"
            size="sm"
          >
            View Comparison
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerdictPanel;
