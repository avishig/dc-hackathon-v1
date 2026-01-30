import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { makeShareable, getShareableLink } from "@/lib/sharing";
import { useToast } from "@/hooks/use-toast";

interface ShareInvestigationProps {
  subject: string;
  shareableId?: string;
}

const ShareInvestigation = ({ subject, shareableId }: ShareInvestigationProps) => {
  const { toast } = useToast();
  const [link, setLink] = useState<string | null>(
    shareableId ? getShareableLink(shareableId) : null
  );
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (link) {
      copyToClipboard(link);
      return;
    }

    const shareLink = makeShareable(subject);
    if (shareLink) {
      setLink(shareLink);
      copyToClipboard(shareLink);
    } else {
      toast({
        title: "Error",
        description: "Failed to generate shareable link",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Shareable link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={handleShare}
        className="w-full font-typewriter text-xs"
        size="sm"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="w-3 h-3 mr-2" />
            {link ? "Copy Link" : "Generate Share Link"}
          </>
        )}
      </Button>
      {link && (
        <div className="p-2 bg-ink/5 rounded border border-ink/20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={link}
              readOnly
              className="flex-1 font-mono text-xs bg-transparent text-ink/70 border-none outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(link)}
              className="h-6 w-6 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareInvestigation;
