"""Generate synthetic aviation workforce and triage seed data for IST Tech.

The output is intentionally synthetic and must not be mixed with real employee,
patient, or clinical records. It is built for database seeding, model
evaluation, prompt regression tests, and demo-scale operational simulation.

Default scale follows the prompt: 260 active wide-body aircraft, 26,000 group
employees, 5,000 historical triage encounters, and 250 safety audit logs.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Literal, Optional, Sequence, Tuple


DutyStatus = Literal["ACTIVE", "ON_LEAVE", "REST_PERIOD"]
InsuranceStatus = Literal["ELIGIBLE", "SUSPENDED"]
BiologicalSex = Literal["FEMALE", "MALE", "OTHER", "UNKNOWN"]
Severity = Literal["EMERGENCY", "URGENT", "ROUTINE", "SELF_CARE"]
DispositionCode = Literal[
    "SIDRA_PEDIATRIC_ED",
    "HMC_EMERGENCY_DEPARTMENT",
    "HMC_URGENT_REVIEW",
    "IST_HIA_MIDFIELD_MEDICAL_CENTRE",
    "IST_OLD_AIRPORT_MEDICAL_COMMISSION",
    "PHCC_URGENT_CARE_OR_TELECONSULT",
    "OUTSTATION_TELECONSULT_ESCALATION",
    "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
]


VECTOR_THRESHOLD = 0.70
DEFAULT_AIRCRAFT_COUNT = 260
DEFAULT_ENCOUNTER_COUNT = 5000
DEFAULT_OUTPUT_PATH = os.path.join("data", "generated", "ist_qatar_seed_data.json")
ORACLE_HCM_API_VERSION = "11.13.18.05"
ORACLE_HCM_RESOURCE_ROOT = f"/hcmRestApi/resources/{ORACLE_HCM_API_VERSION}"


@dataclass(frozen=True)
class StaffBlueprint:
    department: str
    job_title: str
    role_group: str
    age_min: int
    age_max: int
    is_safety_sensitive_crew: bool


@dataclass(frozen=True)
class ProtocolAnchor:
    node: str
    algorithm_id: str
    external_protocol_id: str
    title_en: str
    clinical_definition_en: str
    vector: List[float]


@dataclass(frozen=True)
class ClinicalProfile:
    key: str
    share: float
    protocol_node: str
    symptom: str
    transcript: str
    score: int
    severity: Severity
    disposition_code: DispositionCode
    destination: str
    fit_to_fly_status: str
    vector: List[float]
    patient_pool: Literal["active_pilot", "active_cabin", "young_dependent", "any_staff"]
    vitals: Dict[str, Any]
    aviation_tags: List[str]


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def date_for_age(generated_at: datetime, age: int, offset_days: int = 0) -> str:
    year = generated_at.year - age
    month = (offset_days % 12) + 1
    day = (offset_days % 27) + 1
    return f"{year:04d}-{month:02d}-{day:02d}"


def deterministic_uuid(rng: random.Random) -> str:
    return str(uuid.UUID(int=rng.getrandbits(128), version=4))


def rounded_staff_count(value: float) -> int:
    quantum = 100 if value >= 1000 else 10
    return int(math.floor((value / quantum) + 0.5) * quantum)


def allocate_counts(total: int, weighted_items: Sequence[Tuple[str, float]]) -> Dict[str, int]:
    if total < 0:
        raise ValueError("total must be non-negative")

    raw: List[Tuple[str, float, int, float]] = []
    used = 0
    for key, share in weighted_items:
        exact = total * share
        base = int(math.floor(exact))
        raw.append((key, exact, base, exact - base))
        used += base

    remainder = total - used
    raw.sort(key=lambda item: item[3], reverse=True)
    counts = {key: base for key, _exact, base, _fraction in raw}
    for key, _exact, _base, _fraction in raw[:remainder]:
        counts[key] += 1
    return counts


def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def jitter_vector(rng: random.Random, vector: Sequence[float], spread: float = 0.03) -> List[float]:
    return [round(max(0.0, value + rng.uniform(-spread, spread)), 4) for value in vector]


def match_protocol(vector: Sequence[float], anchors: Sequence[ProtocolAnchor]) -> Dict[str, Any]:
    best_anchor = anchors[0]
    best_score = -1.0
    for anchor in anchors:
        score = cosine_similarity(vector, anchor.vector)
        if score > best_score:
            best_score = score
            best_anchor = anchor

    if best_score < VECTOR_THRESHOLD:
        return {
            "codebook_node": "UNKNOWN_SYMPTOM",
            "protocol_used_id": None,
            "external_protocol_id": None,
            "title_en": "No Guideline Available",
            "cosine_similarity": round(best_score, 4),
            "accepted": False,
            "threshold": VECTOR_THRESHOLD,
        }

    return {
        "codebook_node": best_anchor.node,
        "protocol_used_id": best_anchor.algorithm_id,
        "external_protocol_id": best_anchor.external_protocol_id,
        "title_en": best_anchor.title_en,
        "cosine_similarity": round(best_score, 4),
        "accepted": True,
        "threshold": VECTOR_THRESHOLD,
    }


def support_title(rng: random.Random, department: str) -> str:
    titles = {
        "Engineering": ["Avionics Engineer", "Line Maintenance Technician", "Aircraft Systems Planner"],
        "Ground Operations": ["Ramp Agent", "Catering Coordinator", "Airport Customer Service"],
        "Administration": ["HR Specialist", "Medical Commission Clerk", "CDC Analyst"],
    }
    return rng.choice(titles[department])


def location_for_department(department: str) -> str:
    if department in ("Flight Operations", "Inflight Services"):
        return "Hamad International Airport"
    if department == "Engineering":
        return "HIA Technical Operations"
    if department == "Ground Operations":
        return "HIA Ground Operations"
    return "Doha Administration Office"


def oracle_assignment_status(duty_status: str) -> str:
    if duty_status == "ACTIVE":
        return "ACTIVE"
    if duty_status == "ON_LEAVE":
        return "LEAVE_OF_ABSENCE"
    if duty_status == "REST_PERIOD":
        return "ACTIVE_REST_PERIOD"
    return "INACTIVE"


def oracle_gender(sex: str) -> str:
    if sex == "FEMALE":
        return "F"
    if sex == "MALE":
        return "M"
    return "U"


def biological_sex_for_role(rng: random.Random, role_group: str) -> BiologicalSex:
    roll = rng.random()
    if role_group == "pilot":
        return "FEMALE" if roll < 0.12 else "MALE"
    if role_group == "cabin_crew":
        if roll < 0.58:
            return "FEMALE"
        return "MALE"
    if roll < 0.48:
        return "FEMALE"
    if roll < 0.96:
        return "MALE"
    return "UNKNOWN"


def build_protocol_anchors() -> List[ProtocolAnchor]:
    return [
        ProtocolAnchor(
            node="ACUTE_CHEST_PAIN",
            algorithm_id="alg-synth-acute-chest-pain-adult",
            external_protocol_id="SYNTH-ACUTE-CHEST-PAIN-ADULT",
            title_en="Chest Pain or Tightness - Adult",
            clinical_definition_en="Synthetic adult chest pain protocol anchor for RED floor regression.",
            vector=[0.95, 0.20, 0.10, 0.10, 0.10],
        ),
        ProtocolAnchor(
            node="PEDIATRIC_RESPIRATORY",
            algorithm_id="alg-synth-pediatric-respiratory-distress",
            external_protocol_id="SYNTH-PEDIATRIC-RESPIRATORY",
            title_en="Pediatric Breathing Difficulty",
            clinical_definition_en="Synthetic pediatric respiratory distress anchor for Sidra routing.",
            vector=[0.12, 0.92, 0.05, 0.25, 0.08],
        ),
        ProtocolAnchor(
            node="LOWER_BACK_PAIN",
            algorithm_id="alg-synth-lower-back-pain",
            external_protocol_id="SYNTH-LOWER-BACK-PAIN",
            title_en="Lower Back Pain or Strain",
            clinical_definition_en="Synthetic musculoskeletal strain anchor for crew fit-to-fly review.",
            vector=[0.05, 0.06, 0.95, 0.08, 0.22],
        ),
        ProtocolAnchor(
            node="PILOT_EAR_BAROTRAUMA",
            algorithm_id="alg-synth-ear-barotrauma",
            external_protocol_id="SYNTH-EAR-BAROTRAUMA",
            title_en="Ear Pain or Barotrauma - Flight Crew",
            clinical_definition_en="Synthetic aviation medicine anchor for ear pressure after descent.",
            vector=[0.06, 0.16, 0.10, 0.10, 0.94],
        ),
        ProtocolAnchor(
            node="VACCINE_REACTION",
            algorithm_id="alg-synth-vaccine-reaction",
            external_protocol_id="SYNTH-VACCINE-REACTION",
            title_en="Vaccination Reaction or Fever",
            clinical_definition_en="Synthetic post-immunization reaction anchor for rest-period testing.",
            vector=[0.08, 0.10, 0.20, 0.94, 0.18],
        ),
    ]


def build_clinical_profiles() -> List[ClinicalProfile]:
    return [
        ClinicalProfile(
            key="HIGH_ACUITY_CARDIAC_EMERGENCY",
            share=0.12,
            protocol_node="ACUTE_CHEST_PAIN",
            symptom="Acute crushing chest pain, radiating to left arm and jaw, profuse sweating",
            transcript="Caller reports crushing chest pain radiating to the left arm and jaw with profuse sweating before duty.",
            score=10,
            severity="EMERGENCY",
            disposition_code="HMC_EMERGENCY_DEPARTMENT",
            destination="Hamad Medical Corporation (HMC) Emergency Department",
            fit_to_fly_status="RESTRICTED",
            vector=[0.98, 0.22, 0.04, 0.04, 0.03],
            patient_pool="active_pilot",
            vitals={"heart_rate": 138, "respiratory_rate": 32, "spo2": 90, "temperature_c": 36.8, "conscious_level": "A"},
            aviation_tags=["fit-to-fly-review", "duty-restriction", "red-floor"],
        ),
        ClinicalProfile(
            key="PEDIATRIC_RESPIRATORY_DISTRESS",
            share=0.15,
            protocol_node="PEDIATRIC_RESPIRATORY",
            symptom="Barking cough, stridor on inspiration, struggling for breath",
            transcript="Parent reports barking cough, inspiratory stridor, and visible work of breathing in a young child.",
            score=10,
            severity="EMERGENCY",
            disposition_code="SIDRA_PEDIATRIC_ED",
            destination="Sidra Medicine Emergency Department",
            fit_to_fly_status="NOT_APPLICABLE",
            vector=[0.08, 0.98, 0.02, 0.18, 0.04],
            patient_pool="young_dependent",
            vitals={"heart_rate": 112, "respiratory_rate": 45, "spo2": 95, "temperature_c": 38.4, "conscious_level": "A"},
            aviation_tags=["pediatric-red-floor", "dependent-pathway"],
        ),
        ClinicalProfile(
            key="CABIN_CREW_BACK_PAIN",
            share=0.28,
            protocol_node="LOWER_BACK_PAIN",
            symptom="Lower back strain after lifting heavy galley cart during descent",
            transcript="Cabin crew reports lower back strain after lifting a heavy galley cart during descent.",
            score=1,
            severity="ROUTINE",
            disposition_code="IST_HIA_MIDFIELD_MEDICAL_CENTRE",
            destination="IST Medical Centre (HIA Midfield Area)",
            fit_to_fly_status="RESTRICTED",
            vector=[0.03, 0.03, 0.98, 0.04, 0.12],
            patient_pool="active_cabin",
            vitals={"heart_rate": 72, "respiratory_rate": 14, "spo2": 99, "temperature_c": 36.6, "conscious_level": "A"},
            aviation_tags=["sickness-validation", "duty-restriction", "occupational-injury"],
        ),
        ClinicalProfile(
            key="PILOT_EAR_BAROTRAUMA",
            share=0.20,
            protocol_node="PILOT_EAR_BAROTRAUMA",
            symptom="Severe ear pain and pressure on descent, head congestion",
            transcript="Pilot reports severe ear pain and pressure after descent with head congestion.",
            score=1,
            severity="ROUTINE",
            disposition_code="IST_HIA_MIDFIELD_MEDICAL_CENTRE",
            destination="IST Medical Centre (HIA Midfield Area)",
            fit_to_fly_status="RESTRICTED",
            vector=[0.03, 0.18, 0.06, 0.06, 0.98],
            patient_pool="active_pilot",
            vitals={"heart_rate": 74, "respiratory_rate": 14, "spo2": 99, "temperature_c": 37.2, "conscious_level": "A"},
            aviation_tags=["fit-to-fly-review", "duty-restriction", "barotrauma"],
        ),
        ClinicalProfile(
            key="MANDATED_IMMUNIZATION_FEVER",
            share=0.25,
            protocol_node="VACCINE_REACTION",
            symptom="Slight fever, muscle soreness, and headache after receiving mandated booster shot",
            transcript="Staff member reports slight fever, muscle soreness, and headache after mandated booster.",
            score=0,
            severity="SELF_CARE",
            disposition_code="SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
            destination="Home Care Advice / Self-Care",
            fit_to_fly_status="REST_24H_IF_ACTIVE_CREW",
            vector=[0.05, 0.05, 0.16, 0.98, 0.08],
            patient_pool="any_staff",
            vitals={"heart_rate": 82, "respiratory_rate": 16, "spo2": 98, "temperature_c": 37.8, "conscious_level": "A"},
            aviation_tags=["vaccination-reaction", "self-care"],
        ),
    ]


def make_protocol_records(generated_at: datetime, anchors: Sequence[ProtocolAnchor]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    release_id = "release-synth-aviation-2026-07"
    protocol_releases = [
        {
            "id": release_id,
            "name": "Synthetic Aviation Workforce Clinical Protocol Anchors",
            "version": "2026.07-synthetic",
            "source_type": "SYNTHETIC_SAMPLE",
            "region": "QA",
            "mode": "BOTH",
            "active": True,
            "imported_at": iso(generated_at),
            "created_at": iso(generated_at),
            "updated_at": iso(generated_at),
        }
    ]
    algorithms = [
        {
            "id": anchor.algorithm_id,
            "release_id": release_id,
            "external_protocol_id": anchor.external_protocol_id,
            "mode": "BOTH",
            "title_en": anchor.title_en,
            "title_ar": None,
            "clinical_definition_en": anchor.clinical_definition_en,
            "clinical_definition_ar": None,
            "background_info_en": "Synthetic protocol anchor for simulation and AI evaluation only.",
            "background_info_ar": None,
            "gender_restriction": None,
            "age_min": None,
            "age_max": None,
            "stcc_version": "synthetic-2026.07",
            "active": True,
            "created_at": iso(generated_at),
            "updated_at": iso(generated_at),
        }
        for anchor in anchors
    ]
    return protocol_releases, algorithms


def make_workforce_counts(aircraft_count: int) -> Dict[str, int]:
    total = aircraft_count * 100
    pilots = 4300 if aircraft_count == DEFAULT_AIRCRAFT_COUNT else rounded_staff_count(aircraft_count * 16.5)
    cabin = aircraft_count * 20
    support = total - pilots - cabin
    if support < 0:
        raise ValueError("aircraft_count is too small for the configured workforce ratios")

    support_counts = allocate_counts(
        support,
        [
            ("engineering", 0.30),
            ("ground_operations", 0.40),
            ("administration", 0.30),
        ],
    )
    return {
        "total": total,
        "pilots": pilots,
        "captains": pilots // 2,
        "first_officers": pilots - (pilots // 2),
        "cabin_crew_total": cabin,
        "cabin_supervisors": int(round(cabin * 0.15)),
        "cabin_crew": cabin - int(round(cabin * 0.15)),
        **support_counts,
    }


def make_status_values(total: int, rng: random.Random) -> List[DutyStatus]:
    counts = allocate_counts(total, [("ACTIVE", 0.80), ("ON_LEAVE", 0.10), ("REST_PERIOD", 0.10)])
    values: List[DutyStatus] = (
        ["ACTIVE"] * counts["ACTIVE"]
        + ["ON_LEAVE"] * counts["ON_LEAVE"]
        + ["REST_PERIOD"] * counts["REST_PERIOD"]
    )
    rng.shuffle(values)
    return values


def make_insurance_values(total: int, rng: random.Random) -> List[InsuranceStatus]:
    counts = allocate_counts(total, [("ELIGIBLE", 0.98), ("SUSPENDED", 0.02)])
    values: List[InsuranceStatus] = ["ELIGIBLE"] * counts["ELIGIBLE"] + ["SUSPENDED"] * counts["SUSPENDED"]
    rng.shuffle(values)
    return values


def build_staff_blueprints(counts: Dict[str, int], rng: random.Random) -> List[StaffBlueprint]:
    blueprints: List[StaffBlueprint] = []
    blueprints.extend(
        StaffBlueprint("Flight Operations", "Captain", "pilot", 32, 63, True)
        for _ in range(counts["captains"])
    )
    blueprints.extend(
        StaffBlueprint("Flight Operations", "First Officer", "pilot", 26, 58, True)
        for _ in range(counts["first_officers"])
    )
    blueprints.extend(
        StaffBlueprint("Inflight Services", "Cabin Supervisor", "cabin_crew", 25, 55, True)
        for _ in range(counts["cabin_supervisors"])
    )
    blueprints.extend(
        StaffBlueprint("Inflight Services", "Cabin Crew", "cabin_crew", 21, 52, True)
        for _ in range(counts["cabin_crew"])
    )

    for _ in range(counts["engineering"]):
        blueprints.append(StaffBlueprint("Engineering", support_title(rng, "Engineering"), "engineering", 23, 62, False))
    for _ in range(counts["ground_operations"]):
        blueprints.append(StaffBlueprint("Ground Operations", support_title(rng, "Ground Operations"), "ground_operations", 21, 60, False))
    for _ in range(counts["administration"]):
        blueprints.append(StaffBlueprint("Administration", support_title(rng, "Administration"), "administration", 22, 65, False))

    rng.shuffle(blueprints)
    return blueprints


def generate_staff(
    aircraft_count: int,
    rng: random.Random,
    generated_at: datetime,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, List[str]]]:
    counts = make_workforce_counts(aircraft_count)
    statuses = make_status_values(counts["total"], rng)
    insurance_values = make_insurance_values(counts["total"], rng)
    blueprints = build_staff_blueprints(counts, rng)

    staff_members: List[Dict[str, Any]] = []
    staff_index: List[Dict[str, Any]] = []
    pools: Dict[str, List[str]] = {
        "active_pilot": [],
        "active_cabin": [],
        "any_staff": [],
        "safety_sensitive_crew": [],
    }

    for index, blueprint in enumerate(blueprints, start=1):
        staff_id = deterministic_uuid(rng)
        staff_age = rng.randint(blueprint.age_min, blueprint.age_max)
        sex = biological_sex_for_role(rng, blueprint.role_group)
        staff_number = f"IST-{index:05d}"
        duty_status = statuses[index - 1]
        record = {
            "id": staff_id,
            "ist_staff_id": staff_number,
            "department": blueprint.department,
            "job_title": blueprint.job_title,
            "duty_status": duty_status,
            "insurance_provider": "Alkoot",
            "insurance_eligibility_status": insurance_values[index - 1],
            "insurance_last_checked": iso(generated_at - timedelta(days=rng.randint(0, 14))),
            "created_at": iso(generated_at),
            "updated_at": iso(generated_at),
        }
        staff_members.append(record)
        staff_index.append(
            {
                "id": staff_id,
                "ist_staff_id": staff_number,
                "oracle_person_id": 900000000000 + index,
                "oracle_workers_uniq_id": f"WKR-{index:08d}",
                "oracle_period_of_service_id": f"POS-{index:08d}",
                "oracle_assignment_id": f"ASG-{index:08d}",
                "oracle_assignment_number": f"E{index:08d}",
                "department": blueprint.department,
                "job_title": blueprint.job_title,
                "role_group": blueprint.role_group,
                "age": staff_age,
                "biological_sex": sex,
                "duty_status": duty_status,
                "location_name": location_for_department(blueprint.department),
                "is_safety_sensitive_crew": blueprint.is_safety_sensitive_crew,
            }
        )
        pools["any_staff"].append(staff_id)
        if blueprint.role_group == "pilot" and duty_status == "ACTIVE":
            pools["active_pilot"].append(staff_id)
        if blueprint.role_group == "cabin_crew" and duty_status == "ACTIVE":
            pools["active_cabin"].append(staff_id)
        if blueprint.is_safety_sensitive_crew:
            pools["safety_sensitive_crew"].append(staff_id)

    return staff_members, staff_index, pools


def dependent_distribution(count: int) -> List[int]:
    counts = allocate_counts(count, [("one", 0.40), ("two", 0.40), ("three", 0.20)])
    return [1] * counts["one"] + [2] * counts["two"] + [3] * counts["three"]


def make_child_age(rng: random.Random, staff_age: int) -> int:
    max_age = max(0, min(17, staff_age - 18))
    if max_age <= 0:
        return 0
    return rng.randint(0, max_age)


def generate_dependents(
    staff_index: Sequence[Dict[str, Any]],
    rng: random.Random,
    generated_at: datetime,
) -> Tuple[List[Dict[str, Any]], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]]]:
    dependent_staff_count = int(round(len(staff_index) * 0.45))
    selected_staff = rng.sample(list(staff_index), dependent_staff_count)
    family_sizes = dependent_distribution(dependent_staff_count)
    rng.shuffle(family_sizes)

    dependents: List[Dict[str, Any]] = []
    dependents_by_staff: Dict[str, List[Dict[str, Any]]] = {}
    young_dependents: List[Dict[str, Any]] = []

    for staff_meta, family_size in zip(selected_staff, family_sizes):
        staff_dependents: List[Dict[str, Any]] = []
        relationship_plan: List[str]
        if family_size == 1:
            relationship_plan = ["SPOUSE" if rng.random() < 0.55 else rng.choice(["SON", "DAUGHTER"])]
        elif family_size == 2:
            relationship_plan = ["SPOUSE", rng.choice(["SON", "DAUGHTER"])]
        else:
            relationship_plan = ["SPOUSE", "SON", "DAUGHTER"]

        for relation in relationship_plan:
            dependent_id = deterministic_uuid(rng)
            if relation == "SPOUSE":
                age = max(18, staff_meta["age"] + rng.randint(-5, 5))
                sex: BiologicalSex = "FEMALE" if staff_meta["biological_sex"] == "MALE" else "MALE"
                full_name = f"Synthetic Spouse of {staff_meta['ist_staff_id']}"
            else:
                age = make_child_age(rng, staff_meta["age"])
                sex = "MALE" if relation == "SON" else "FEMALE"
                full_name = f"Synthetic {relation.title()} of {staff_meta['ist_staff_id']}"

            record = {
                "id": dependent_id,
                "staff_member_id": staff_meta["id"],
                "full_name": full_name,
                "relationship": relation,
                "age": age,
                "biological_sex": sex,
                "created_at": iso(generated_at),
                "updated_at": iso(generated_at),
            }
            dependents.append(record)
            staff_dependents.append(record)
            if age < 5 and relation in ("SON", "DAUGHTER"):
                young_dependents.append(record)

        dependents_by_staff[staff_meta["id"]] = staff_dependents

    if not young_dependents:
        for record in dependents:
            if record["relationship"] in ("SON", "DAUGHTER"):
                record["age"] = 3
                young_dependents.append(record)
                break

    return dependents, dependents_by_staff, young_dependents


def make_staff_lookup(staff_index: Sequence[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {staff["id"]: staff for staff in staff_index}


def oracle_worker_name(staff_meta: Dict[str, Any]) -> str:
    return f"Synthetic {staff_meta['job_title']} {staff_meta['ist_staff_id']}"


def oracle_links(resource: str, unique_id: Any) -> List[Dict[str, str]]:
    href = f"{ORACLE_HCM_RESOURCE_ROOT}/{resource}/{unique_id}"
    return [{"rel": "self", "href": href, "name": resource, "kind": "item"}]


def make_oracle_hcm_payloads(
    staff_index: Sequence[Dict[str, Any]],
    dependents: Sequence[Dict[str, Any]],
    generated_at: datetime,
) -> Dict[str, Any]:
    """Build Oracle Fusion HCM-like API payloads for adapter testing.

    These are not a promise of exact tenant-specific Oracle field availability.
    They are intentionally shaped around the documented API families the adapter
    will consume: publicWorkers, workers, assignments, hcmContacts, contact
    relationships, and absences.
    """

    staff_lookup = make_staff_lookup(staff_index)
    public_workers: List[Dict[str, Any]] = []
    workers: List[Dict[str, Any]] = []
    assignments: List[Dict[str, Any]] = []
    work_relationships: List[Dict[str, Any]] = []
    absences: List[Dict[str, Any]] = []

    for staff_meta in staff_index:
        person_id = staff_meta["oracle_person_id"]
        worker_id = staff_meta["oracle_workers_uniq_id"]
        status = oracle_assignment_status(staff_meta["duty_status"])
        display_name = oracle_worker_name(staff_meta)
        dob = date_for_age(generated_at, int(staff_meta["age"]), person_id % 365)

        public_workers.append(
            {
                "PersonId": person_id,
                "PersonNumber": staff_meta["ist_staff_id"],
                "DisplayName": display_name,
                "WorkerType": "E",
                "AssignmentNumber": staff_meta["oracle_assignment_number"],
                "AssignmentStatusType": status,
                "DepartmentName": staff_meta["department"],
                "JobName": staff_meta["job_title"],
                "LocationName": staff_meta["location_name"],
                "links": oracle_links("publicWorkers", person_id),
            }
        )
        workers.append(
            {
                "workersUniqID": worker_id,
                "PersonId": person_id,
                "PersonNumber": staff_meta["ist_staff_id"],
                "DisplayName": display_name,
                "DateOfBirth": dob,
                "Gender": oracle_gender(staff_meta["biological_sex"]),
                "WorkerType": "E",
                "CorrespondenceLanguage": "US",
                "LegislationCode": "QA",
                "links": oracle_links("workers", worker_id),
            }
        )
        work_relationships.append(
            {
                "workersUniqID": worker_id,
                "PeriodOfServiceId": staff_meta["oracle_period_of_service_id"],
                "PersonId": person_id,
                "LegalEmployerName": "IST Tech",
                "WorkerType": "E",
                "PrimaryFlag": True,
                "StartDate": "2018-01-01",
            }
        )
        assignments.append(
            {
                "workersUniqID": worker_id,
                "PeriodOfServiceId": staff_meta["oracle_period_of_service_id"],
                "AssignmentId": staff_meta["oracle_assignment_id"],
                "AssignmentNumber": staff_meta["oracle_assignment_number"],
                "PersonId": person_id,
                "PersonNumber": staff_meta["ist_staff_id"],
                "AssignmentStatusType": status,
                "BusinessUnitName": "IST Tech Aviation Health Services",
                "DepartmentName": staff_meta["department"],
                "JobName": staff_meta["job_title"],
                "LocationName": staff_meta["location_name"],
                "PrimaryAssignmentFlag": True,
                "EffectiveStartDate": "2026-01-01",
            }
        )
        if staff_meta["duty_status"] in ("ON_LEAVE", "REST_PERIOD"):
            absences.append(
                {
                    "AbsenceEntryId": f"ABS-{person_id}",
                    "PersonId": person_id,
                    "PersonNumber": staff_meta["ist_staff_id"],
                    "AbsenceType": "Sickness Leave" if staff_meta["duty_status"] == "ON_LEAVE" else "Crew Rest Period",
                    "ApprovalStatusCd": "APPROVED",
                    "StartDate": date_for_age(generated_at, 0, person_id % 30),
                    "EndDate": date_for_age(generated_at + timedelta(days=2), 0, person_id % 30),
                }
            )

    hcm_contacts: List[Dict[str, Any]] = []
    contact_relationships: List[Dict[str, Any]] = []
    for index, dependent in enumerate(dependents, start=1):
        staff_meta = staff_lookup[dependent["staff_member_id"]]
        contact_person_id = 990000000000 + index
        hcm_contact_id = f"HCMC-{index:08d}"
        relationship_id = f"HCMR-{index:08d}"
        hcm_contacts.append(
            {
                "hcmContactsUniqID": hcm_contact_id,
                "ContactPersonId": contact_person_id,
                "ContactPersonNumber": f"DEP-{index:08d}",
                "DisplayName": dependent["full_name"],
                "DateOfBirth": date_for_age(generated_at, int(dependent["age"]), index),
                "Gender": oracle_gender(dependent["biological_sex"]),
                "LegislationCode": "QA",
                "links": oracle_links("hcmContacts", hcm_contact_id),
            }
        )
        contact_relationships.append(
            {
                "ContactRelationshipId": relationship_id,
                "PersonId": staff_meta["oracle_person_id"],
                "PersonNumber": staff_meta["ist_staff_id"],
                "ContactPersonId": contact_person_id,
                "ContactPersonNumber": f"DEP-{index:08d}",
                "RelationshipType": dependent["relationship"],
                "EmergencyContactFlag": dependent["relationship"] == "SPOUSE",
                "DependentFlag": True,
                "StartDate": "2026-01-01",
            }
        )

    def collection(items: List[Dict[str, Any]], resource: str) -> Dict[str, Any]:
        return {
            "resource": resource,
            "count": len(items),
            "hasMore": False,
            "items": items,
        }

    return {
        "synthetic": True,
        "base_resource_path": ORACLE_HCM_RESOURCE_ROOT,
        "adapter_contract": "Oracle Fusion HCM read-only employee/dependent feed",
        "source_of_truth_note": (
            "Use these Oracle-style payloads as the employee source feed. The staff_members and "
            "dependents arrays in this seed are normalized IST projections derived from this feed."
        ),
        "collections": {
            "publicWorkers": collection(public_workers, "publicWorkers"),
            "workers": collection(workers, "workers"),
            "workRelationships": collection(work_relationships, "workRelationships"),
            "assignments": collection(assignments, "assignments"),
            "hcmContacts": collection(hcm_contacts, "hcmContacts"),
            "contactRelationships": collection(contact_relationships, "contactRelationships"),
            "absences": collection(absences, "absences"),
        },
        "ist_mapping": {
            "StaffMember.ist_staff_id": "publicWorkers.items[].PersonNumber",
            "StaffMember.department": "assignments.items[].DepartmentName",
            "StaffMember.job_title": "assignments.items[].JobName",
            "StaffMember.duty_status": "assignments.items[].AssignmentStatusType plus absences.items[]",
            "Dependent": "hcmContacts.items[] plus contactRelationships.items[]",
            "AviationTriageEncounter.staff_member_id": "normalized StaffMember.id after Oracle PersonNumber resolution",
        },
    }


def choose_staff_id(rng: random.Random, pool: Sequence[str], fallback: Sequence[str]) -> str:
    if pool:
        return rng.choice(list(pool))
    if fallback:
        return rng.choice(list(fallback))
    raise ValueError("No staff records are available for encounter generation")


def encounter_created_at(rng: random.Random, generated_at: datetime) -> datetime:
    days = rng.randint(0, 89)
    minutes = rng.randint(0, 23 * 60 + 59)
    return generated_at - timedelta(days=days, minutes=minutes)


def resolve_fit_to_fly(profile: ClinicalProfile, staff_meta: Optional[Dict[str, Any]]) -> str:
    if profile.key == "MANDATED_IMMUNIZATION_FEVER":
        if staff_meta and staff_meta.get("is_safety_sensitive_crew") and staff_meta.get("duty_status") == "ACTIVE":
            return "RESTRICTED"
        return "NOT_APPLICABLE"
    return profile.fit_to_fly_status


def make_clipboard_payload(
    profile: ClinicalProfile,
    match: Dict[str, Any],
    fit_to_fly_status: str,
    staff_number: str,
    patient_age: int,
) -> Dict[str, Any]:
    return {
        "synthetic": True,
        "english_sbar": {
            "situation": profile.symptom,
            "background": f"Synthetic encounter for {staff_number}; patient age {patient_age}.",
            "assessment": f"{profile.severity} severity, score {profile.score}, protocol {match['title_en']}.",
            "recommendation": f"Route to {profile.destination}; fit-to-fly {fit_to_fly_status}.",
        },
        "arabic_summary_placeholder": "Synthetic bilingual SBAR placeholder for controlled test data only.",
        "llm_training_target": {
            "deterministic_rules_control_disposition": True,
            "ai_role": "explain, summarize, and draft only",
            "nurse_approval_required": True,
        },
    }


def generate_encounters(
    encounter_count: int,
    rng: random.Random,
    generated_at: datetime,
    profiles: Sequence[ClinicalProfile],
    anchors: Sequence[ProtocolAnchor],
    pools: Dict[str, List[str]],
    staff_lookup: Dict[str, Dict[str, Any]],
    young_dependents: Sequence[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    profile_counts = allocate_counts(encounter_count, [(profile.key, profile.share) for profile in profiles])
    profile_by_key = {profile.key: profile for profile in profiles}
    encounters: List[Dict[str, Any]] = []

    for profile_key, count in profile_counts.items():
        profile = profile_by_key[profile_key]
        for _ in range(count):
            dependent_record: Optional[Dict[str, Any]] = None
            if profile.patient_pool == "young_dependent":
                if not young_dependents:
                    raise ValueError("Pediatric encounter generation requires at least one dependent under 5")
                dependent_record = rng.choice(list(young_dependents))
                staff_member_id = dependent_record["staff_member_id"]
                patient_age = int(dependent_record["age"])
            else:
                staff_member_id = choose_staff_id(rng, pools.get(profile.patient_pool, []), pools["any_staff"])
                patient_age = int(staff_lookup[staff_member_id]["age"])

            staff_meta = staff_lookup[staff_member_id]
            vector = jitter_vector(rng, profile.vector)
            match = match_protocol(vector, anchors)
            fit_to_fly_status = resolve_fit_to_fly(profile, staff_meta)
            created_at = encounter_created_at(rng, generated_at)
            completed_at = created_at + timedelta(minutes=rng.randint(8, 55))
            encounter_id = deterministic_uuid(rng)
            staff_number = staff_meta["ist_staff_id"]
            tags = list(profile.aviation_tags)
            if profile.key == "MANDATED_IMMUNIZATION_FEVER" and fit_to_fly_status == "RESTRICTED":
                tags.extend(["ground-duty-rest-24h", "active-crew"])

            encounters.append(
                {
                    "id": encounter_id,
                    "staff_member_id": staff_member_id,
                    "dependent_id": dependent_record["id"] if dependent_record else None,
                    "protocol_used_id": match["protocol_used_id"],
                    "initial_acuity_score": profile.score,
                    "final_disposition_code": profile.disposition_code,
                    "audio_recording_url": None,
                    "transcript_text": profile.transcript,
                    "transcript_language": "en",
                    "custom_aviation_tags": {
                        "synthetic": True,
                        "clinical_profile": profile.key,
                        "semantic_vector": vector,
                        "semantic_match": match,
                        "severity": profile.severity,
                        "score": profile.score,
                        "destination": profile.destination,
                        "fit_to_fly_status": fit_to_fly_status,
                        "ground_duty_rest_hours": 24 if "ground-duty-rest-24h" in tags else 0,
                        "tags": tags,
                        "vitals": profile.vitals,
                    },
                    "clipboard_payload": make_clipboard_payload(profile, match, fit_to_fly_status, staff_number, patient_age),
                    "nurse_id": f"SYN-NURSE-{rng.randint(1, 18):03d}",
                    "completed_at": iso(completed_at),
                    "created_at": iso(created_at),
                    "updated_at": iso(completed_at),
                }
            )

    rng.shuffle(encounters)
    return encounters


def audit_rationale(encounter: Dict[str, Any]) -> Tuple[str, str, str]:
    profile = encounter["custom_aviation_tags"]["clinical_profile"]
    fit_to_fly = encounter["custom_aviation_tags"]["fit_to_fly_status"]

    if profile == "HIGH_ACUITY_CARDIAC_EMERGENCY":
        return (
            "ROUTINE",
            "AI summary underweighted low SpO2 and tachycardia. Mandatory RED floor required HMC emergency escalation.",
            "NURSE_OVERRIDE_UP",
        )
    if profile == "PEDIATRIC_RESPIRATORY_DISTRESS":
        return (
            "URGENT",
            "Pediatric respiratory rate breached the tachypnea safety floor; nurse escalated to Sidra emergency routing.",
            "NURSE_OVERRIDE_UP",
        )
    if profile == "CABIN_CREW_BACK_PAIN":
        return (
            "HOMECARE",
            "AI suggested self-care, but active cabin crew injury requires temporary duty restriction and HIA medical review.",
            "AI_RECOMMENDATION_DIFFERED",
        )
    if profile == "PILOT_EAR_BAROTRAUMA":
        return (
            "HOMECARE",
            "Pilot barotrauma symptoms create aviation safety risk; nurse required fit-to-fly review before next duty.",
            "AI_RECOMMENDATION_DIFFERED",
        )
    if fit_to_fly == "RESTRICTED":
        return (
            "HOMECARE",
            "Home-care advice remained appropriate clinically, but crew status required 24-hour ground-duty safety rest.",
            "REVIEW_REQUIRED",
        )
    return (
        "HOMECARE",
        "Rules-engine disposition retained; audit log records nurse review and employee-specific safety counseling.",
        "RULES_ENGINE_FINAL",
    )


def generate_audit_logs(
    encounters: Sequence[Dict[str, Any]],
    rng: random.Random,
    generated_at: datetime,
) -> List[Dict[str, Any]]:
    audit_count = int(round(len(encounters) * 0.05))
    sampled = rng.sample(list(encounters), audit_count)
    logs: List[Dict[str, Any]] = []

    for encounter in sampled:
        original_ai, rationale, flag = audit_rationale(encounter)
        tags = encounter["custom_aviation_tags"]
        logs.append(
            {
                "id": deterministic_uuid(rng),
                "encounter_id": encounter["id"],
                "original_ai_recommendation": original_ai,
                "nurse_override_rationale": rationale,
                "rules_engine_severity": tags["severity"],
                "override_status_flag": flag,
                "explainability_trace": {
                    "synthetic": True,
                    "clinical_profile": tags["clinical_profile"],
                    "semantic_match": tags["semantic_match"],
                    "vitals": tags["vitals"],
                    "fit_to_fly_status": tags["fit_to_fly_status"],
                    "final_disposition_code": encounter["final_disposition_code"],
                    "rules_first_ai_second": True,
                },
                "created_at": iso(generated_at),
            }
        )
    return logs


def summarize_dataset(
    staff_members: Sequence[Dict[str, Any]],
    dependents: Sequence[Dict[str, Any]],
    encounters: Sequence[Dict[str, Any]],
    audit_logs: Sequence[Dict[str, Any]],
) -> Dict[str, Any]:
    def count_by(records: Iterable[Dict[str, Any]], key: str) -> Dict[str, int]:
        counts: Dict[str, int] = {}
        for record in records:
            value = str(record[key])
            counts[value] = counts.get(value, 0) + 1
        return dict(sorted(counts.items()))

    profile_counts: Dict[str, int] = {}
    fit_counts: Dict[str, int] = {}
    for encounter in encounters:
        tags = encounter["custom_aviation_tags"]
        profile = tags["clinical_profile"]
        fit = tags["fit_to_fly_status"]
        profile_counts[profile] = profile_counts.get(profile, 0) + 1
        fit_counts[fit] = fit_counts.get(fit, 0) + 1

    return {
        "staff_count": len(staff_members),
        "dependent_count": len(dependents),
        "encounter_count": len(encounters),
        "audit_log_count": len(audit_logs),
        "staff_by_department": count_by(staff_members, "department"),
        "staff_by_duty_status": count_by(staff_members, "duty_status"),
        "insurance_status": count_by(staff_members, "insurance_eligibility_status"),
        "encounters_by_profile": dict(sorted(profile_counts.items())),
        "encounters_by_disposition": count_by(encounters, "final_disposition_code"),
        "encounters_by_fit_to_fly": dict(sorted(fit_counts.items())),
    }


def generate_dataset(
    aircraft_count: int = DEFAULT_AIRCRAFT_COUNT,
    encounter_count: int = DEFAULT_ENCOUNTER_COUNT,
    seed: int = 20260711,
) -> Dict[str, Any]:
    if aircraft_count <= 0:
        raise ValueError("aircraft_count must be positive")
    if encounter_count <= 0:
        raise ValueError("encounter_count must be positive")

    rng = random.Random(seed)
    generated_at = datetime.now(timezone.utc).replace(microsecond=0)
    anchors = build_protocol_anchors()
    profiles = build_clinical_profiles()

    protocol_releases, algorithms = make_protocol_records(generated_at, anchors)
    staff_members, staff_index, pools = generate_staff(aircraft_count, rng, generated_at)
    dependents, _dependents_by_staff, young_dependents = generate_dependents(staff_index, rng, generated_at)
    oracle_hcm_api_payloads = make_oracle_hcm_payloads(staff_index, dependents, generated_at)
    staff_lookup = make_staff_lookup(staff_index)
    encounters = generate_encounters(
        encounter_count=encounter_count,
        rng=rng,
        generated_at=generated_at,
        profiles=profiles,
        anchors=anchors,
        pools=pools,
        staff_lookup=staff_lookup,
        young_dependents=young_dependents,
    )
    audit_logs = generate_audit_logs(encounters, rng, generated_at)
    workforce_counts = make_workforce_counts(aircraft_count)

    return {
        "metadata": {
            "synthetic": True,
            "organization": "IST Tech",
            "region": "QA",
            "generated_at": iso(generated_at),
            "random_seed": seed,
            "employee_source_of_truth": "Oracle Fusion HCM read-only API feed",
            "normalized_projection_note": (
                "staff_members and dependents are IST triage projections derived from the "
                "oracle_fusion_hcm_api collections."
            ),
            "fleet": {
                "active_wide_body_aircraft": aircraft_count,
                "employee_ratio_per_aircraft": 100,
                "pilot_ratio_per_aircraft": 16.5,
                "cabin_crew_ratio_per_aircraft": 20,
            },
            "safety_notice": (
                "Synthetic workforce and encounter data only. Use for database seeding, simulation, "
                "LLM evaluation, and governed AI copilot training. Do not treat as PHI or clinical truth."
            ),
            "workforce_math": workforce_counts,
            "clinical_profile_shares": {profile.key: profile.share for profile in profiles},
            "semantic_vector_threshold": VECTOR_THRESHOLD,
        },
        "protocol_releases": protocol_releases,
        "algorithms": algorithms,
        "oracle_fusion_hcm_api": oracle_hcm_api_payloads,
        "staff_members": staff_members,
        "dependents": dependents,
        "aviation_triage_encounters": encounters,
        "safety_audit_deviation_logs": audit_logs,
        "statistics": summarize_dataset(staff_members, dependents, encounters, audit_logs),
    }


def write_json(dataset: Dict[str, Any], output_path: str) -> None:
    parent = os.path.dirname(output_path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(dataset, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("value must be positive")
    return parsed


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate synthetic IST Tech aviation employee and triage seed data.")
    parser.add_argument("--aircraft", type=positive_int, default=DEFAULT_AIRCRAFT_COUNT)
    parser.add_argument("--encounters", type=positive_int, default=DEFAULT_ENCOUNTER_COUNT)
    parser.add_argument("--seed", type=int, default=20260711)
    parser.add_argument("--output", default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--print-summary", action="store_true")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    dataset = generate_dataset(aircraft_count=args.aircraft, encounter_count=args.encounters, seed=args.seed)
    write_json(dataset, args.output)
    summary = {
        "output": args.output,
        "staff_members": dataset["statistics"]["staff_count"],
        "dependents": dataset["statistics"]["dependent_count"],
        "encounters": dataset["statistics"]["encounter_count"],
        "audit_logs": dataset["statistics"]["audit_log_count"],
    }
    if args.print_summary:
        print(json.dumps({**summary, "statistics": dataset["statistics"]}, indent=2))
    else:
        print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
