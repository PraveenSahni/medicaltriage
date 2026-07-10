import type { DispositionCode, TriageCalculateScoreRequest } from "../types/triage.js";

export type TriageRiskBand = "RED_ALERT" | "URGENT" | "CLINIC_REVIEW" | "HOMECARE";

export type TriageScoreResult = {
  score: number;
  riskBand: TriageRiskBand;
  severity: "EMERGENCY" | "URGENT" | "ROUTINE" | "HOMECARE";
  dispositionCode: DispositionCode;
  targetFacilityCode: string;
  destinationName: string;
  routingRationale: string;
  redAlertTriggered: boolean;
  news2: {
    respiratoryRate: number;
    spo2: number;
    temperature: number;
    heartRate: number;
    consciousness: number;
    total: number;
  };
  trace: Array<{
    ruleId: string;
    matched: boolean;
    points?: number;
    rationale: string;
  }>;
};

const targetFacilityAliases: Record<DispositionCode, string> = {
  SIDRA_PEDIATRIC_ED: "SIDRA_MEDICINE_PEDIATRIC_ED",
  HMC_EMERGENCY_DEPARTMENT: "HAMAD_MEDICAL_CORPORATION_ADULT_ED",
  HMC_URGENT_REVIEW: "HAMAD_MEDICAL_CORPORATION_URGENT_REVIEW",
  IST_HIA_MIDFIELD_MEDICAL_CENTRE: "IST_HIA_MIDFIELD_MEDICAL_CENTRE",
  IST_OLD_AIRPORT_MEDICAL_COMMISSION: "IST_OLD_AIRPORT_MEDICAL_COMMISSION",
  PHCC_URGENT_CARE_OR_TELECONSULT: "PHCC_URGENT_CARE_OR_TELECONSULT",
  OUTSTATION_TELECONSULT_ESCALATION: "OUTSTATION_TELECONSULT_ESCALATION",
  SELF_CARE_WITH_CALLBACK_PRECAUTIONS: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS"
};

function targetFacilityCode(dispositionCode: DispositionCode): string {
  return targetFacilityAliases[dispositionCode];
}

function emergencyDestination(ageYears?: number): Pick<TriageScoreResult, "dispositionCode" | "destinationName" | "targetFacilityCode"> {
  if (typeof ageYears === "number" && ageYears < 18) {
    return {
      dispositionCode: "SIDRA_PEDIATRIC_ED",
      targetFacilityCode: targetFacilityCode("SIDRA_PEDIATRIC_ED"),
      destinationName: "Sidra Medicine Emergency Department"
    };
  }

  return {
    dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
    targetFacilityCode: targetFacilityCode("HMC_EMERGENCY_DEPARTMENT"),
    destinationName: "Hamad Medical Corporation (HMC) Emergency Department"
  };
}

function scoreRespiratoryRate(value: number): number {
  if (value <= 8) return 3;
  if (value <= 11) return 1;
  if (value <= 20) return 0;
  if (value <= 24) return 2;
  return 3;
}

function scoreSpo2(value: number): number {
  if (value <= 91) return 3;
  if (value <= 93) return 2;
  if (value <= 95) return 1;
  return 0;
}

function scoreTemperature(value: number): number {
  if (value <= 35) return 3;
  if (value <= 36) return 1;
  if (value <= 38) return 0;
  if (value <= 39) return 1;
  return 2;
}

function scoreHeartRate(value: number): number {
  if (value <= 40) return 3;
  if (value <= 50) return 1;
  if (value <= 90) return 0;
  if (value <= 110) return 1;
  if (value <= 130) return 2;
  return 3;
}

