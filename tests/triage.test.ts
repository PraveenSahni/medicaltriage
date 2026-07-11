import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function authenticatedAgent() {
  const agent = request.agent(app);
  const login = await agent
    .post("/api/v1/auth/login")
    .send({
      username: "nurse@ist.local",
      password: "DemoPass!2026",
      simulateRole: "remote_triage_nurse"
    })
    .expect(200);

  expect(login.body.accessToken).toEqual(expect.any(String));
  expect(login.body.is_mock).toBe(true);
  return agent;
}

describe("IST Qatar Phase I API", () => {
  describe("POST /api/v1/staff/validate", () => {
    it("requires authentication before staff validation", async () => {
      const response = await request(app)
        .post("/api/v1/staff/validate")
        .send({ istStaffId: "IST-1001" })
        .expect(401);

      expect(response.body.error).toBe("Authentication required");
    });

    it("validates a seeded active pilot profile and dependent list", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/staff/validate")
        .send({ istStaffId: "IST-1001" })
        .expect(200);

      expect(response.body.validated).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.profile).toMatchObject({
        istStaffId: "IST-1001",
        department: "Flight Operations",
        jobTitle: "Pilot",
        dutyStatus: "active"
      });
      expect(response.body.profile.dependents.length).toBeGreaterThanOrEqual(1);
      expect(response.body.profile.dateOfBirthIso).toEqual(expect.any(String));
    });

    it("rejects an unknown staff identifier", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/staff/validate")
        .send({ istStaffId: "IST-9999" })
        .expect(404);

      expect(response.body.validated).toBe(false);
      expect(response.body.reason).toContain("not found");
    });
  });

  describe("POST /api/v1/triage/calculate-score", () => {
    it("triggers the adult emergency safety floor before NEWS2 routing", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 135,
          respiratory_rate: 18,
          spo2: 91,
          temperature: 37.0,
          conscious_level: "A",
          ist_staff_id: "IST-1001",
          age_years: 35
        })
        .expect(200);

      expect(response.body).toMatchObject({
        score: 10,
        riskBand: "RED_ALERT",
        severity: "EMERGENCY",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        targetFacilityCode: "HAMAD_MEDICAL_CORPORATION_ADULT_ED",
        redAlertTriggered: true
      });
    });

    it("routes pediatric tachypnea to Sidra Medicine pediatric emergency care", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 100,
          respiratory_rate: 45,
          spo2: 98,
          temperature: 37.0,
          conscious_level: "A",
          ist_staff_id: "IST-1001",
          dependent_id: "dep_ist_1001_child_02",
          age_years: 35
        })
        .expect(200);

      expect(response.body).toMatchObject({
        score: 10,
        severity: "EMERGENCY",
        dispositionCode: "SIDRA_PEDIATRIC_ED",
        targetFacilityCode: "SIDRA_MEDICINE_PEDIATRIC_ED",
        redAlertTriggered: true
      });
      expect(response.body.trace).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "WHO_IMCI_RED_PEDIATRIC_TACHYPNEA_UNDER5",
            matched: true
          })
        ])
      );
      expect(response.body.patientAge).toMatchObject({
        source: "dependent",
        ageYears: 3,
        calculatedFrom: "HRMS_DATE_OF_BIRTH"
      });
    });

    it("processes stable adult vitals through standard local NEWS2 scoring", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 72,
          respiratory_rate: 16,
          spo2: 98,
          temperature: 37.0,
          conscious_level: "A",
          ist_staff_id: "IST-1001",
          age_years: 35
        })
        .expect(200);

      expect(response.body).toMatchObject({
        score: 0,
        riskBand: "HOMECARE",
        severity: "HOMECARE",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        redAlertTriggered: false
      });
    });

    it("routes abnormal age 5-12 pediatric vitals to urgent review instead of adult homecare", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 125,
          respiratory_rate: 18,
          spo2: 98,
          temperature: 37.0,
          conscious_level: "A",
          ist_staff_id: "IST-1001",
          dependent_id: "dep_ist_1001_child_01"
        })
        .expect(200);

      expect(response.body).toMatchObject({
        riskBand: "URGENT",
        severity: "URGENT",
        dispositionCode: "HMC_URGENT_REVIEW",
        redAlertTriggered: false
      });
      expect(response.body.trace).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "PEDIATRIC_WARNING_5_TO_12_HR_RR",
            matched: true
          })
        ])
      );
    });

    it("rejects manual age-only scoring because age must come from HRMS", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 72,
          respiratory_rate: 16,
          spo2: 98,
          temperature: 37.0,
          conscious_level: "A",
          age_years: 35
        })
        .expect(400);

      expect(response.body.message).toContain("Age is calculated from HRMS");
    });
  });

  describe("POST /api/v1/triage/complete", () => {
    it("compiles a bilingual SBAR note and restricts active pilot fit-to-fly status", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/triage/complete")
        .set("Accept", "application/json")
        .send({
          encounter_id: "enc-phase1-test-001",
          ist_staff_id: "IST-1001",
          nurse_id: "nurse-phase1",
          patient_age_years: 35,
          chief_complaint: "Chest tightness before duty",
          subjective: "Pilot reports severe chest tightness and sweating.",
          objective: "HR 135, SpO2 91, alert.",
          assessment: "Emergency safety floor triggered.",
          recommendation: "Immediate emergency department escalation.",
          final_disposition_code: "HMC_EMERGENCY_DEPARTMENT",
          routing_destination: "Hamad Medical Corporation (HMC) Emergency Department",
          safety_rationale: "SpO2 below 92% and heart rate above 130 bpm triggered mandatory escalation.",
          custom_aviation_tags: ["fit-to-fly-review", "duty-restriction"]
        })
        .expect(200);

      expect(response.body.fitToFlyStatus).toBe("RESTRICTED");
      expect(response.body.notePayload).toContain("SBAR");
      expect(response.body.notePayload).toContain("ملخص الحالة السريرية");
      expect(response.body.notePayload).toContain("Rules-first, AI-second");
    });
  });

  describe("POST /api/v1/triage/encounters/evaluate", () => {
    it("blocks AI downgrade, derives age from HRMS, and restricts fit-to-fly", async () => {
      const agent = await authenticatedAgent();
      const response = await agent
        .post("/api/v1/triage/encounters/evaluate")
        .send({
          istStaffId: "IST-1001",
          nurseId: "nurse-phase1",
          selectedQuestionIds: [],
          aiRecommendationSeverity: "Routine",
          symptoms: {
            chiefComplaint: "Chest tightness with sweating",
            narrative: "Caller reports chest tightness and sweating for more than one hour.",
            language: "en",
            ageYears: 9,
            durationMinutes: 75,
            redFlags: []
          },
          aviationContext: {
            crewRole: "flight_deck",
            onDuty: true,
            outstation: false,
            sicknessLeaveRequested: true
          }
        })
        .expect(200);

      expect(response.body.decision).toMatchObject({
        severity: "Emergency",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT"
      });
      expect(response.body.patientAge).toMatchObject({
        source: "staff",
        ageYears: 35,
        calculatedFrom: "HRMS_DATE_OF_BIRTH"
      });
      expect(response.body.aviation.fitToFlyStatus).toBe("restricted");
      expect(response.body.safetyAudit.overrideStatusFlag).toBe("NURSE_OVERRIDE_DOWN_BLOCKED");
      expect(response.body.decision.trace).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "AI_DOWNGRADE_BLOCKED_BY_RULES_ENGINE",
            matched: true
          })
        ])
      );
    });
  });
});
