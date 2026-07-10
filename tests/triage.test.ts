import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("IST Qatar Phase I API", () => {
  describe("POST /api/v1/staff/validate", () => {
    it("validates a seeded active pilot profile and dependent list", async () => {
      const response = await request(app)
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
      expect(response.body.profile.dependents).toHaveLength(1);
    });

    it("rejects an unknown staff identifier", async () => {
      const response = await request(app)
        .post("/api/v1/staff/validate")
        .send({ istStaffId: "IST-9999" })
        .expect(404);

      expect(response.body.validated).toBe(false);
      expect(response.body.reason).toContain("not found");
    });
  });

  describe("POST /api/v1/triage/calculate-score", () => {
    it("triggers the adult emergency safety floor before NEWS2 routing", async () => {
      const response = await request(app)
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 135,
          respiratory_rate: 18,
          spo2: 91,
          temperature: 37.0,
          conscious_level: "A",
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
      const response = await request(app)
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 100,
          respiratory_rate: 45,
          spo2: 98,
          temperature: 37.0,
          conscious_level: "A",
          age_years: 3
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
    });

    it("processes stable adult vitals through standard local NEWS2 scoring", async () => {
      const response = await request(app)
        .post("/api/v1/triage/calculate-score")
        .send({
          heart_rate: 72,
          respiratory_rate: 16,
          spo2: 98,
          temperature: 37.0,
          conscious_level: "A",
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
  });

  describe("POST /api/v1/triage/complete", () => {
    it("compiles a bilingual SBAR note and restricts active pilot fit-to-fly status", async () => {
      const response = await request(app)
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
});
