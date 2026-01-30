import { useState, useEffect } from "react";
import { Comment, Finding } from "@/types/investigation";
import { addComment, addReply, deleteComment, getComments } from "@/lib/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, X, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FindingCommentsProps {
  subject: string;
  finding: Finding;
  onUpdate?: () => void;
}

const FindingComments = ({ subject, finding, onUpdate }: FindingCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const loadedComments = getComments(subject, finding.id);
    setComments(loadedComments);
  }, [subject, finding.id]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = addComment(
      subject,
      finding.id,
      newComment.trim(),
      author.trim() || "Anonymous"
    );
    
    if (comment) {
      setComments([...comments, comment]);
      setNewComment("");
      setAuthor("");
      setShowAddComment(false);
      onUpdate?.();
    }
  };

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;
    
    const reply = addReply(
      subject,
      finding.id,
      commentId,
      replyText.trim(),
      author.trim() || "Anonymous"
    );
    
    if (reply) {
      const updatedComments = comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...(c.replies || []), reply]
          };
        }
        return c;
      });
      setComments(updatedComments);
      setReplyText("");
      setReplyingTo(null);
      onUpdate?.();
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (deleteComment(subject, finding.id, commentId)) {
      setComments(comments.filter(c => c.id !== commentId));
      onUpdate?.();
    }
  };

  return (
    <div className="mt-4 border-t-2 border-ink/30 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-typewriter text-sm text-ink font-bold uppercase">
            Comments ({comments.length})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddComment(!showAddComment)}
          className="font-typewriter text-xs h-7 border-primary/50 hover:bg-primary/10"
        >
          {showAddComment ? "Cancel" : "+ Add Comment"}
        </Button>
      </div>

      {showAddComment && (
        <div className="mb-4 p-3 bg-ink/5 rounded border border-ink/20">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full mb-2 px-2 py-1 text-xs font-typewriter bg-paper text-ink border border-ink/20 rounded placeholder:text-ink/50"
          />
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2 font-serif text-sm min-h-[60px] bg-paper text-ink border-ink/20 placeholder:text-ink/50"
          />
          <Button
            onClick={handleAddComment}
            size="sm"
            className="font-typewriter text-xs"
          >
            <Send className="w-3 h-3 mr-1" />
            Post Comment
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 bg-ink/5 rounded border border-ink/10">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-typewriter text-xs font-bold text-ink">
                  {comment.author}
                </span>
                <span className="font-typewriter text-xs text-ink/50 ml-2">
                  {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteComment(comment.id)}
                className="h-5 w-5 p-0 text-ink/50 hover:text-accent"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="font-serif text-sm text-ink/80 mb-2">{comment.text}</p>
            
            {replyingTo === comment.id ? (
              <div className="mt-2 p-2 bg-paper rounded border border-ink/20">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full mb-2 px-2 py-1 text-xs font-typewriter bg-paper text-ink border border-ink/20 rounded placeholder:text-ink/50"
                />
                <Textarea
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="mb-2 font-serif text-sm min-h-[50px] bg-paper text-ink border-ink/20 placeholder:text-ink/50"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddReply(comment.id)}
                    size="sm"
                    className="font-typewriter text-xs"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="font-typewriter text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(comment.id)}
                className="font-typewriter text-xs h-6 text-ink/50 hover:text-primary"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 ml-4 space-y-2 border-l-2 border-ink/20 pl-3">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="p-2 bg-paper/50 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-typewriter text-xs font-bold text-ink">
                        {reply.author}
                      </span>
                      <span className="font-typewriter text-xs text-ink/50">
                        {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="font-serif text-xs text-ink/70">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {comments.length === 0 && !showAddComment && (
        <p className="text-center font-typewriter text-xs text-ink/40 italic py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
};

export default FindingComments;
