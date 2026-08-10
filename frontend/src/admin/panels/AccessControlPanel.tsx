import { useEffect, useState } from "react";
import { ElevationModal } from "../shared/ElevationModal";
import { useElevatedAction } from "../shared/useElevatedAction";
import { fetchJson, postJson } from "../shared/adminApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

type ElevationStatus = { elevated: boolean; expiresAtIso?: string; elevationId?: string };

type AuditEvent = {
  id: string;
  timestampIso: string;
  userId: string;
  activeRole: string;
  action: string;
  module: string;
  resource: string;
  purpose?: string;
  success: boolean;
  risk: string;
};

type EntitlementReview = { id: string; timestampIso: string; purpose?: string; acknowledged: boolean };

type PendingRevealRequest = {
  id: string;
  requesterUserId: string;
  resourceType: string;
  resourceId: string;
  fieldName: string;
  purpose: string;
  status: string;
  createdAt: string;
};

type MyRevealRequest = { id: string; status: "pending" | "approved" | "denied" | "fetched" | "error"; message?: string };

type AccessControlPanelProps = {
  permissions: string[];
};

export function AccessControlPanel({ permissions }: AccessControlPanelProps) {
  const hasPermission = (permission: string) => permissions.includes(permission);
  const elevation = useElevatedAction();

  return (
    <section className="admin-stack">
      <ElevationStatusCard elevation={elevation} />
      <ResourceHistoryCard />
      {hasPermission("audit.events.view") && <EntitlementReviewCard />}
      {(hasPermission("privacy.reveal.request") || hasPermission("privacy.reveal.approve")) && (
        <RevealWorkflowCard canRequest={hasPermission("privacy.reveal.request")} canApprove={hasPermission("privacy.reveal.approve")} />
      )}
      {hasPermission("audit.events.view") && <RevocationMetricsCard />}
      <ElevationModal
        open={elevation.modalOpen}
        error={elevation.modalError}
        submitting={elevation.submitting}
        onSubmit={elevation.submitCode}
        onClose={elevation.closeModal}
      />
    </section>
  );
}

function ElevationStatusCard({ elevation }: { elevation: ReturnType<typeof useElevatedAction> }) {
  const [status, setStatus] = useState<ElevationStatus>({ elevated: false });
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const result = await fetchJson<ElevationStatus>("/api/v1/admin/elevation/status");
      setStatus(result);
    } catch {
      setError("Unable to load elevation status.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function elevateNow() {
    await elevation.runElevated(async () => {
      await refresh();
    });
  }

  async function deElevate() {
    try {
      await postJson("/api/v1/admin/de-elevate", {});
      await refresh();
    } catch {
      setError("Unable to de-elevate.");
    }
  }

  return (
    <article className="help-card help-card-wide">
      <span className="tag-label">PRIVILEGED ACCESS (PAM)</span>
      <h3 className="help-title">{status.elevated ? "Elevated" : "Not elevated"}</h3>
      {error && <div className="login-alert">{error}</div>}
      {status.elevated && status.expiresAtIso && <p>Elevation expires {new Date(status.expiresAtIso).toLocaleString()}.</p>}
      <div className="admin-action-row">
        {!status.elevated && <Button onClick={elevateNow}>Elevate now</Button>}
        {status.elevated && (
          <Button variant="outline" onClick={deElevate}>
            De-elevate now
          </Button>
        )}
      </div>
    </article>
  );
}