function dispositionForNews2Score(score: number): Pick<TriageScoreResult, "riskBand" | "severity" | "dispositionCode" | "targetFacilityCode" | "destinationName" | "routingRationale"> {
  if (score >= 7) {
    return {
      riskBand: "RED_ALERT",
      severity: "EMERGENCY",
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      targetFacilityCode: targetFacilityCode("HMC_EMERGENCY_DEPARTMENT"),
      destinationName: "Hamad Medical Corporation (HMC) Emergency Department",
      routingRationale: "NEWS2 high-risk score requires emergency department escalation."
    };
  }

  if (score >= 5) {
    return {
      riskBand: "URGENT",
      severity: "URGENT",
      dispositionCode: "HMC_URGENT_REVIEW",
      targetFacilityCode: targetFacilityCode("HMC_URGENT_REVIEW"),
      destinationName: "HMC urgent review pathway",
      routingRationale: "NEWS2 medium-risk score requires urgent clinical review."
    };
  }

  if (score >= 1) {
    return {
      riskBand: "CLINIC_REVIEW",
      severity: "ROUTINE",
      dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
      targetFacilityCode: targetFacilityCode("PHCC_URGENT_CARE_OR_TELECONSULT"),
      destinationName: "PHCC urgent care or IST teleconsult booking",
      routingRationale: "NEWS2 low-medium score is suitable for clinic or teleconsult review when no red floor is present."
    };
  }

  return {
    riskBand: "HOMECARE",
    severity: "HOMECARE",
    dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
    targetFacilityCode: targetFacilityCode("SELF_CARE_WITH_CALLBACK_PRECAUTIONS"),
    destinationName: "Self-care with callback precautions",
    routingRationale: "NEWS2 low-risk score and no mandatory red floor detected."
  };
}

export function calculateTriageScore(vitals: TriageCalculateScoreRequest): TriageScoreResult {
  const redFloorTrace = [
    {
      ruleId: "IITT_RED_MENTAL_STATUS",
      matched: vitals.consciousLevel !== "alert",
      rationale: "AVPU/conscious level other than Alert is a mandatory RED override."
    },
    {
      ruleId: "IITT_RED_LOW_SPO2",
      matched: vitals.spo2 < 92,
      rationale: "SpO2 below 92% is a mandatory RED override."
    },
    {
      ruleId: "IITT_RED_RESPIRATORY_RATE",
      matched: vitals.respiratoryRate < 10 || vitals.respiratoryRate > 30,
      rationale: "Respiratory rate below 10 or above 30 breaths/minute is a mandatory RED override."
    },
    {
      ruleId: "WHO_IMCI_RED_PEDIATRIC_TACHYPNEA_UNDER5",
      matched:
        typeof vitals.ageYears === "number" &&
        vitals.ageYears < 5 &&
        vitals.respiratoryRate >= 40,
      rationale: "Child under 5 with tachypnea requires pediatric emergency safety-floor handling."
    },
    {
      ruleId: "IITT_RED_HEART_RATE",
      matched: vitals.heartRate < 60 || vitals.heartRate > 130,
      rationale: "Heart rate below 60 or above 130 beats/minute is a mandatory RED override."
    }
  ];

  const respiratoryRate = scoreRespiratoryRate(vitals.respiratoryRate);
  const spo2 = scoreSpo2(vitals.spo2);
  const temperature = scoreTemperature(vitals.temperatureC);
  const heartRate = scoreHeartRate(vitals.heartRate);
  const consciousness = vitals.consciousLevel === "alert" ? 0 : 3;
  const total = respiratoryRate + spo2 + temperature + heartRate + consciousness;

  const redAlertTriggered = redFloorTrace.some((item) => item.matched);
  if (redAlertTriggered) {
    const destination = emergencyDestination(vitals.ageYears);
    return {
      score: 10,
      riskBand: "RED_ALERT",
      severity: "EMERGENCY",
      ...destination,
      routingRationale:
        "Mandatory clinical safety floor triggered before NEWS2 routing. The encounter must be escalated to emergency care.",
      redAlertTriggered: true,
      news2: { respiratoryRate, spo2, temperature, heartRate, consciousness, total },
      trace: redFloorTrace
    };
  }

  const routed = dispositionForNews2Score(total);
  return {
    score: total,
    ...routed,
    redAlertTriggered: false,
    news2: { respiratoryRate, spo2, temperature, heartRate, consciousness, total },
    trace: [
      ...redFloorTrace,
      {
        ruleId: "NEWS2_MOCK_SCORE",
        matched: true,
        points: total,
        rationale:
          "NEWS2 scoring is mocked locally for Phase I. Production must validate the algorithm and clinical thresholds before go-live."
      }
    ]
  };
}
