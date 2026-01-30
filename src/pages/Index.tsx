import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleBanner from "@/components/TitleBanner";
import Notepad from "@/components/Notepad";
import CaseInput from "@/components/CaseInput";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import detectiveBg from "@/assets/detective-bg.jpg";

const Index = () => {
  const [subjectName, setSubjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    
    setIsSubmitting(true);
    navigate(`/results?subject=${encodeURIComponent(subjectName.trim())}`);
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${detectiveBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-background/60" />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(220 25% 6% / 0.7) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Title Banner */}
        <div className="mb-12 animate-flicker">
          <TitleBanner title="Deep Detective" />
        </div>

        {/* Notepad with Case Request Form */}
        <div className="transform hover:rotate-0 rotate-[1deg] transition-transform duration-300">
          <form onSubmit={handleSubmit}>
            <Notepad title="Case Request Form">
              <CaseInput
                label="Crypto Name"
                placeholder="Enter crypto name or symbol (e.g., Bitcoin, BTC, Ethereum)..."
                value={subjectName}
                onChange={setSubjectName}
              />
              
              {/* Submit Button */}
              <div className="mt-6">
                <Button
                  type="submit"
                  disabled={!subjectName.trim() || isSubmitting}
                  className="w-full font-typewriter uppercase tracking-wide bg-leather hover:bg-leather/80 text-foreground"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Opening Case..." : "Open Investigation"}
                </Button>
              </div>
              
              {/* Decorative elements */}
              <div className="mt-8 pt-4 border-t border-dashed border-ink/20">
                <p className="font-typewriter text-xs text-ink/50 italic">
                  All investigations are strictly confidential.
                </p>
              </div>
            </Notepad>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Index;
