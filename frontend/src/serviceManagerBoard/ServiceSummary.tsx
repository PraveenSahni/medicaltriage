type ServiceSummaryProps = {
  waitingCount: number;
  longestWaitMinutes: number;
  inFlowCount: number;
  safetyAlertCount: number;
  assignedNurseCount: number;
};

export function ServiceSummary({
  waitingCount,
  longestWaitMinutes,
  inFlowCount,
  safetyAlertCount,
  assignedNurseCount
}: ServiceSummaryProps) {
  return (
    <section className="smb-summary" aria-label="Service summary">
      <div className="smb-metric">
        <div>
          <div className="smb-metric-label">Waiting calls</div>
          <div className="smb-metric-note">Longest wait {longestWaitMinutes}m</div>
        </div>
        <div className="smb-metric-value">{waitingCount}</div>
      </div>
      <div className="smb-metric">
        <div>
          <div className="smb-metric-label">In clinical flow</div>
          <div className="smb-metric-note">Across active stages</div>
        </div>
        <div className="smb-metric-value">{inFlowCount}</div>
      </div>
      <div className="smb-metric smb-metric-alert">
        <div>
          <div className="smb-metric-label">Safety alerts</div>
          <div className="smb-metric-note">For manager awareness</div>
        </div>
        <div className="smb-metric-value">{safetyAlertCount}</div>
      </div>
      <div className="smb-metric">
        <div>
          <div className="smb-metric-label">Assigned nurses</div>
          <div className="smb-metric-note">Currently holding a call</div>
        </div>
        <div className="smb-metric-value">{assignedNurseCount}</div>
      </div>
    </section>
  );
}
