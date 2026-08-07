import { prisma } from "../db.js";
import { shouldUseDatabasePersistence } from "../config/runtime.js";

export type FeedbackSummary = {
  measured: boolean;
  totalResponses: number;
  averageRating: number | null;
  recentComments: { rating: number; comment: string; createdAt: string }[];
};

export type FeedbackTrendPoint = { context: string; averageRating: number | null; responseCount: number };
export type FeedbackTrend = {
  measured: boolean;
  // Real pain-point signal: which contexts (app locations) score lowest,
  // and by which roles - not a formal usability study, but a genuine
  // "analyze behaviors, preferences, and pain points" answer on top of
  // the raw capture, closing the half of UX/NFR-011 the plain summary
  // above never addressed.
  byContext: FeedbackTrendPoint[];
  byRole: { role: string; averageRating: number | null; responseCount: number }[];
  // Last 7 days vs the 7 days before that - the smallest real window that
  // can show a genuine trend direction without needing months of data.
  recentAverageRating: number | null;
  priorAverageRating: number | null;
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

export async function getFeedbackTrend(): Promise<FeedbackTrend> {
  if (!shouldUseDatabasePersistence()) {
    return { measured: false, byContext: [], byRole: [], recentAverageRating: null, priorAverageRating: null };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [byContextRaw, byRoleRaw, recentAgg, priorAgg] = await Promise.all([
    prisma.userFeedback.groupBy({ by: ["context"], _avg: { rating: true }, _count: { _all: true } }),
    prisma.userFeedback.groupBy({ by: ["role"], _avg: { rating: true }, _count: { _all: true } }),
    prisma.userFeedback.aggregate({
      _avg: { rating: true },
      where: { createdAt: { gte: sevenDaysAgo } }
    }),
    prisma.userFeedback.aggregate({
      _avg: { rating: true },
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
    })
  ]);

  const byContext = byContextRaw
    .map((row) => ({ context: row.context, averageRating: row._avg.rating, responseCount: row._count._all }))
    // Lowest-scoring contexts first - the real pain points an owner would want to see first.
    .sort((a, b) => (a.averageRating ?? 5) - (b.averageRating ?? 5));

  const byRole = byRoleRaw
    .map((row) => ({ role: row.role ?? "unknown", averageRating: row._avg.rating, responseCount: row._count._all }))
    .sort((a, b) => (a.averageRating ?? 5) - (b.averageRating ?? 5));

  return {
    measured: byContextRaw.length > 0,
    byContext,
    byRole,
    recentAverageRating: recentAgg._avg.rating,
    priorAverageRating: priorAgg._avg.rating
  };
}
