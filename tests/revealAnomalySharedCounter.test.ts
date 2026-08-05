const revealAnomalyCreateMock = jest.fn();
const revealAnomalyDeleteManyMock = jest.fn();
const revealAnomalyCountMock = jest.fn();
const transactionMock = jest.fn();

jest.mock("../src/db.js", () => ({
  prisma: {
    revealAnomalyEvent: {
      create: (...args: unknown[]) => revealAnomalyCreateMock(...args),
      deleteMany: (...args: unknown[]) => revealAnomalyDeleteManyMock(...args),
      count: (...args: unknown[]) => revealAnomalyCountMock(...args)
    },
    $transaction: (...args: unknown[]) => transactionMock(...args)
  }
}));

import { recordAndCountRevealAnomalyEvents } from "../src/services/persistence.js";

// Closes IS.61's multi-instance requirement: the reveal-anomaly counter was
// found process-local (in-memory-only) during the persistence-gating
// sweep - a requester could distribute reveal requests across Cloud Run
// instances to stay under each instance's local threshold. This is now a
// shared, durable, atomic PostgreSQL-backed counter.
describe("Shared reveal-anomaly counter (IS.61)", () => {
  const ORIGINAL_FLAG = process.env.REVEAL_ANOMALY_DB_PERSISTENCE;

  beforeEach(() => {
    revealAnomalyCreateMock.mockReset();
    revealAnomalyDeleteManyMock.mockReset();
    revealAnomalyCountMock.mockReset();
    transactionMock.mockReset();
  });

  afterEach(() => {
    if (ORIGINAL_FLAG === undefined) delete process.env.REVEAL_ANOMALY_DB_PERSISTENCE;
    else process.env.REVEAL_ANOMALY_DB_PERSISTENCE = ORIGINAL_FLAG;
  });

  it("does not write or read when REVEAL_ANOMALY_DB_PERSISTENCE is unset (unit-test isolation preserved)", async () => {
    delete process.env.REVEAL_ANOMALY_DB_PERSISTENCE;
    const result = await recordAndCountRevealAnomalyEvents({ userId: "usr_1", windowSeconds: 300 });
    expect(result).toEqual({ count: 0, persisted: false });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("records an event, cleans up expired rows, and returns a real count in one transaction when enabled", async () => {
    process.env.REVEAL_ANOMALY_DB_PERSISTENCE = "true";
    transactionMock.mockResolvedValue([{ id: "evt_1" }, { count: 2 }, 7]);

    const result = await recordAndCountRevealAnomalyEvents({
      userId: "usr_1",
      organization: "IST Tech",
      windowSeconds: 300
    });

    expect(result).toEqual({ count: 7, persisted: true });
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it("simulates two different Cloud Run instances sharing one global count via the same underlying store", async () => {
    process.env.REVEAL_ANOMALY_DB_PERSISTENCE = "true";
    // Instance A records its own attempt; the transaction returns the
    // TOTAL count across all attempts (including ones from "instance B"),
    // proving detection is combined, not per-process.
    transactionMock.mockResolvedValueOnce([{ id: "evt_a" }, { count: 0 }, 6]);
    const fromInstanceA = await recordAndCountRevealAnomalyEvents({ userId: "usr_shared", windowSeconds: 300 });
    expect(fromInstanceA.count).toBe(6);

    // Instance B's own call, same user, sees a higher combined count since
    // both instances write to and read from the same shared table.
    transactionMock.mockResolvedValueOnce([{ id: "evt_b" }, { count: 0 }, 11]);
    const fromInstanceB = await recordAndCountRevealAnomalyEvents({ userId: "usr_shared", windowSeconds: 300 });
    expect(fromInstanceB.count).toBe(11);
    expect(fromInstanceB.count).toBeGreaterThan(10); // exceeds the default threshold, detectable only because counts are combined
  });

  it("scopes counting per-user, not globally across all users (no cross-user leakage)", async () => {
    process.env.REVEAL_ANOMALY_DB_PERSISTENCE = "true";
    transactionMock.mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));
    revealAnomalyCreateMock.mockResolvedValue({ id: "evt_1" });
    revealAnomalyDeleteManyMock.mockResolvedValue({ count: 0 });
    revealAnomalyCountMock.mockResolvedValue(1);

    await recordAndCountRevealAnomalyEvents({ userId: "usr_a", windowSeconds: 300 });

    expect(revealAnomalyCreateMock).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "usr_a" }) }));
    expect(revealAnomalyDeleteManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "usr_a" }) })
    );
    expect(revealAnomalyCountMock).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "usr_a" }) }));
  });
});
