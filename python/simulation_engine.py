"""Synthetic discrete-state simulation engine for IST Tech tele-triage.

This module intentionally uses synthetic inputs only. It is suitable for
simulation, regression testing, prompt evaluation, and governed AI-copilot
training datasets. It is not a source of clinical truth and must not be mixed
with real patient records or PHI.
"""

from __future__ import annotations

import argparse
import json
import math
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Literal, Optional


Severity = Literal["EMERGENCY", "URGENT", "ROUTINE", "HOMECARE"]


@dataclass(frozen=True)
class ProtocolAnchor:
    node: str
    protocol_id: str
    title_en: str
    vector: List[float]


@dataclass(frozen=True)
class Vitals:
    heart_rate: int
    respiratory_rate: int
    spo2: float
    temperature_c: float
    conscious_level: Literal["A", "V", "P", "U"] = "A"


@dataclass(frozen=True)
class Scenario:
    scenario_id: str
    name: str
    ist_staff_id: str
    role: Literal["Pilot", "Cabin Crew", "Ground Staff", "Dependent", "Operations"]
    age_years: int
    symptom_text: str
    vitals: Vitals
    symptom_vector: Optional[List[float]] = None
    outstation: bool = False
    on_duty: bool = False
    sickness_leave_requested: bool = False
    recent_vaccination_hours: Optional[int] = None


VECTOR_THRESHOLD = 0.70

PROTOCOL_ANCHORS = [
    ProtocolAnchor("ACUTE_CHEST_PAIN", "sample-chest-pain-adult", "Chest Pain or Tightness - Adult", [0.95, 0.20, 0.10, 0.10, 0.10]),
    ProtocolAnchor("PEDIATRIC_RESPIRATORY", "sample-breathing-problem", "Shortness of Breath or Breathing Difficulty", [0.12, 0.92, 0.05, 0.25, 0.08]),
    ProtocolAnchor("LOWER_BACK_PAIN", "sample-abdominal-pain", "Abdominal Pain or Back Pain", [0.05, 0.06, 0.95, 0.08, 0.22]),
    ProtocolAnchor("VACCINE_REACTION", "sample-rash-vaccine-reaction", "Rash, Swelling, or Vaccination Reaction", [0.08, 0.10, 0.20, 0.94, 0.18]),
    ProtocolAnchor("FEVER_CHILD", "sample-fever-child", "Fever - Child", [0.08, 0.35, 0.06, 0.80, 0.12]),
]


SCENARIOS = [
    Scenario(
        scenario_id="sim-cardiac-pilot-red",
        name="Active pilot with chest pain and low oxygen saturation",
        ist_staff_id="SIM-1001",
        role="Pilot",
        age_years=44,
        symptom_text="Crushing chest pain, sweating, and shortness of breath before flight duty.",
        symptom_vector=[0.98, 0.32, 0.02, 0.08, 0.05],
        vitals=Vitals(heart_rate=135, respiratory_rate=28, spo2=91, temperature_c=36.8),
        on_duty=True,
        sickness_leave_requested=True,
    ),
    Scenario(
        scenario_id="sim-child-tachypnea-red",
        name="Dependent child with cough and WHO pediatric tachypnea",
        ist_staff_id="SIM-2009",
        role="Dependent",
        age_years=3,
        symptom_text="Continuous barking cough, breathing difficulty, and grunting sounds.",
        symptom_vector=[0.10, 0.94, 0.02, 0.20, 0.05],
        vitals=Vitals(heart_rate=110, respiratory_rate=45, spo2=96, temperature_c=38.5),
    ),
    Scenario(
        scenario_id="sim-cabin-back-pain-routine",
        name="Cabin crew with stable lower back pain and fit-to-fly review",
        ist_staff_id="SIM-7842",
        role="Cabin Crew",
        age_years=29,
        symptom_text="Dull ache in lower back after lifting a galley cart, no numbness or weakness.",
        symptom_vector=[0.02, 0.02, 0.96, 0.04, 0.12],
        vitals=Vitals(heart_rate=68, respiratory_rate=14, spo2=99, temperature_c=36.6),
        on_duty=True,
        sickness_leave_requested=True,
    ),
    Scenario(
        scenario_id="sim-vaccine-ground-homecare",
        name="Ground staff with mild post-vaccination symptoms",
        ist_staff_id="SIM-9901",
        role="Ground Staff",
        age_years=33,
        symptom_text="Mandated booster yesterday, sore arm and slight fever without breathing symptoms.",
        symptom_vector=[0.05, 0.05, 0.12, 0.90, 0.08],
        vitals=Vitals(heart_rate=82, respiratory_rate=16, spo2=98, temperature_c=37.9),
        recent_vaccination_hours=24,
    ),
]


