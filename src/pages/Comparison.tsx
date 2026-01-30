import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InvestigationResult } from "@/types/investigation";
import { getComparisons, getSelectedForComparison, toggleComparisonSelection, clearComparisonSelection } from "@/lib/comparison";
import TitleBanner from "@/components/TitleBanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import detectiveBg from "@/assets/detective-bg.jpg";

const Comparison = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allInvestigations, setAllInvestigations] = useState<InvestigationResult[]>([]);
  const [selectedInvestigations, setSelectedInvestigations] = useState<InvestigationResult[]>([]);

  useEffect(() => {
    const investigations = getComparisons();
    setAllInvestigations(investigations);
    
    // Check if subjects are provided in URL params
    const subjectsParam = searchParams.get("subjects");
    if (subjectsParam) {
      const subjects = subjectsParam.split(",").map(s => decodeURIComponent(s));
      const selected = investigations.filter(inv => subjects.includes(inv.subject));
      // Mark these as selected
      selected.forEach(inv => {
        if (!inv.selectedForComparison) {
          toggleComparisonSelection(inv.subject);
        }
      });
      setSelectedInvestigations(selected);
    } else {
      // Otherwise use selected investigations
      const selected = getSelectedForComparison();
      setSelectedInvestigations(selected);
    }
  }, [searchParams]);

  const handleToggleSelection = (subject: string) => {
    toggleComparisonSelection(subject);
    const investigations = getComparisons();
    setAllInvestigations(investigations);
    const selected = getSelectedForComparison();
    setSelectedInvestigations(selected);
  };

  const handleClearSelection = () => {
    clearComparisonSelection();
    setSelectedInvestigations([]);
    const investigations = getComparisons();
    setAllInvestigations(investigations);
  };

  const handleCompare = () => {
    if (selectedInvestigations.length < 2) return;
    const subjects = selectedInvestigations.map(inv => inv.subject).join(",");
    navigate(`/comparison?subjects=${subjects}`);
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'LEGITIMATE') return 'text-green-400';
    if (verdict === 'SUSPICIOUS') return 'text-yellow-400';
    if (verdict === 'SCAM') return 'text-accent';
    return 'text-muted-foreground';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-accent';
  };

  const getScoreDifference = (score1: number, score2: number) => {
    const diff = score1 - score2;
    return {
      value: Math.abs(diff),
      isHigher: diff > 0,
      isLower: diff < 0
    };
  };

  const getCategoryCount = (findings: InvestigationResult['findings'], category: string) => {
    return findings.filter(f => f.category === category).length;
  };

  if (selectedInvestigations.length === 0) {
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
              <TitleBanner title="Deep Detective" />
            </div>
            <div className="w-24" />
          </header>

          <main className="flex-1 p-8 flex items-center justify-center">
            <Card className="paper-texture notepad-shadow p-8 max-w-2xl w-full">
              <div className="text-center space-y-6">
                <Scale className="w-16 h-16 mx-auto text-primary" />
                <h1 className="font-typewriter text-3xl text-ink">Comparison Tool</h1>
                <p className="font-serif text-ink/70">
                  Select at least 2 investigations to compare side-by-side
                </p>
                
                {allInvestigations.length === 0 ? (
                  <div className="mt-8">
                    <p className="font-typewriter text-ink/50 mb-4">
                      No investigations saved yet. Run some investigations first!
                    </p>
                    <Button
                      onClick={() => navigate("/")}
                      className="font-typewriter"
                    >
                      Start Investigation
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <div className="grid gap-3">
                      {allInvestigations.map((inv) => (
                        <div
                          key={inv.subject}
                          className={`paper-texture border-2 rounded-sm p-4 cursor-pointer transition-all ${
                            inv.selectedForComparison
                              ? 'border-primary bg-paper/80'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleToggleSelection(inv.subject)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-typewriter text-lg text-ink">{inv.subject}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="font-serif text-sm text-ink/70">
                                  Score: <span className="font-bold">{inv.legitimacyScore}%</span>
                                </span>
                                <Badge className={getVerdictColor(inv.verdict)}>
                                  {inv.verdict}
                                </Badge>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              inv.selectedForComparison
                                ? 'bg-primary border-primary'
                                : 'border-ink/30'
                            }`}>
                              {inv.selectedForComparison && (
                                <span className="text-ink text-xs">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3 justify-center pt-4">
                      <Button
                        onClick={handleCompare}
                        disabled={selectedInvestigations.length < 2}
                        className="font-typewriter"
                      >
                        Compare Selected ({selectedInvestigations.length})
                      </Button>
                      {selectedInvestigations.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={handleClearSelection}
                          className="font-typewriter"
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </main>
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
          <div className="w-24" /> {/* Spacer */}
          <div className="animate-flicker">
            <TitleBanner title="Comparison View" />
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="font-typewriter text-foreground hover:text-primary"
          >
            Home
          </Button>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Comparison Header */}
            <div className="mb-6">
              <div className="paper-texture notepad-shadow rounded-sm p-4">
                <h2 className="font-typewriter text-xl text-ink mb-2">
                  Comparing {selectedInvestigations.length} Subjects
                </h2>
                <div className="flex flex-wrap gap-2">
                  {selectedInvestigations.map((inv, idx) => (
                    <Badge key={inv.subject} variant="outline" className="font-typewriter">
                      {idx + 1}. {inv.subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Side-by-side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {selectedInvestigations.map((inv, index) => (
                <Card key={inv.subject} className="paper-texture notepad-shadow p-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-ink/20">
                    <h3 className="font-typewriter text-2xl text-ink">{inv.subject}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleToggleSelection(inv.subject);
                        if (selectedInvestigations.length <= 2) {
                          navigate("/comparison");
                        }
                      }}
                      className="text-ink/50 hover:text-accent"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Legitimacy Score */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-typewriter text-xs text-muted-foreground uppercase">
                        Legitimacy Score
                      </p>
                      <p className="font-typewriter text-2xl text-foreground">
                        {inv.legitimacyScore}%
                      </p>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 ${getScoreColor(inv.legitimacyScore)} transition-all duration-1000`}
                        style={{ width: `${inv.legitimacyScore}%` }}
                      />
                    </div>
                    {selectedInvestigations.length === 2 && index === 1 && (
                      <div className="mt-2 text-xs font-typewriter">
                        {(() => {
                          const diff = getScoreDifference(
                            selectedInvestigations[0].legitimacyScore,
                            selectedInvestigations[1].legitimacyScore
                          );
                          if (diff.value > 0) {
                            return (
                              <span className={diff.isHigher ? 'text-green-400' : 'text-accent'}>
                                {diff.isHigher ? '↑' : '↓'} {diff.value}% {diff.isHigher ? 'higher' : 'lower'} than {selectedInvestigations[0].subject}
                              </span>
                            );
                          }
                          return <span className="text-muted-foreground">Same score</span>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Verdict */}
                  <div className="mb-6">
                    <p className="font-typewriter text-xs text-muted-foreground uppercase mb-1">
                      Verdict
                    </p>
                    <p className={`font-typewriter text-xl uppercase ${getVerdictColor(inv.verdict)}`}>
                      {inv.verdict}
                    </p>
                    {selectedInvestigations.length === 2 && index === 1 && (
                      <div className="mt-2 text-xs font-typewriter text-ink/50">
                        {inv.verdict !== selectedInvestigations[0].verdict && (
                          <span className="text-yellow-400">
                            Different verdict from {selectedInvestigations[0].subject}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Findings by Category */}
                  <div className="mb-6">
                    <p className="font-typewriter text-xs text-muted-foreground uppercase mb-3">
                      Findings Breakdown
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {['news', 'legal', 'social', 'financial', 'general'].map((category) => {
                        const count = getCategoryCount(inv.findings, category);
                        return (
                          <div key={category} className="flex items-center justify-between p-2 bg-ink/5 rounded">
                            <span className="font-typewriter text-xs uppercase text-ink/70">
                              {category}
                            </span>
                            <span className="font-serif text-sm font-bold text-ink">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {selectedInvestigations.length === 2 && index === 1 && (
                      <div className="mt-3 text-xs font-typewriter text-ink/50">
                        {(() => {
                          const total1 = selectedInvestigations[0].findings.length;
                          const total2 = selectedInvestigations[1].findings.length;
                          const diff = total2 - total1;
                          if (diff !== 0) {
                            return (
                              <span className={diff > 0 ? 'text-green-400' : 'text-accent'}>
                                {diff > 0 ? '+' : ''}{diff} findings {diff > 0 ? 'more' : 'fewer'} than {selectedInvestigations[0].subject}
                              </span>
                            );
                          }
                          return <span>Same number of findings</span>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="font-typewriter text-xs text-muted-foreground uppercase mb-2">
                      Summary
                    </p>
                    <p className="font-serif text-sm text-foreground/80 leading-relaxed break-words">
                      {inv.summary}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Findings Comparison Table */}
            {selectedInvestigations.length === 2 && (
              <Card className="paper-texture notepad-shadow p-6">
                <h3 className="font-typewriter text-xl text-ink mb-4 border-b-2 border-ink/20 pb-2">
                  Findings Comparison
                </h3>
                <div className="space-y-4">
                  {['news', 'legal', 'social', 'financial', 'general'].map((category) => {
                    const findings1 = selectedInvestigations[0].findings.filter(f => f.category === category);
                    const findings2 = selectedInvestigations[1].findings.filter(f => f.category === category);
                    const maxCount = Math.max(findings1.length, findings2.length);
                    
                    if (maxCount === 0) return null;

                    return (
                      <div key={category} className="border border-ink/20 rounded-sm p-4">
                        <h4 className="font-typewriter text-sm uppercase text-primary mb-3">
                          {category} Findings
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-typewriter text-xs text-ink/70 mb-2">
                              {selectedInvestigations[0].subject} ({findings1.length})
                            </p>
                            <div className="space-y-2">
                              {findings1.map((finding) => (
                                <div key={finding.id} className="p-2 bg-ink/5 rounded text-xs">
                                  <p className="font-serif text-ink/80 line-clamp-2">
                                    {finding.title}
                                  </p>
                                  <p className="font-typewriter text-ink/50 mt-1">
                                    {finding.source}
                                  </p>
                                </div>
                              ))}
                              {findings1.length === 0 && (
                                <p className="text-ink/40 italic">No findings</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-typewriter text-xs text-ink/70 mb-2">
                              {selectedInvestigations[1].subject} ({findings2.length})
                            </p>
                            <div className="space-y-2">
                              {findings2.map((finding) => (
                                <div key={finding.id} className="p-2 bg-ink/5 rounded text-xs">
                                  <p className="font-serif text-ink/80 line-clamp-2">
                                    {finding.title}
                                  </p>
                                  <p className="font-typewriter text-ink/50 mt-1">
                                    {finding.source}
                                  </p>
                                </div>
                              ))}
                              {findings2.length === 0 && (
                                <p className="text-ink/40 italic">No findings</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {findings1.length !== findings2.length && (
                          <div className="mt-3 p-2 bg-yellow-400/10 border border-yellow-400/30 rounded">
                            <p className="font-typewriter text-xs text-yellow-400">
                              ⚠ Difference: {Math.abs(findings1.length - findings2.length)} {category} finding(s)
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Comparison;