function ResourceHistoryCard() {
  const [resourceId, setResourceId] = useState("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [status, setStatus] = useState("");

  async function search() {
    if (!resourceId.trim()) {
      return;
    }
    setStatus("Searching...");
    try {
      const result = await fetchJson<{ resource: string; events: AuditEvent[] }>(
        `/api/v1/admin/audit-events/resource/${encodeURIComponent(resourceId.trim())}`
      );
      setEvents(result.events);
      setStatus(`${result.events.length} event(s) found for ${result.resource}.`);
    } catch {
      setStatus("Unable to search audit history.");
    }
  }

  return (
    <article className="help-card help-card-wide">
      <h3 className="help-title">Resource modification history</h3>
      <p>Trace every recorded change to a specific record, e.g. UserAccount:usr_123 or Role:system_administrator:admin.roles.manage.</p>
      <div className="admin-inline-form">
        <Input
          type="text"
          placeholder="Resource id (e.g. UserAccount:usr_123)"
          value={resourceId}
          onChange={(event) => setResourceId(event.target.value)}
          className="flex-1"
        />
        <Button onClick={search}>Trace</Button>
      </div>
      {status && <small>{status}</small>}
      <div className="admin-list">
        {events.map((event) => (
          <div key={event.id}>
            <strong>{event.action}</strong>
            <span>
              {new Date(event.timestampIso).toLocaleString()} | {event.userId} ({event.activeRole})
            </span>
            <small>{event.purpose ?? "No purpose recorded."}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function EntitlementReviewCard() {
  const [reviews, setReviews] = useState<EntitlementReview[]>([]);
  const [status, setStatus] = useState("Loading access-entitlement reviews.");

  async function load() {
    try {
      const result = await fetchJson<{ reviews: EntitlementReview[] }>("/api/v1/admin/access-entitlement-reviews");
      setReviews(result.reviews);
      setStatus(`${result.reviews.length} certification(s) on record.`);
    } catch {
      setStatus("Unable to load access-entitlement reviews.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function acknowledge(id: string) {
    try {
      await postJson(`/api/v1/admin/access-entitlement-reviews/${id}/acknowledge`, {});
      await load();
    } catch {
      setStatus("Unable to acknowledge this certification.");
    }
  }

  return (
    <article className="help-card help-card-wide">
      <h3 className="help-title">Access-entitlement review certifications</h3>
      <small>{status}</small>
      <div className="admin-list">
        {reviews.map((review) => (
          <div key={review.id}>
            <strong>{new Date(review.timestampIso).toLocaleString()}</strong>
            <span>{review.purpose ?? "Access-entitlement review certification"}</span>
            <small>{review.acknowledged ? "Acknowledged" : "Pending acknowledgement"}</small>
            {!review.acknowledged && (
              <Button variant="outline" size="sm" onClick={() => acknowledge(review.id)}>
                Acknowledge
              </Button>
            )}
          </div>
        ))}
        {reviews.length === 0 && <div>No certifications on record.</div>}
      </div>
    </article>
  );
}

function RevealWorkflowCard({ canRequest, canApprove }: { canRequest: boolean; canApprove: boolean }) {
  const [resourceType, setResourceType] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [field, setField] = useState("");
  const [purpose, setPurpose] = useState("");
  const [myRequests, setMyRequests] = useState<MyRevealRequest[]>([]);
  const [pending, setPending] = useState<PendingRevealRequest[]>([]);
  const [status, setStatus] = useState("");

  async function loadPending() {
    if (!canApprove) {
      return;
    }
    try {
      const result = await fetchJson<{ requests: PendingRevealRequest[] }>("/api/v1/admin/reveal/pending");
      setPending(result.requests);
    } catch {
      setStatus("Unable to load pending reveal requests.");
    }
  }

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitRequest() {
    if (!resourceType.trim() || !resourceId.trim() || !field.trim() || purpose.trim().length < 6) {
      setStatus("Resource type, resource id, field, and a purpose (6+ characters) are all required.");
      return;
    }
    try {
      const result = await postJson<{ id: string; status: string }>("/api/v1/admin/reveal/request", {
        resourceType: resourceType.trim(),
        resourceId: resourceId.trim(),
        field: field.trim(),
        purpose: purpose.trim()
      });
      setMyRequests((current) => [...current, { id: result.id, status: "pending" }]);
      setStatus(`Request ${result.id} submitted - awaiting a distinct approver.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit reveal request.");
    }
  }

  async function fetchValue(id: string) {
    try {
      const result = await fetchJson<{ value: string }>(`/api/v1/admin/reveal/${id}/value`);
      setMyRequests((current) =>
        current.map((request) => (request.id === id ? { ...request, status: "fetched", message: `Value: ${result.value}` } : request))
      );
    } catch (error) {
      setMyRequests((current) =>
        current.map((request) =>
          request.id === id
            ? { ...request, status: "error", message: error instanceof Error ? error.message : "Not yet approved or already expired." }
            : request
        )
      );
    }
  }

  async function decide(id: string, decision: "approved" | "denied") {
    try {
      await postJson(`/api/v1/admin/reveal/${id}/decision`, { decision });
      await loadPending();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to record decision (self-approval is always rejected).");
    }
  }

  return (
    <article className="help-card help-card-wide">
      <span className="tag-label">TWO-STEP DUAL-CONTROL REVEAL</span>
      <h3 className="help-title">PII Reveal Workflow</h3>
      {status && <div className="login-alert">{status}</div>}
      {canRequest && (
        <>
          <div className="admin-inline-form">
            <Input type="text" placeholder="Resource type (e.g. AdminUser)" value={resourceType} onChange={(event) => setResourceType(event.target.value)} />
            <Input type="text" placeholder="Resource id" value={resourceId} onChange={(event) => setResourceId(event.target.value)} />
            <Input type="text" placeholder="Field (e.g. email)" value={field} onChange={(event) => setField(event.target.value)} />
            <Input type="text" placeholder="Purpose (6+ characters)" value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            <Button onClick={submitRequest}>Request reveal</Button>
          </div>
          <div className="admin-list">
            {myRequests.map((request) => (
              <div key={request.id}>
                <strong>{request.id}</strong>
                <span>{request.status}</span>
                {request.message && <small>{request.message}</small>}
                {request.status === "pending" && (
                  <Button variant="outline" size="sm" onClick={() => fetchValue(request.id)}>
                    Fetch value (60s once approved)
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {canApprove && (
        <>
          <h4 className="help-title">Pending approvals</h4>
          <div className="admin-list">
            {pending.map((request) => (
              <div key={request.id}>
                <strong>
                  {request.resourceType}:{request.resourceId} ({request.fieldName})
                </strong>
                <span>Requested by {request.requesterUserId}</span>
                <small>{request.purpose}</small>
                <span className="admin-action-row">
                  <Button size="sm" onClick={() => decide(request.id, "approved")}>
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => decide(request.id, "denied")}>
                    Deny
                  </Button>
                </span>
              </div>
            ))}
            {pending.length === 0 && <div>No pending reveal requests.</div>}
          </div>
        </>
      )}
    </article>
  );
}

function RevocationMetricsCard() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("Loading access-revocation metrics.");

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchJson<Record<string, unknown>>("/api/v1/admin/access-revocation-metrics?days=30");
        const numericOnly: Record<string, number> = {};
        for (const [key, value] of Object.entries(result)) {
          if (typeof value === "number") {
            numericOnly[key] = value;
          }
        }
        setMetrics(numericOnly);
        setStatus("Last 30 days.");
      } catch {
        setStatus("Unable to load access-revocation metrics.");
      }
    })();
  }, []);

  const entries = Object.entries(metrics);

  return (
    <article className="help-card help-card-wide">
      <h3 className="help-title">Access-revocation metrics</h3>
      <small>{status}</small>
      {entries.length > 0 && (
        <section className="admin-metric-grid">
          {entries.map(([label, value]) => (
            <div key={label} className="admin-metric">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