def cosine_similarity(left: List[float], right: List[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def vectorize_symptom_text(text: str) -> List[float]:
    lowered = text.lower()
    vector = [0.0, 0.0, 0.0, 0.0, 0.0]
    buckets = [
        (0, ["chest", "tight", "sweat", "heart"]),
        (1, ["cough", "breath", "wheeze", "grunting", "oxygen"]),
        (2, ["back", "lift", "numb", "weakness"]),
        (3, ["vaccine", "booster", "fever", "rash", "swelling"]),
        (4, ["abdomen", "vomit", "diarrhea", "stomach"]),
    ]
    for index, terms in buckets:
        if any(term in lowered for term in terms):
            vector[index] += 1.0
    magnitude = math.sqrt(sum(value * value for value in vector))
    return vector if magnitude == 0 else [value / magnitude for value in vector]


def match_protocol(scenario: Scenario) -> Dict[str, Any]:
    vector = scenario.symptom_vector or vectorize_symptom_text(scenario.symptom_text)
    best = max(PROTOCOL_ANCHORS, key=lambda anchor: cosine_similarity(vector, anchor.vector))
    score = cosine_similarity(vector, best.vector)
    if score < VECTOR_THRESHOLD:
        return {
            "codebook_node": "UNKNOWN_SYMPTOM",
            "protocol_id": None,
            "title_en": "No Guideline Available",
            "cosine_similarity": round(score, 4),
            "accepted": False,
            "threshold": VECTOR_THRESHOLD,
        }
    return {
        "codebook_node": best.node,
        "protocol_id": best.protocol_id,
        "title_en": best.title_en,
        "cosine_similarity": round(score, 4),
        "accepted": True,
        "threshold": VECTOR_THRESHOLD,
    }


def compute_news2(vitals: Vitals) -> int:
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


def safety_floor(scenario: Scenario) -> Dict[str, Any]:
    vitals = scenario.vitals
    reasons: List[str] = []
    if vitals.conscious_level != "A":
        reasons.append("Altered consciousness is a mandatory RED floor.")
    if vitals.spo2 < 92:
        reasons.append("SpO2 below 92% is a mandatory RED floor.")
    if scenario.age_years >= 12 and (vitals.respiratory_rate < 10 or vitals.respiratory_rate > 30):
        reasons.append("Adult respiratory rate outside 10-30 is a mandatory RED floor.")
    if scenario.age_years >= 12 and (vitals.heart_rate < 60 or vitals.heart_rate > 130):
        reasons.append("Adult heart rate outside 60-130 is a mandatory RED floor.")
    if scenario.age_years < 5 and vitals.respiratory_rate >= 40:
        reasons.append("Child under 5 with RR >= 40 triggers pediatric tachypnea RED floor.")
    return {
        "override_triggered": bool(reasons),
        "reasons": reasons,
        "score": 10 if reasons else compute_news2(vitals),
    }


def severity_for(score: int, override: bool) -> Severity:
    if override or score >= 7:
        return "EMERGENCY"
    if score >= 5:
        return "URGENT"
    if score >= 1:
        return "ROUTINE"
    return "HOMECARE"


def route_for(scenario: Scenario, severity: Severity) -> str:
    if severity == "EMERGENCY" and scenario.age_years < 18:
        return "SIDRA_MEDICINE_PEDIATRIC_EMERGENCY"
    if severity == "EMERGENCY":
        return "HAMAD_MEDICAL_CORPORATION_ADULT_EMERGENCY"
    if scenario.outstation:
        return "OUTSTATION_TELECONSULT_ESCALATION"
    if severity == "URGENT":
        return "PRIMARY_HEALTH_CARE_CORPORATION_URGENT_CARE_CENTER"
    if scenario.role in ("Pilot", "Cabin Crew") and scenario.sickness_leave_requested:
        return "IST_MEDICAL_CENTRE_HIA_MIDFIELD"
    if scenario.role in ("Pilot", "Cabin Crew") and severity != "HOMECARE":
        return "IST_MEDICAL_CENTRE_HIA_MIDFIELD"
    if severity == "HOMECARE":
        return "HOME_CARE_WITH_CALLBACK_PRECAUTIONS"
    return "PHCC_LOCAL_CLINIC_APPOINTMENT"


def fit_to_fly_for(scenario: Scenario, severity: Severity) -> str:
    crew = scenario.role in ("Pilot", "Cabin Crew")
    if crew and scenario.sickness_leave_requested:
        return "RESTRICTED"
    if crew and severity != "HOMECARE":
        return "RESTRICTED"
    if crew and scenario.recent_vaccination_hours is not None and scenario.recent_vaccination_hours <= 24:
        return "RESTRICTED"
    return "NOT_APPLICABLE" if not crew else "CLEARED"


def run_simulation(scenario: Scenario) -> Dict[str, Any]:
    transition_log: List[Dict[str, Any]] = []
    encounter_id = f"sim-{uuid.uuid4()}"

    transition_log.append({
        "state_id": 0,
        "state_name": "Patient Ingestion",
        "output": {
            "ist_staff_id": scenario.ist_staff_id,
            "role": scenario.role,
            "age_years": scenario.age_years,
            "symptom_text": scenario.symptom_text,
        },
        "consequence": "Synthetic payload accepted; proceeding to vector matching.",
    })

    matched_protocol = match_protocol(scenario)
    transition_log.append({
        "state_id": 1,
        "state_name": "Semantic Vector Match",
        "output": matched_protocol,
        "consequence": "Protocol match accepted." if matched_protocol["accepted"] else "Low similarity; safety-net nurse review required.",
    })

    safety = safety_floor(scenario)
    transition_log.append({
        "state_id": 2,
        "state_name": "WHO/IITT Safety Floor",
        "output": safety,
        "consequence": "Emergency override applied." if safety["override_triggered"] else "Stable enough for NEWS2 scoring.",
    })

    score = safety["score"]
    severity = severity_for(score, safety["override_triggered"])
    if not safety["override_triggered"]:
        transition_log.append({
            "state_id": 3,
            "state_name": "NEWS2 Scoring",
            "output": {"score": score, "severity": severity},
            "consequence": "Objective vital score calculated.",
        })

    fit_to_fly = fit_to_fly_for(scenario, severity)
    transition_log.append({
        "state_id": 4,
        "state_name": "Aviation Occupational Gate",
        "output": {
            "fit_to_fly_status": fit_to_fly,
            "outstation": scenario.outstation,
            "sickness_leave_requested": scenario.sickness_leave_requested,
        },
        "consequence": "Aviation and duty-status checks completed.",
    })

    target = route_for(scenario, severity)
    sbar = (
        f"SBAR SYNTHETIC ENCOUNTER\n"
        f"S: {scenario.symptom_text}\n"
        f"B: {scenario.ist_staff_id}; role {scenario.role}; age {scenario.age_years}.\n"
        f"A: Score {score}; severity {severity}; fit-to-fly {fit_to_fly}.\n"
        f"R: Route to {target}. Nurse approval required."
    )
    transition_log.append({
        "state_id": 5,
        "state_name": "Localized Routing & Documentation",
        "output": {
            "encounter_id": encounter_id,
            "target_routing_endpoint": target,
            "sbar_rendered": True,
        },
        "consequence": "Simulation completed and SBAR generated.",
    })

    expected_output = {
        "matched_protocol": matched_protocol,
        "severity": severity,
        "acuity_score": score,
        "fit_to_fly_status": fit_to_fly,
        "target_routing_endpoint": target,
        "safety_floor_triggered": safety["override_triggered"],
    }

    return {
        "encounter_id": encounter_id,
        "synthetic": True,
        "scenario_id": scenario.scenario_id,
        "scenario_name": scenario.name,
        "expected_output": expected_output,
        "sbar_note": sbar,
        "transition_log": transition_log,
        "training_row": {
            "id": encounter_id,
            "synthetic": True,
            "purpose": "llm-evaluation-and-training",
            "safety_notice": "Synthetic only; do not mix with PHI or use as autonomous clinical authority.",
            "messages": [
                {"role": "system", "content": "Rules-first IST tele-triage copilot. AI assists; nurse approves."},
                {"role": "user", "content": json.dumps({"symptom_text": scenario.symptom_text, "vitals": scenario.vitals.__dict__})},
                {"role": "assistant", "content": json.dumps(expected_output)},
            ],
        },
    }


def run_suite() -> List[Dict[str, Any]]:
    return [run_simulation(scenario) for scenario in SCENARIOS]


def emit_jsonl(rows: Iterable[Dict[str, Any]]) -> str:
    return "\n".join(json.dumps(row["training_row"], ensure_ascii=False) for row in rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate IST Tech synthetic triage simulation data")
    parser.add_argument("--jsonl", action="store_true", help="Emit LLM-ready JSONL training/evaluation rows")
    parser.add_argument("--self-test", action="store_true", help="Run deterministic simulator assertions")
    args = parser.parse_args()

    results = run_suite()
    if args.self_test:
        assert results[0]["expected_output"]["severity"] == "EMERGENCY"
        assert results[1]["expected_output"]["target_routing_endpoint"] == "SIDRA_MEDICINE_PEDIATRIC_EMERGENCY"
        assert results[2]["expected_output"]["fit_to_fly_status"] == "RESTRICTED"
        assert all(result["synthetic"] is True for result in results)
        print("simulation self-test passed")
        return

    if args.jsonl:
        print(emit_jsonl(results))
    else:
        print(json.dumps({"synthetic_only": True, "results": results}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
