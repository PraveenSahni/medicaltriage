/**
 * Demo-only call generator for the Triage Service Manager Board. Creates one
 * new incoming call via the existing POST /api/v1/queue endpoint, using
 * realistic reason narratives spanning the full range of protocols this
 * system already covers (the licensed STCC "Abdominal Pain - Male" protocol
 * plus the open-source guideline library), matching the same style/breadth
 * of reasons the existing background call simulator (src/services/
 * callSimulator.ts) already generates.
 *
 * This is the only place on the Service Manager Board that calls a mutation
 * endpoint - it creates a brand-new demo call, it never edits or advances any
 * existing call, so it does not conflict with the board's read-only
 * requirement over existing queue records.
 */

type DemoCase = {
  istStaffId: string;
  summary: string;
  department: string;
  jobTitle: string;
  channel: "Phone" | "WhatsApp" | "Callback";
};

const DEMO_CASES: DemoCase[] = [
  // Licensed STCC "Abdominal Pain - Male" protocol.
  { istStaffId: "IST-00007", summary: "Sudden severe stomach pain, caller sounds confused, family says he looks pale and clammy.", department: "Administration", jobTitle: "CDC Analyst", channel: "Phone" },
  { istStaffId: "IST-00009", summary: "Collapsed briefly after severe stomach pain, now conscious but shaky and weak.", department: "Flight Operations", jobTitle: "Captain", channel: "Callback" },
  { istStaffId: "IST-00010", summary: "Severe belly pain for over an hour, just vomited and it had blood in it.", department: "Inflight Services", jobTitle: "Cabin Crew", channel: "Phone" },
  { istStaffId: "IST-00012", summary: "63-year-old with sudden severe abdominal pain, worse than anything before.", department: "Administration", jobTitle: "CDC Analyst", channel: "WhatsApp" },
  { istStaffId: "IST-00013", summary: "Vomiting green-colored fluid, abdomen pain has been getting worse over the last hour.", department: "Ground Operations", jobTitle: "Airport Customer Service", channel: "Phone" },
  { istStaffId: "IST-00017", summary: "Constant moderate stomach pain for about three hours, no vomiting so far.", department: "Administration", jobTitle: "HR Specialist", channel: "Phone" },
  { istStaffId: "IST-00040", summary: "Constipated for a few days and noticed a little blood on the toilet paper.", department: "Flight Operations", jobTitle: "Captain", channel: "Phone" },
  { istStaffId: "IST-00054", summary: "Noticed black, tarry-looking stools since yesterday plus abdominal discomfort.", department: "Inflight Services", jobTitle: "Cabin Crew", channel: "Callback" },
  // Open-source guideline protocols - other topics already covered by the content library.
  { istStaffId: "IST-00015", summary: "Bad headache for the past two hours with some sensitivity to light.", department: "Ground Operations", jobTitle: "Catering Coordinator", channel: "Callback" },
  { istStaffId: "IST-00021", summary: "Twisted his ankle playing sport an hour ago and cannot put weight on it.", department: "Flight Operations", jobTitle: "First Officer", channel: "WhatsApp" },
  { istStaffId: "IST-00027", summary: "Sore throat and mild fever since this morning, no trouble breathing.", department: "Flight Operations", jobTitle: "First Officer", channel: "Phone" },
  { istStaffId: "IST-00030", summary: "Feeling dizzy and lightheaded since about twenty minutes ago, nearly fainted once.", department: "Inflight Services", jobTitle: "Cabin Supervisor", channel: "Callback" },
  { istStaffId: "IST-00032", summary: "Cough with fever for the past day, mild shortness of breath.", department: "Administration", jobTitle: "HR Specialist", channel: "Phone" },
  { istStaffId: "IST-00033", summary: "New itchy rash on the arm that started this morning, not spreading.", department: "Ground Operations", jobTitle: "Ramp Agent", channel: "WhatsApp" },
  { istStaffId: "IST-00034", summary: "Lower back pain after lifting a heavy bag a few hours ago.", department: "Inflight Services", jobTitle: "Cabin Supervisor", channel: "Phone" },
  { istStaffId: "IST-00038", summary: "Ankle swelling and pain after a fall on the stairs an hour ago.", department: "Administration", jobTitle: "Medical Commission Clerk", channel: "Callback" },
  { istStaffId: "IST-00042", summary: "Feeling anxious and unable to sleep for the past few nights.", department: "Flight Operations", jobTitle: "First Officer", channel: "WhatsApp" },
  { istStaffId: "IST-00047", summary: "Ear pain and reduced hearing on one side since yesterday.", department: "Ground Operations", jobTitle: "Airport Customer Service", channel: "Phone" },
  { istStaffId: "IST-00048", summary: "Mild chest tightness after exercise earlier today, has since resolved.", department: "Ground Operations", jobTitle: "Ramp Agent", channel: "Phone" },
  { istStaffId: "IST-00055", summary: "Toothache and jaw pain for the past two days.", department: "Engineering", jobTitle: "Avionics Engineer", channel: "WhatsApp" }
];

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

export async function generateDemoStccCall(): Promise<void> {
  const candidate = DEMO_CASES[Math.floor(Math.random() * DEMO_CASES.length)];
  const response = await fetch(`${apiBase}/api/v1/queue`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      istStaffId: candidate.istStaffId,
      // organizationId intentionally omitted - the backend defaults it to the
      // calling session's own organization (createQueueItem() in
      // queueOrchestration.ts), so a generated call is always visible to
      // whichever manager/nurse generated it, whatever org they're scoped to.
      patientType: "Staff",
      channel: candidate.channel,
      stationCode: "DOH",
      department: candidate.department,
      jobTitle: candidate.jobTitle,
      summary: candidate.summary,
      reasonNarrative: candidate.summary,
      slaMinutes: 20
    })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `Failed to generate call (${response.status})`);
  }
}
