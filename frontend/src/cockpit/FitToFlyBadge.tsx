import { Plane } from "lucide-react";
import type { QueueItem } from "../QueueContext";
import { colorStyleForFitToFly, FIT_TO_FLY_LABEL, FIT_TO_FLY_NOT_ASSESSED_LABEL } from "./fitToFlyDisplay";

// Always visible at the top of the call, regardless of which stage tab is
// active - the user explicitly asked for this to behave like a real aviation
// fit-to-fly indicator (grey "Not Assessed" before a disposition exists,
// green/red/orange once one does), not something only shown on the
// Disposition & Advice stage.
export function FitToFlyBadge({ item }: { item: QueueItem }) {
  const status = item.fitToFlyStatus;
  return (
    <div className="fit-to-fly-badge" style={colorStyleForFitToFly(status)} title="Fit-to-Fly Recommendation">
      <Plane size={14} strokeWidth={2.5} />
      {status ? FIT_TO_FLY_LABEL[status] : FIT_TO_FLY_NOT_ASSESSED_LABEL}
    </div>
  );
}
