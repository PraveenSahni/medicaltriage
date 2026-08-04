import { useState } from "react";
import { submitFeedback } from "./api/feedback";

type FeedbackWidgetProps = {
  context: string;
};

// Closes NFR-011 (UX tab) - a minimal, real feedback capture point.
// Deliberately simple (1-5 rating + optional comment), not a full
// behavior-analytics platform.
export function FeedbackWidget({ context }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  if (submitted) {
    return <div className="feedback-widget feedback-widget-thanks">Thanks for the feedback.</div>;
  }

  const handleSubmit = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      await submitFeedback(context, rating, comment.trim() || undefined);
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="feedback-widget">
      <div className="feedback-widget-title">How was this experience?</div>
      <div className="feedback-widget-stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            className={rating && rating >= value ? "feedback-star feedback-star-active" : "feedback-star"}
            onClick={() => setRating(value)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="feedback-widget-comment"
        placeholder="Anything you'd like to add? (optional)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
      />
      <button
        type="button"
        className="feedback-widget-submit"
        disabled={!rating || busy}
        onClick={handleSubmit}
      >
        Submit feedback
      </button>
    </div>
  );
}
