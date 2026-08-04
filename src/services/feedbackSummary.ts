import { prisma } from "../db.js";
import { shouldUseDatabasePersistence } from "../config/runtime.js";

export type FeedbackSummary = {
  measured: boolean;
  totalResponses: number;
  averageRating: number | null;
  recentComments: { rating: number; comment: string; createdAt: string }[];
};

// A real, if partial, usability signal - not a formal usability study.
// In mock mode (or before any feedback has been submitted) there is
// nothing to measure yet, which is reported honestly via `measured: false`
// rather than a misleading zero/empty result.
export async function getFeedbackSummary(): Promise<FeedbackSummary> {
  if (!shouldUseDatabasePersistence()) {
    return { measured: false, totalResponses: 0, averageRating: null, recentComments: [] };
  }

  const [aggregate, recent] = await Promise.all([
    prisma.userFeedback.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
    prisma.userFeedback.findMany({
      where: { comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { rating: true, comment: true, createdAt: true }
    })
  ]);

  const totalResponses = aggregate._count._all;
  return {
    measured: totalResponses > 0,
    totalResponses,
    averageRating: aggregate._avg.rating,
    recentComments: recent.map((row) => ({
      rating: row.rating,
      comment: row.comment ?? "",
      createdAt: row.createdAt.toISOString()
    }))
  };
}
