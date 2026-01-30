import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InvestigationResult } from "@/types/investigation";
import { getSharedInvestigation } from "@/lib/sharing";
import { getInvestigation, getComparisons } from "@/lib/comparison";
import TitleBanner from "@/components/TitleBanner";
import ManilaFolder from "@/components/ManilaFolder";
import VerdictPanel from "@/components/VerdictPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import detectiveBg from "@/assets/detective-bg.jpg";

const Shared = () => {
  const { shareableId } = useParams<{ shareableId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareableId) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    // Try to get from shared storage first, then from comparisons
    let investigation = getSharedInvestigation(shareableId);
    
    if (!investigation) {
      // Search all investigations for matching shareableId
      const allInvestigations = getComparisons();
      investigation = allInvestigations.find((inv: InvestigationResult) => inv.shareableId === shareableId) || null;
    }

    if (investigation) {
      setResult(investigation);
    } else {
      setError("Investigation not found. The link may have expired or been deleted.");
    }
    
    setLoading(false);
  }, [shareableId]);

  if (loading) {
    return (
      <div 
        className="min-h-screen relative overflow-x-hidden flex items-center justify-center"
        style={{
          backgroundImage: `url(${detectiveBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative z-10 paper-texture notepad-shadow rounded-sm p-8 text-center">
          <p className="font-typewriter text-ink text-lg">Loading shared investigation...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div 
        className="min-h-screen relative overflow-x-hidden"
        style={{
          backgroundImage: `url(${detectiveBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="paper-texture notepad-shadow rounded-sm p-8 text-center max-w-md">
            <p className="font-typewriter text-accent text-lg mb-4">Investigation Not Found</p>
            <p className="font-serif text-ink/70 mb-6">{error || "The investigation you're looking for doesn't exist."}</p>
            <Button
              onClick={() => navigate("/")}
              className="font-typewriter"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden"
      style={{
        backgroundImage: `url(${detectiveBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-background/70" />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(220 25% 6% / 0.8) 100%)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex-shrink-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="font-typewriter text-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          <div className="animate-flicker">
            <TitleBanner title="Shared Investigation" />
          </div>
          <div className="w-24" />
        </header>

        <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Manila Folder - Center */}
          <div className="lg:col-span-2 min-h-[500px]">
            <ManilaFolder 
              findings={result.findings} 
              subject={result.subject}
            />
          </div>

          {/* Verdict Panel - Right */}
          <div className="lg:col-span-1 min-h-[400px]">
            <VerdictPanel
              subject={result.subject}
              legitimacyScore={result.legitimacyScore}
              verdict={result.verdict}
              summary={result.summary}
              shareableId={result.shareableId}
            />
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1 min-h-[400px]">
            <div className="bg-secondary/80 backdrop-blur-sm rounded-sm border border-border p-4 min-h-full">
              <h3 className="font-typewriter text-sm uppercase tracking-wider text-primary mb-4 border-b border-primary/30 pb-2">
                Shared Investigation
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-typewriter text-xs text-muted-foreground uppercase mb-1">
                    Crypto
                  </p>
                  <p className="font-serif text-lg text-foreground break-words">
                    {result.subject}
                  </p>
                </div>
                {result.createdAt && (
                  <div>
                    <p className="font-typewriter text-xs text-muted-foreground uppercase mb-1">
                      Created
                    </p>
                    <p className="font-serif text-sm text-foreground/80">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-border/50">
                  <p className="font-typewriter text-xs text-muted-foreground mb-2">
                    This is a shared investigation. You can view and comment on findings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Shared;
