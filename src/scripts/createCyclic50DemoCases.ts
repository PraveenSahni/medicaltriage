/**
 * Creates 50 real test cases on a target server (defaults to the GCP demo),
 * 10 per real STCC protocol (5 protocols x 10 = 50), in round-robin order
 * (one of each protocol per cycle, not all 10 of one protocol back to back),
 * with a randomized 60-120s gap between each creation to mimic staggered
 * real call arrival. Each reason narrative is under 12 words and varied
 * (not a single repeated phrase) so the queue looks like distinct real
 * callers. Cases are created only (POST /api/v1/queue) and left open/
 * unclaimed - no claim/complete workflow is driven by this script.
 *
 * Usage: API_BASE=https://triaged.irisstar.tech npx tsx src/scripts/createCyclic50DemoCases.ts
 */

const API_BASE = process.env.API_BASE ?? "https://triaged.irisstar.tech";
const GENERATOR_USERNAME = "layla@irisstar.tech";
const GENERATOR_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";

type CookieJar = { cookie?: string; token?: string };

type ProtocolSpec = {
  expectedProtocolId: string;
  istStaffId: string;
  reasons: string[];
};

// 10 varied, real-sounding reasons per protocol, each under 12 words.
const PROTOCOLS: ProtocolSpec[] = [
  {
    expectedProtocolId: "stcc-abdominal-pain-male",
    istStaffId: "IST-00014",
    reasons: [
      "Severe stomach pain for two hours",
      "Stomach pain and nausea since this morning",
      "Sharp abdominal pain came on suddenly today",
      "Cramping stomach pain after eating dinner",
      "Constant abdominal pain for the past day",
      "Stomach ache with some vomiting since noon",
      "Lower abdomen pain worsening over three hours",
      "Mild stomach pain on and off today",
      "Abdominal pain and bloating since yesterday",
      "Stomach cramps and discomfort since breakfast"
    ]
  },
  {
    expectedProtocolId: "stcc-ankle-injury",
    istStaffId: "IST-00014",
    reasons: [
      "Sprained ankle, swollen with possible fracture",
      "Twisted my ankle badly playing football today",
      "Ankle injury from a fall down stairs",
      "Rolled my ankle jumping off a ladder",
      "Ankle swollen and painful after a fall",
      "Hurt my ankle stepping off a curb",
      "Ankle injury during a jog this morning",
      "Twisted ankle, cannot put weight on it",
      "Fell and injured my ankle at work",
      "Ankle pain after landing awkwardly from a jump"
    ]
  },
  {
    expectedProtocolId: "stcc-ankle-pain",
    istStaffId: "IST-01136",
    reasons: [
      "Ankle pain and stiffness for days",
      "Ankle has been aching for over a week",
      "Chronic ankle pain flaring up again today",
      "Mild ankle pain, no injury happened",
      "Ankle stiffness and soreness since last week",
      "Ankle pain worsening gradually over several days",
      "Ongoing ankle discomfort for about ten days",
      "Ankle feels stiff and sore most mornings",
      "Ankle pain that comes and goes lately",
      "Persistent ankle ache without any recent injury"
    ]
  },
  {
    expectedProtocolId: "stcc-diarrhea",
    istStaffId: "IST-00014",
    reasons: [
      "Watery diarrhea and loose stools today",
      "Diarrhea and stomach cramps since last night",
      "Loose stools several times since this morning",
      "Diarrhea after eating out yesterday evening",
      "Frequent watery stools for the past day",
      "Mild diarrhea on and off today",
      "Diarrhea with some nausea since breakfast",
      "Loose bowel movements since returning from travel",
      "Watery diarrhea for the past two days",
      "Diarrhea and mild stomach upset today"
    ]
  },
  {
    expectedProtocolId: "stcc-pregnancy-decreased-or-abnormal-fetal-movement",
    istStaffId: "IST-00001",
    reasons: [
      "Pregnant, baby's movement seems decreased today",
      "Pregnant, haven't felt baby move much today",
      "Baby's kicks feel less frequent than usual",
      "Pregnant, doing a kick count, movement low",
      "Baby seems quieter than normal this morning",
      "Pregnant, worried baby isn't moving enough today",
      "Fetal movement feels reduced since this morning",
      "Pregnant, baby moved less during kick count",
      "Noticed baby moving less than normal today",
      "Pregnant, concerned about decreased baby movement"
    ]
  }
];

async function request(jar: CookieJar, path: string, init: RequestInit = {}, attempt = 1): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (jar.cookie) headers.set("Cookie", jar.cookie);
  if (jar.token) headers.set("Authorization", `Bearer ${jar.token}`);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) jar.cookie = setCookie.split(";")[0];
    return response;
  } catch (error) {
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      return request(jar, path, init, attempt + 1);
    }
    throw error;
  }
}

async function login(jar: CookieJar, username: string, password: string): Promise<void> {
  const r = await request(jar, "/api/v1/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  if (!r.ok) throw new Error(`Login failed for ${username}: ${r.status}`);
  const body = (await r.json()) as { accessToken?: string };
  jar.token = body.accessToken;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

async function main() {
  const jar: CookieJar = {};
  await login(jar, GENERATOR_USERNAME, GENERATOR_PASSWORD);

  // Protocol 0 (Abdominal Pain - Male) already has 1 case created from an
  // earlier interrupted run (case-d5f36b84, reason index 0) - skip that
  // reason so the total still lands on exactly 10 per protocol / 50 total.
  const alreadyCreatedPerProtocol = [1, 0, 0, 0, 0];
  const usedIndexPerProtocol = [...alreadyCreatedPerProtocol];
  const totalPerProtocol = 10;
  let created = 0;
  let failed = 0;

  console.log(`Creating 50 test cases (10 per protocol, round-robin, 1-2 min apart) on ${API_BASE} ...\n`);

  for (let cycle = 0; cycle < totalPerProtocol; cycle++) {
    for (let p = 0; p < PROTOCOLS.length; p++) {
      const spec = PROTOCOLS[p];
      if (usedIndexPerProtocol[p] >= spec.reasons.length) {
        continue; // this protocol already has its 10 (e.g. the pre-existing one)
      }
      const reason = spec.reasons[usedIndexPerProtocol[p]];
      usedIndexPerProtocol[p]++;

      if (wordCount(reason) > 12) {
        console.log(`SKIP (over 12 words): "${reason}"`);
        continue;
      }

      const create = await request(jar, "/api/v1/queue", {
        method: "POST",
        body: JSON.stringify({
          istStaffId: spec.istStaffId,
          patientType: "Staff",
          channel: "Phone",
          stationCode: "DOH",
          summary: reason,
          reasonNarrative: reason,
          safetyFloorActive: false,
          slaMinutes: 20
        })
      });

      if (!create.ok) {
        failed++;
        console.log(`FAILED create (${create.status}): "${reason}"`);
      } else {
        const body = await create.json();
        const actualProtocolId = body.item?.preparedProtocol?.primaryProtocolId;
        const matched = actualProtocolId === spec.expectedProtocolId;
        created++;
        console.log(
          `[${created}/50] id=${body.item?.id} words=${wordCount(reason)} reason="${reason}" ` +
            `matched=${matched ? "YES" : "NO(" + actualProtocolId + ")"}`
        );
      }

      // No delay - all 50 created back-to-back in one shot, per explicit
      // instruction ("create all of them in one shot").
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(JSON.stringify({ created, failed, total: created + failed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
