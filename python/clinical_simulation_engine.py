"""End-to-end synthetic clinical triage simulation framework for IST Tech.

This module implements the four simulation modules requested in the master
prompt:

1. EmployeeSimulator
2. VectorKnowledgeEngine
3. TriageNurseSimulator
4. EMRWritebackEngine

All data is synthetic. The engine is designed for rules-first safety testing,
Oracle Fusion HCM adapter development, AI copilot evaluation, and demo data
generation. It is not a clinical authority, does not process PHI, and does not
write to a live EMR.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Literal, Optional, Sequence

from generate_synthetic_pdp_data import generate_dataset


Severity = Literal["EMERGENCY", "URGENT", "ROUTINE", "HOMECARE"]
FitToFlyStatus = Literal["RESTRICTED", "CLEARED", "NOT_APPLICABLE", "MEDICAL_REVIEW_REQUIRED"]
BiologicalSex = Literal["FEMALE", "MALE", "OTHER", "UNKNOWN"]


@dataclass(frozen=True)
class PatientVitals:
    heart_rate: int
    respiratory_rate: int
    spo2: float
    temperature_c: float
    conscious_level: Literal["A", "V", "P", "U"] = "A"

    def as_dict(self) -> Dict[str, Any]:
        return {
            "heart_rate": self.heart_rate,
            "respiratory_rate": self.respiratory_rate,
            "spo2": self.spo2,
            "temperature_c": self.temperature_c,
            "conscious_level": self.conscious_level,
        }


@dataclass(frozen=True)
class SimulatedPatientCase:
    case_id: str
    name: str
    ist_staff_id: str
    symptom_text: str
    symptom_vector: List[float]
    vitals: PatientVitals
    patient_age_years: int
    patient_age_months: Optional[int] = None
    biological_sex: BiologicalSex = "UNKNOWN"
    patient_context: Optional[Dict[str, Any]] = None
    minimum_severity: Optional[Severity] = None
    dependent_id: Optional[str] = None
    ai_suggested_severity: Severity = "HOMECARE"
    nurse_override_rationale: Optional[str] = None
    recent_vaccination_hours: Optional[int] = None
    sickness_leave_requested: bool = False


class EmployeeSimulator:
    """Scale-modeled synthetic Oracle HCM employee/dependent simulator."""

    def __init__(self, aircraft_count: int = 260, encounter_count: int = 5000, seed: int = 20260711) -> None:
        self.aircraft_count = aircraft_count
        self.encounter_count = encounter_count
        self.seed = seed
        self.dataset = generate_dataset(aircraft_count=aircraft_count, encounter_count=encounter_count, seed=seed)
        self.staff_members: List[Dict[str, Any]] = self.dataset["staff_members"]
        self.dependents: List[Dict[str, Any]] = self.dataset["dependents"]
        self.oracle_hcm_api: Dict[str, Any] = self.dataset["oracle_fusion_hcm_api"]
        self.staff_by_number = {staff["ist_staff_id"]: staff for staff in self.staff_members}
        self.staff_by_id = {staff["id"]: staff for staff in self.staff_members}
        self.dependents_by_staff: Dict[str, List[Dict[str, Any]]] = {}
        for dependent in self.dependents:
            self.dependents_by_staff.setdefault(dependent["staff_member_id"], []).append(dependent)

    def validate_staff(self, ist_staff_id: str) -> Dict[str, Any]:
        staff = self.staff_by_number.get(ist_staff_id)
        if not staff:
            return {"valid": False, "reason": "Synthetic Oracle HCM feed did not contain this PersonNumber."}

        dependents = self.dependents_by_staff.get(staff["id"], [])
        return {
            "valid": True,
            "source": "synthetic_oracle_fusion_hcm_api",
            "profile": staff,
            "dependents": dependents,
        }

    def find_dependent(self, ist_staff_id: str, dependent_id: str) -> Optional[Dict[str, Any]]:
        validation = self.validate_staff(ist_staff_id)
        if not validation["valid"]:
            return None
        return next((item for item in validation["dependents"] if item["id"] == dependent_id), None)

    def _find_staff(self, predicate: Any) -> Dict[str, Any]:
        for staff in self.staff_members:
            if predicate(staff):
                return staff
        raise LookupError("No matching synthetic staff record found")

    def active_pilot(self) -> Dict[str, Any]:
        return self._find_staff(
            lambda staff: staff["department"] == "Flight Operations" and staff["duty_status"] == "ACTIVE"
        )

    def active_cabin_crew(self) -> Dict[str, Any]:
        return self._find_staff(
            lambda staff: staff["department"] == "Inflight Services" and staff["duty_status"] == "ACTIVE"
        )

    def engineer_with_young_dependent(self) -> tuple[Dict[str, Any], Dict[str, Any]]:
        for dependent in self.dependents:
            staff = self.staff_by_id[dependent["staff_member_id"]]
            if staff["department"] == "Engineering" and int(dependent["age"]) <= 4:
                return staff, dependent
        for dependent in self.dependents:
            if int(dependent["age"]) <= 4:
                return self.staff_by_id[dependent["staff_member_id"]], dependent
        raise LookupError("No synthetic dependent under 5 was generated")


class VectorKnowledgeEngine:
    """Five-dimensional vector knowledge retrieval engine with safe fallback."""

    threshold = 0.70

    def __init__(self) -> None:
        self.anchors = {
            "ACUTE_CHEST_PAIN": {
                "title": "Chest Pain or Tightness - Adult",
                "vector": [0.95, 0.20, 0.10, 0.10, 0.10],
            },
            "PEDIATRIC_COUGH": {
                "title": "Pediatric Cough or Respiratory Distress",
                "vector": [0.12, 0.94, 0.05, 0.22, 0.08],
            },
            "LOWER_BACK_PAIN": {
                "title": "Lower Back Pain or Strain",
                "vector": [0.05, 0.06, 0.95, 0.08, 0.22],
            },
            "VACCINE_FEVER": {
                "title": "Post-Vaccination Fever or Reaction",
                "vector": [0.08, 0.10, 0.20, 0.94, 0.18],
            },
            "PEDIATRIC_FEVER_DEHYDRATION": {
                "title": "Pediatric Fever, Vomiting, or Dehydration",
                "vector": [0.05, 0.45, 0.10, 0.88, 0.22],
            },
            "FEMALE_HEALTH": {
                "title": "Female Health Concern",
                "vector": [0.10, 0.05, 0.30, 0.30, 0.88],
            },
            "MALE_HEALTH": {
                "title": "Male Health Concern",
                "vector": [0.05, 0.04, 0.55, 0.05, 0.82],
            },
            "PILOT_EAR_BAROTRAUMA": {
                "title": "Ear Pain or Barotrauma - Flight Crew",
                "vector": [0.06, 0.16, 0.10, 0.10, 0.94],
            },
            "UNKNOWN_SYMPTOM": {
                "title": "No Guideline Available",
                "vector": [0.0, 0.0, 0.0, 0.0, 0.0],
            },
        }

    @staticmethod
    def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
        dot = sum(a * b for a, b in zip(left, right))
        left_norm = math.sqrt(sum(a * a for a in left))
        right_norm = math.sqrt(sum(b * b for b in right))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return dot / (left_norm * right_norm)

    def match(self, symptom_vector: Sequence[float]) -> Dict[str, Any]:
        best_code = "UNKNOWN_SYMPTOM"
        best_score = 0.0
        for code, anchor in self.anchors.items():
            if code == "UNKNOWN_SYMPTOM":
                continue
            score = self.cosine_similarity(symptom_vector, anchor["vector"])
            if score > best_score:
                best_score = score
                best_code = code

        if best_score < self.threshold:
            best_code = "UNKNOWN_SYMPTOM"
            return {
                "codebook_node": best_code,
                "title": self.anchors[best_code]["title"],
                "cosine_similarity": round(best_score, 4),
                "accepted": False,
                "threshold": self.threshold,
            }

        return {
            "codebook_node": best_code,
            "title": self.anchors[best_code]["title"],
            "cosine_similarity": round(best_score, 4),
            "accepted": True,
            "threshold": self.threshold,
        }


class TriageNurseSimulator:
    """Automated state machine that simulates nurse triage actions."""

    def __init__(self, employee_simulator: EmployeeSimulator, knowledge_engine: VectorKnowledgeEngine) -> None:
        self.employee_simulator = employee_simulator
        self.knowledge_engine = knowledge_engine

    @staticmethod
    def news2_score(vitals: PatientVitals) -> int:
        score = 0
        rr = vitals.respiratory_rate
        if rr <= 8 or rr >= 25:
            score += 3
        elif rr <= 11:
            score += 1
        elif rr >= 21:
            score += 2

        spo2 = vitals.spo2
        if spo2 <= 91:
            score += 3
        elif spo2 <= 93:
            score += 2
        elif spo2 <= 95:
            score += 1

        hr = vitals.heart_rate
        if hr <= 40 or hr >= 131:
            score += 3
        elif hr <= 50:
            score += 1
        elif hr <= 90:
            score += 0
        elif hr <= 110:
            score += 1
        elif hr <= 130:
            score += 2

        temp = vitals.temperature_c
        if temp <= 35.0:
            score += 3
        elif temp <= 36.0:
            score += 1
        elif temp <= 38.0:
            score += 0
        elif temp <= 39.0:
            score += 1
        else:
            score += 2

        if vitals.conscious_level != "A":
            score += 3
        return score

    @staticmethod
    def _pediatric_tachypnea_threshold(age_months: Optional[int]) -> Optional[int]:
        if age_months is None:
            return None
        if age_months < 2:
            return 60
        if age_months <= 11:
            return 50
        if age_months <= 59:
            return 40
        return None

    def safety_floor(self, case: SimulatedPatientCase) -> Dict[str, Any]:
        vitals = case.vitals
        reasons: List[str] = []
        pediatric_threshold = self._pediatric_tachypnea_threshold(case.patient_age_months)

        if vitals.conscious_level != "A":
            reasons.append("Conscious level is not Alert.")
        if vitals.spo2 < 92:
            reasons.append("SpO2 below 92% triggers mandatory RED alert.")

        if pediatric_threshold is not None:
            if vitals.respiratory_rate >= pediatric_threshold:
                reasons.append(
                    f"Pediatric tachypnea: RR {vitals.respiratory_rate} >= {pediatric_threshold} for age band."
                )
        else:
            if vitals.respiratory_rate < 10 or vitals.respiratory_rate > 30:
                reasons.append("Adult respiratory rate outside 10-30 triggers mandatory RED alert.")
            if vitals.heart_rate < 60 or vitals.heart_rate > 130:
                reasons.append("Adult heart rate outside 60-130 triggers mandatory RED alert.")

        return {
            "override_triggered": bool(reasons),
            "reasons": reasons,
            "score": 10 if reasons else self.news2_score(vitals),
        }

    @staticmethod
    def severity_for(score: int, override: bool, protocol_code: str) -> Severity:
        if override or score >= 7:
            return "EMERGENCY"
        if score >= 5:
            return "URGENT"
        if protocol_code in {"PEDIATRIC_FEVER_DEHYDRATION", "FEMALE_HEALTH", "MALE_HEALTH"}:
            return "URGENT" if protocol_code == "MALE_HEALTH" else "ROUTINE"
        if protocol_code in {"LOWER_BACK_PAIN", "PILOT_EAR_BAROTRAUMA", "VACCINE_FEVER"}:
            return "HOMECARE" if protocol_code == "VACCINE_FEVER" else "ROUTINE"
        if score >= 1:
            return "ROUTINE"
        return "HOMECARE"

    @staticmethod
    def max_severity(left: Severity, right: Optional[Severity]) -> Severity:
        if right is None:
            return left
        rank = {"HOMECARE": 1, "ROUTINE": 2, "URGENT": 3, "EMERGENCY": 4}
        return right if rank[right] > rank[left] else left

    @staticmethod
    def route_for(case: SimulatedPatientCase, staff: Dict[str, Any], severity: Severity) -> str:
        if severity == "EMERGENCY" and case.patient_age_years < 18:
            return "Sidra Medicine Pediatric ED"
        if severity == "EMERGENCY":
            return "Hamad Medical Corporation Adult ED"
        if staff["department"] in {"Flight Operations", "Inflight Services"} and (
            severity != "HOMECARE" or case.sickness_leave_requested
        ):
            return "IST Medical Centre (HIA Midfield Area)"
        if severity == "URGENT":
            return "PHCC Urgent Care Center"
        if severity == "ROUTINE":
            return "IST Medical Centre (HIA Midfield Area)"
        return "Home Care Advice / Self-Care"

    @staticmethod
    def fit_to_fly_for(case: SimulatedPatientCase, staff: Dict[str, Any], severity: Severity) -> FitToFlyStatus:
        crew = staff["department"] in {"Flight Operations", "Inflight Services"}
        if not crew:
            return "NOT_APPLICABLE"
        if case.recent_vaccination_hours is not None and case.recent_vaccination_hours <= 24:
            return "RESTRICTED"
        if case.sickness_leave_requested or severity != "HOMECARE":
            return "RESTRICTED"
        return "CLEARED"

    @staticmethod
    def ai_downgrade_blocked(ai_severity: Severity, final_severity: Severity) -> bool:
        rank = {"HOMECARE": 1, "ROUTINE": 2, "URGENT": 3, "EMERGENCY": 4}
        return rank[ai_severity] < rank[final_severity]

    def run_case(self, case: SimulatedPatientCase) -> Dict[str, Any]:
        transition_log: List[Dict[str, Any]] = []
        encounter_id = f"sim-enc-{uuid.uuid4()}"

        validation = self.employee_simulator.validate_staff(case.ist_staff_id)
        if not validation["valid"]:
            raise ValueError(f"Unable to verify staff ID {case.ist_staff_id}")
        staff = validation["profile"]
        dependent = self.employee_simulator.find_dependent(case.ist_staff_id, case.dependent_id) if case.dependent_id else None

        transition_log.append(
            {
                "state": "Patient Verification",
                "output": {
                    "validated": True,
                    "ist_staff_id": case.ist_staff_id,
                    "department": staff["department"],
                    "job_title": staff["job_title"],
                    "dependent_id": dependent["id"] if dependent else None,
                },
            }
        )

        protocol = self.knowledge_engine.match(case.symptom_vector)
        transition_log.append({"state": "Chief Complaint Mapping", "output": protocol})

        safety = self.safety_floor(case)
        transition_log.append({"state": "WHO/IITT Safety Floor", "output": safety})

        score = safety["score"]
        if not safety["override_triggered"]:
            news2 = self.news2_score(case.vitals)
            if protocol["codebook_node"] == "LOWER_BACK_PAIN":
                score = max(news2, 1)
            transition_log.append({"state": "Stable NEWS2 Calculation", "output": {"news2": news2, "score": score}})

        severity = self.severity_for(score, safety["override_triggered"], protocol["codebook_node"])
        severity = self.max_severity(severity, case.minimum_severity)
        route = self.route_for(case, staff, severity)
        fit_to_fly = self.fit_to_fly_for(case, staff, severity)
        aviation_output = {
            "fit_to_fly_status": fit_to_fly,
            "sickness_leave_requested": case.sickness_leave_requested,
            "vaccine_rest_period_hours": 24 if case.recent_vaccination_hours is not None and fit_to_fly == "RESTRICTED" else 0,
        }
        transition_log.append({"state": "Aviation Medicine Gate", "output": aviation_output})

        downgrade_blocked = self.ai_downgrade_blocked(case.ai_suggested_severity, severity)
        result = {
            "encounter_id": encounter_id,
            "synthetic": True,
            "case_id": case.case_id,
            "case_name": case.name,
            "staff": staff,
            "dependent": dependent,
            "patient_age_years": case.patient_age_years,
            "biological_sex": case.biological_sex,
            "patient_context": case.patient_context or {},
            "symptom_text": case.symptom_text,
            "vitals": case.vitals.as_dict(),
            "protocol": protocol,
            "safety_floor": safety,
            "score": score,
            "severity": severity,
            "route": route,
            "fit_to_fly_status": fit_to_fly,
            "ai_suggested_severity": case.ai_suggested_severity,
            "ai_downgrade_blocked": downgrade_blocked,
            "nurse_override_rationale": case.nurse_override_rationale,
            "transition_log": transition_log,
        }
        return result


class EMRWritebackEngine:
    """Simulated FHIR transaction and immutable audit logger."""

    def __init__(self) -> None:
        self.transactions: List[Dict[str, Any]] = []
        self.safety_audit_deviation_logs: List[Dict[str, Any]] = []

    @staticmethod
    def compile_sbar(result: Dict[str, Any]) -> str:
        staff = result["staff"]
        patient_label = result["dependent"]["full_name"] if result.get("dependent") else f"Staff {staff['ist_staff_id']}"
        english = (
            "### Clinical Encounter Summary (SBAR)\n"
            f"**S (Situation):** {patient_label} reports {result['symptom_text']}.\n"
            f"**B (Background):** Department {staff['department']}; job title {staff['job_title']}; "
            f"age {result['patient_age_years']}.\n"
            f"**A (Assessment):** Score {result['score']}; severity {result['severity']}; "
            f"fit-to-fly {result['fit_to_fly_status']}.\n"
            f"**R (Recommendation):** Route to {result['route']}. Nurse approval required."
        )
        arabic = (
            "### ملخص الحالة السريرية (SBAR)\n"
            f"**الوضع:** {patient_label} - {result['symptom_text']}.\n"
            f"**الخلفية:** القسم {staff['department']}؛ المسمى الوظيفي {staff['job_title']}؛ "
            f"العمر {result['patient_age_years']}.\n"
            f"**التقييم:** الدرجة {result['score']}؛ مستوى الخطورة {result['severity']}؛ "
            f"حالة الطيران {result['fit_to_fly_status']}.\n"
            f"**التوصية:** التحويل إلى {result['route']}. اعتماد الممرض/الممرضة مطلوب."
        )
        return f"{english}\n\n---\n\n{arabic}"

    @staticmethod
    def fhir_transaction(result: Dict[str, Any], sbar_note: str) -> Dict[str, Any]:
        encounter_id = result["encounter_id"]
        staff = result["staff"]
        observations = []
        for code, value, unit in [
            ("heart-rate", result["vitals"]["heart_rate"], "beats/min"),
            ("respiratory-rate", result["vitals"]["respiratory_rate"], "breaths/min"),
            ("oxygen-saturation", result["vitals"]["spo2"], "%"),
            ("body-temperature", result["vitals"]["temperature_c"], "Cel"),
        ]:
            observations.append(
                {
                    "resourceType": "Observation",
                    "id": f"{encounter_id}-{code}",
                    "status": "final",
                    "code": {"text": code},
                    "subject": {"reference": f"Patient/{staff['ist_staff_id']}"},
                    "encounter": {"reference": f"Encounter/{encounter_id}"},
                    "valueQuantity": {"value": value, "unit": unit},
                }
            )

        entries = [
            {
                "request": {"method": "POST", "url": "Encounter"},
                "resource": {
                    "resourceType": "Encounter",
                    "id": encounter_id,
                    "status": "finished",
                    "class": {"code": "VR", "display": "virtual"},
                    "subject": {"reference": f"Patient/{staff['ist_staff_id']}"},
                    "serviceProvider": {"display": "IST Tech Tele-Triage"},
                },
            },
            *[
                {"request": {"method": "POST", "url": "Observation"}, "resource": observation}
                for observation in observations
            ],
            {
                "request": {"method": "POST", "url": "ClinicalImpression"},
                "resource": {
                    "resourceType": "ClinicalImpression",
                    "id": f"{encounter_id}-impression",
                    "status": "completed",
                    "subject": {"reference": f"Patient/{staff['ist_staff_id']}"},
                    "encounter": {"reference": f"Encounter/{encounter_id}"},
                    "summary": sbar_note,
                    "finding": [
                        {"itemCodeableConcept": {"text": result["protocol"]["title"]}},
                        {"itemCodeableConcept": {"text": result["route"]}},
                    ],
                },
            },
        ]
        return {"resourceType": "Bundle", "type": "transaction", "entry": entries}

    def commit(self, result: Dict[str, Any]) -> Dict[str, Any]:
        sbar_note = self.compile_sbar(result)
        transaction = self.fhir_transaction(result, sbar_note)
        writeback = {
            "synthetic": True,
            "committed_at": datetime.now(timezone.utc).isoformat(),
            "encounter_id": result["encounter_id"],
            "sbar_markdown": sbar_note,
            "fhir_transaction": transaction,
        }
        self.transactions.append(writeback)

        if result["ai_downgrade_blocked"] or result.get("nurse_override_rationale"):
            audit = {
                "id": str(uuid.uuid4()),
                "encounter_id": result["encounter_id"],
                "original_ai_recommendation": result["ai_suggested_severity"],
                "rules_engine_severity": result["severity"],
                "override_status_flag": "NURSE_OVERRIDE_UP" if result["ai_downgrade_blocked"] else "REVIEW_REQUIRED",
                "nurse_override_rationale": result.get("nurse_override_rationale")
                or "AI recommendation was lower than deterministic clinical or aviation safety floor.",
                "explainability_trace": {
                    "synthetic": True,
                    "protocol": result["protocol"],
                    "safety_floor": result["safety_floor"],
                    "fit_to_fly_status": result["fit_to_fly_status"],
                    "route": result["route"],
                    "pdppl_audit_ready": True,
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            self.safety_audit_deviation_logs.append(audit)
            writeback["safety_audit_deviation_log"] = audit

        return writeback


def build_demo_cases(employee_simulator: EmployeeSimulator) -> List[SimulatedPatientCase]:
    pilot = employee_simulator.active_pilot()
    engineer, child = employee_simulator.engineer_with_young_dependent()
    cabin = employee_simulator.active_cabin_crew()

    return [
        SimulatedPatientCase(
            case_id="CASE_A_CARDIOVASCULAR_EMERGENCY",
            name="Active pilot with crushing chest pain and low oxygen saturation",
            ist_staff_id=pilot["ist_staff_id"],
            symptom_text="Crushing chest pain radiating to left arm with sweating before duty.",
            symptom_vector=[0.98, 0.22, 0.04, 0.04, 0.03],
            vitals=PatientVitals(heart_rate=136, respiratory_rate=31, spo2=91, temperature_c=36.8),
            patient_age_years=44,
            ai_suggested_severity="ROUTINE",
            sickness_leave_requested=True,
        ),
        SimulatedPatientCase(
            case_id="CASE_B_PEDIATRIC_COUGH",
            name="Two-year-old dependent with tachypnea and barking cough",
            ist_staff_id=engineer["ist_staff_id"],
            dependent_id=child["id"],
            symptom_text="Barking cough with stridor and struggling for breath.",
            symptom_vector=[0.08, 0.98, 0.02, 0.18, 0.04],
            vitals=PatientVitals(heart_rate=112, respiratory_rate=45, spo2=95, temperature_c=38.4),
            patient_age_years=2,
            patient_age_months=24,
            ai_suggested_severity="URGENT",
        ),
        SimulatedPatientCase(
            case_id="CASE_C_STABLE_CABIN_CREW_BACK_PAIN",
            name="Active cabin crew with stable lower back pain",
            ist_staff_id=cabin["ist_staff_id"],
            symptom_text="Lower back strain after lifting heavy galley cart during descent.",
            symptom_vector=[0.03, 0.03, 0.98, 0.04, 0.12],
            vitals=PatientVitals(heart_rate=72, respiratory_rate=14, spo2=99, temperature_c=36.6),
            patient_age_years=29,
            ai_suggested_severity="HOMECARE",
            sickness_leave_requested=True,
        ),
    ]


def run_end_to_end_suite(
    aircraft_count: int = 260,
    encounter_count: int = 5000,
    seed: int = 20260711,
) -> Dict[str, Any]:
    employees = EmployeeSimulator(aircraft_count=aircraft_count, encounter_count=encounter_count, seed=seed)
    knowledge = VectorKnowledgeEngine()
    triage = TriageNurseSimulator(employees, knowledge)
    emr = EMRWritebackEngine()

    cases = build_demo_cases(employees)
    results = []
    for case in cases:
        triage_result = triage.run_case(case)
        writeback = emr.commit(triage_result)
        results.append({"triage": triage_result, "writeback": writeback})

    return {
        "synthetic": True,
        "employee_source": "oracle_fusion_hcm_api",
        "statistics": employees.dataset["statistics"],
        "cases": results,
        "audit_log_count": len(emr.safety_audit_deviation_logs),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the complete IST Tech clinical triage simulation framework.")
    parser.add_argument("--aircraft", type=int, default=260)
    parser.add_argument("--encounters", type=int, default=5000)
    parser.add_argument("--seed", type=int, default=20260711)
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()

    suite = run_end_to_end_suite(aircraft_count=args.aircraft, encounter_count=args.encounters, seed=args.seed)
    if args.summary:
        print(
            json.dumps(
                {
                    "synthetic": suite["synthetic"],
                    "employee_source": suite["employee_source"],
                    "statistics": suite["statistics"],
                    "case_outcomes": [
                        {
                            "case_id": item["triage"]["case_id"],
                            "severity": item["triage"]["severity"],
                            "route": item["triage"]["route"],
                            "fit_to_fly_status": item["triage"]["fit_to_fly_status"],
                            "fhir_entries": len(item["writeback"]["fhir_transaction"]["entry"]),
                        }
                        for item in suite["cases"]
                    ],
                    "audit_log_count": suite["audit_log_count"],
                },
                indent=2,
                ensure_ascii=False,
            )
        )
    else:
        print(json.dumps(suite, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
