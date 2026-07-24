export function NoActiveCall() {
  return (
    <div className="no-active-call">
      <div className="nac-icon" aria-hidden="true">
        &#9742;
      </div>
      <h2>No active call</h2>
      <p>
        Select a caller from the incoming queue. The cockpit blocks a second active encounter
        until the current call is completed or placed on hold.
      </p>
    </div>
  );
}
