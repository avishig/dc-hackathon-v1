import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { investigate } from "@/lib/api/investigate";
import { InvestigationResult } from "@/types/investigation";
import { saveInvestigation, toggleComparisonSelection, getInvestigation } from "@/lib/comparison";
import AgentLog from "@/components/AgentLog";
import ManilaFolder from "@/components/ManilaFolder";
import VerdictPanel from "@/components/VerdictPanel";
import TitleBanner from "@/components/TitleBanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale } from "lucide-react";
import detectiveBg from "@/assets/detective-bg.jpg";

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subject = searchParams.get("subject") || "";
  
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!subject) {
      navigate("/");
      return;
    }

    const runInvestigation = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentLogs([`[INIT] Starting deep investigation on "${subject}"`]);

      // Simulate progressive log updates
      const logIntervals = [
        { delay: 500, log: "[PLAN] Analyzing crypto type..." },
        { delay: 1000, log: "[PLAN] Generating investigation strategy..." },
        { delay: 1500, log: "[EXECUTE] Initiating web scraping agents..." },
        { delay: 2500, log: "[EXECUTE] Searching news archives..." },
        { delay: 3500, log: "[EXECUTE] Checking legal databases..." },
        { delay: 4500, log: "[ANALYZE] Processing collected data..." },
      ];

      logIntervals.forEach(({ delay, log }) => {
        setTimeout(() => {
          setCurrentLogs(prev => [...prev, log]);
        }, delay);
      });

      try {
        const response = await investigate(subject);
        
        if (!response.success) {
          setError(response.error || "Investigation failed");
          return;
        }

        if (response.data) {
          setResult(response.data);
          setCurrentLogs(response.data.agentLog);
          // Save investigation for comparison
          saveInvestigation(response.data);
        }
      } catch (err) {
        console.error("Investigation error:", err);
        setError("Failed to complete investigation");
      } finally {
        setIsLoading(false);
      }
    };

    runInvestigation();
  }, [subject, navigate]);

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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/70" />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(220 25% 6% / 0.8) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="font-typewriter text-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Case
          </Button>
          <div className="animate-flicker">
            <TitleBanner title="Deep Detective" />
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <Button
                variant="outline"
                onClick={() => navigate("/comparison")}
                className="font-typewriter text-foreground hover:text-primary"
              >
                <Scale className="w-4 h-4 mr-2" />
                Compare
              </Button>
            )}
            <div className="w-16" /> {/* Spacer */}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Agent Log - Left panel */}
          <div className="lg:col-span-1 min-h-[300px]">
            <AgentLog logs={currentLogs} isLoading={isLoading} />
          </div>

          {/* Manila Folder - Center */}
          <div className="lg:col-span-2 min-h-[500px]">
            {error ? (
              <div className="h-full flex items-center justify-center">
                <div className="paper-texture notepad-shadow rounded-sm p-8 text-center">
                  <p className="font-typewriter text-accent text-lg mb-4">Investigation Failed</p>
                  <p className="font-serif text-ink/70">{error}</p>
                  <Button
                    onClick={() => navigate("/")}
                    className="mt-4 font-typewriter"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="paper-texture notepad-shadow rounded-sm p-8 text-center animate-pulse">
                  <p className="font-typewriter text-ink text-lg">Investigating...</p>
                  <p className="font-serif text-ink/70 mt-2">Gathering intelligence on "{subject}"</p>
                </div>
              </div>
            ) : result ? (
              <ManilaFolder 
                findings={result.findings} 
                subject={result.subject}
                onUpdate={() => {
                  // Refresh investigation data if needed
                  const updated = getInvestigation(result.subject);
                  if (updated) {
                    setResult(updated);
                  }
                }}
              />
            ) : null}
          </div>

          {/* Verdict Panel - Right */}
          <div className="lg:col-span-1 min-h-[400px]">
            {result ? (
              <VerdictPanel
                subject={result.subject}
                legitimacyScore={result.legitimacyScore}
                verdict={result.verdict}
                summary={result.summary}
                shareableId={result.shareableId}
              />
            ) : (
              <div className="bg-secondary/80 backdrop-blur-sm rounded-sm border border-border p-4 h-full flex items-center justify-center">
                <p className="font-typewriter text-muted-foreground text-sm">
                  {isLoading ? "Analyzing..." : "Awaiting results..."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Results;
