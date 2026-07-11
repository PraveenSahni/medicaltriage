"""Stream a large end-to-end synthetic triage simulation to partitioned JSONL.

The runner executes the same logical path as the complete simulation engine:

Oracle-style employee feed -> staff/dependent verification -> vector retrieval
-> nurse state machine -> safety floor -> NEWS2 -> aviation gate -> SBAR/FHIR
write-back simulation -> audit telemetry.

Rows are written as compact JSONL partitions by month so million-row runs do not
need a single huge in-memory JSON document.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from clinical_simulation_engine import (
    EMRWritebackEngine,
    EmployeeSimulator,
    PatientVitals,
    SimulatedPatientCase,
    TriageNurseSimulator,
    VectorKnowledgeEngine,
)
from generate_synthetic_pdp_data import allocate_counts
from regional_context import RegionalContextEngine


PROFILE_WEIGHTS = [
    ("HIGH_ACUITY_CARDIAC_EMERGENCY", 0.10),
    ("PEDIATRIC_RESPIRATORY_DISTRESS", 0.13),
    ("PEDIATRIC_FEVER_DEHYDRATION", 0.12),
    ("CABIN_CREW_BACK_PAIN", 0.20),
    ("PILOT_EAR_BAROTRAUMA", 0.15),
    ("MANDATED_IMMUNIZATION_FEVER", 0.15),
    ("FEMALE_HEALTH_URINARY", 0.07),
    ("FEMALE_PREGNANCY_RED_FLAG", 0.04),
    ("MALE_GENITOURINARY_URGENT", 0.04),
]


@dataclass(frozen=True)
class BulkRunConfig:
    record_count: int
    start_date: datetime
    end_date: datetime
    output_dir: str
    aircraft_count: int
    seed: int
    audit_rate: float
    write_training_output: bool = True


def parse_date(value: str, end_of_day: bool = False) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    parsed = parsed.astimezone(timezone.utc)
    if end_of_day and "T" not in value:
        parsed = parsed.replace(hour=23, minute=59, second=59)
    return parsed


def month_key(value: datetime) -> str:
    return value.strftime("%Y_%m")


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def counter_add(counter: Dict[str, int], key: str, amount: int = 1) -> None:
    counter[key] = counter.get(key, 0) + amount


def select_profiles(record_count: int, rng: random.Random) -> List[str]:
    counts = allocate_counts(record_count, PROFILE_WEIGHTS)
    profiles: List[str] = []
    for key, count in counts.items():
        profiles.extend([key] * count)
    rng.shuffle(profiles)
    return profiles


class PartitionWriter:
    def __init__(self, output_dir: str) -> None:
        self.output_dir = output_dir
        self.handles: Dict[str, Any] = {}
        self.rows: Dict[str, int] = {}
        self.paths: Dict[str, str] = {}
        os.makedirs(output_dir, exist_ok=True)

    def write(self, occurred_at: datetime, row: Dict[str, Any]) -> None:
        key = month_key(occurred_at)
        if key not in self.handles:
            path = os.path.join(self.output_dir, f"clinical_simulation_{key}.jsonl")
            self.paths[key] = path
            self.handles[key] = open(path, "w", encoding="utf-8")
            self.rows[key] = 0
        self.handles[key].write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
        self.rows[key] += 1

    def close(self) -> List[Dict[str, Any]]:
        for handle in self.handles.values():
            handle.close()
        partitions: List[Dict[str, Any]] = []
        for key in sorted(self.paths):
            path = self.paths[key]
            partitions.append(
                {
                    "month": key,
                    "path": path,
                    "rows": self.rows[key],
                    "bytes": os.path.getsize(path),
                }
            )
        return partitions


class BulkClinicalSimulationRunner:
    def __init__(self, config: BulkRunConfig) -> None:
        self.config = config
        self.rng = random.Random(config.seed)
        self.employees = EmployeeSimulator(
            aircraft_count=config.aircraft_count,
            encounter_count=100,
            seed=config.seed,
        )
        self.knowledge = VectorKnowledgeEngine()
        self.triage = TriageNurseSimulator(self.employees, self.knowledge)
        self.regional_context = RegionalContextEngine()
        self.active_pilots = [
            staff
            for staff in self.employees.staff_members
            if staff["department"] == "Flight Operations" and staff["duty_status"] == "ACTIVE"
        ]
        self.active_cabin = [
            staff
            for staff in self.employees.staff_members
            if staff["department"] == "Inflight Services" and staff["duty_status"] == "ACTIVE"
        ]
        self.any_staff = list(self.employees.staff_members)
        self.young_dependents = [dep for dep in self.employees.dependents if int(dep["age"]) <= 4]

    def occurred_at_for_index(self, index: int) -> datetime:
        if self.config.record_count <= 1:
            return self.config.start_date
        total_seconds = max(1, int((self.config.end_date - self.config.start_date).total_seconds()))
        offset = int(index * total_seconds / (self.config.record_count - 1))
        return self.config.start_date + timedelta(seconds=offset)

    def sampled_ai_severity(self, final_floor: str, profile: str) -> tuple[str, Optional[str]]:
        audit_sample = self.rng.random() < self.config.audit_rate
        if not audit_sample:
            return final_floor, None

        if final_floor == "EMERGENCY":
            return "URGENT", "AI lower-acuity suggestion sampled for safety-gateway regression."
        if final_floor == "URGENT":
            return "ROUTINE", "AI routine suggestion sampled for urgent-context regression."
        if final_floor == "ROUTINE":
            return "HOMECARE", "AI self-care suggestion sampled for occupational medicine review."
        return "HOMECARE", "Nurse review sample for home-care counseling and callback precautions."

    def make_case(self, profile: str, index: int) -> SimulatedPatientCase:
        case_suffix = f"{index + 1:07d}"
        if profile == "HIGH_ACUITY_CARDIAC_EMERGENCY":
            staff = self.rng.choice(self.active_pilots)
            ai, rationale = self.sampled_ai_severity("EMERGENCY", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Pilot cardiac emergency bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                symptom_text="Acute crushing chest pain radiating to left arm and jaw with profuse sweating.",
                symptom_vector=[0.98, 0.22, 0.04, 0.04, 0.03],
                vitals=PatientVitals(heart_rate=138, respiratory_rate=32, spo2=90, temperature_c=36.8),
                patient_age_years=44,
                biological_sex="MALE",
                patient_context={"age_band": "adult", "context_group": "male_health", "aviation_role": "pilot"},
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
                sickness_leave_requested=True,
            )

        if profile == "PEDIATRIC_RESPIRATORY_DISTRESS":
            dependent = self.rng.choice(self.young_dependents)
            staff = self.employees.staff_by_id[dependent["staff_member_id"]]
            ai, rationale = self.sampled_ai_severity("EMERGENCY", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Pediatric respiratory distress bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                dependent_id=dependent["id"],
                symptom_text="Barking cough, stridor on inspiration, struggling for breath.",
                symptom_vector=[0.08, 0.98, 0.02, 0.18, 0.04],
                vitals=PatientVitals(heart_rate=112, respiratory_rate=45, spo2=95, temperature_c=38.4),
                patient_age_years=max(1, int(dependent["age"])),
                patient_age_months=max(12, int(dependent["age"]) * 12),
                biological_sex=dependent.get("biological_sex", "UNKNOWN"),
                patient_context={"age_band": "child_under_5", "context_group": "pediatric", "dependent": True},
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
            )

        if profile == "PEDIATRIC_FEVER_DEHYDRATION":
            dependent = self.rng.choice(self.young_dependents)
            staff = self.employees.staff_by_id[dependent["staff_member_id"]]
            ai, rationale = self.sampled_ai_severity("URGENT", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Pediatric fever and dehydration bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                dependent_id=dependent["id"],
                symptom_text="High fever with vomiting, diarrhea, dry mouth, and reduced urine.",
                symptom_vector=[0.05, 0.45, 0.10, 0.88, 0.22],
                vitals=PatientVitals(heart_rate=122, respiratory_rate=28, spo2=98, temperature_c=39.1),
                patient_age_years=max(1, int(dependent["age"])),
                patient_age_months=max(12, int(dependent["age"]) * 12),
                biological_sex=dependent.get("biological_sex", "UNKNOWN"),
                patient_context={
                    "age_band": "child_under_5",
                    "context_group": "pediatric",
                    "dehydration_risk": True,
                    "dependent": True,
                },
                minimum_severity="URGENT",
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
            )

        if profile == "CABIN_CREW_BACK_PAIN":
            staff = self.rng.choice(self.active_cabin)
            ai, rationale = self.sampled_ai_severity("ROUTINE", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Cabin crew back pain bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                symptom_text="Lower back strain after lifting heavy galley cart during descent.",
                symptom_vector=[0.03, 0.03, 0.98, 0.04, 0.12],
                vitals=PatientVitals(heart_rate=72, respiratory_rate=14, spo2=99, temperature_c=36.6),
                patient_age_years=29,
                biological_sex="UNKNOWN",
                patient_context={"age_band": "adult", "context_group": "musculoskeletal", "aviation_role": "cabin_crew"},
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
                sickness_leave_requested=True,
            )

        if profile == "PILOT_EAR_BAROTRAUMA":
            staff = self.rng.choice(self.active_pilots)
            ai, rationale = self.sampled_ai_severity("ROUTINE", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Pilot ear barotrauma bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                symptom_text="Severe ear pain and pressure on descent with head congestion.",
                symptom_vector=[0.03, 0.18, 0.06, 0.06, 0.98],
                vitals=PatientVitals(heart_rate=74, respiratory_rate=14, spo2=99, temperature_c=37.2),
                patient_age_years=39,
                biological_sex="MALE",
                patient_context={"age_band": "adult", "context_group": "male_health", "aviation_role": "pilot"},
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
                sickness_leave_requested=True,
            )

        if profile == "FEMALE_HEALTH_URINARY":
            staff = self.rng.choice(self.any_staff)
            ai, rationale = self.sampled_ai_severity("ROUTINE", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Female urinary symptoms bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                symptom_text="Burning urination, frequency, lower abdominal discomfort, no flank pain.",
                symptom_vector=[0.10, 0.05, 0.30, 0.30, 0.88],
                vitals=PatientVitals(heart_rate=84, respiratory_rate=16, spo2=99, temperature_c=37.4),
                patient_age_years=32,
                biological_sex="FEMALE",
                patient_context={
                    "age_band": "adult",
                    "context_group": "female_health",
                    "pregnancy_status": "not_reported",
                    "red_flags_screened": ["flank_pain", "pregnancy", "fever"],
                },
                minimum_severity="ROUTINE",
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
            )

        if profile == "FEMALE_PREGNANCY_RED_FLAG":
            staff = self.rng.choice(self.any_staff)
            ai, rationale = self.sampled_ai_severity("EMERGENCY", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Female pregnancy red-flag bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                symptom_text="Pregnant employee reports vaginal bleeding, abdominal pain, and dizziness.",
                symptom_vector=[0.12, 0.08, 0.34, 0.22, 0.92],
                vitals=PatientVitals(heart_rate=118, respiratory_rate=22, spo2=97, temperature_c=36.9),
                patient_age_years=30,
                biological_sex="FEMALE",
                patient_context={
                    "age_band": "adult",
                    "context_group": "female_health",
                    "pregnancy_status": "reported_pregnant",
                    "red_flags_screened": ["bleeding", "abdominal_pain", "dizziness"],
                },
                minimum_severity="EMERGENCY",
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
            )

        if profile == "MALE_GENITOURINARY_URGENT":
            staff = self.rng.choice(self.any_staff)
            ai, rationale = self.sampled_ai_severity("URGENT", profile)
            return SimulatedPatientCase(
                case_id=f"{profile}-{case_suffix}",
                name="Male genitourinary urgent bulk simulation",
                ist_staff_id=staff["ist_staff_id"],
                symptom_text="Sudden testicular pain and swelling with nausea, no trauma reported.",
                symptom_vector=[0.05, 0.04, 0.55, 0.05, 0.82],
                vitals=PatientVitals(heart_rate=96, respiratory_rate=18, spo2=99, temperature_c=36.8),
                patient_age_years=27,
                biological_sex="MALE",
                patient_context={
                    "age_band": "adult",
                    "context_group": "male_health",
                    "red_flags_screened": ["testicular_pain", "swelling", "nausea"],
                },
                minimum_severity="URGENT",
                ai_suggested_severity=ai,  # type: ignore[arg-type]
                nurse_override_rationale=rationale,
            )

        staff = self.rng.choice(self.any_staff)
        ai, rationale = self.sampled_ai_severity("HOMECARE", profile)
        recent_vaccination_hours = 24
        return SimulatedPatientCase(
            case_id=f"{profile}-{case_suffix}",
            name="Mandated immunization fever bulk simulation",
            ist_staff_id=staff["ist_staff_id"],
            symptom_text="Slight fever, muscle soreness, and headache after mandated booster shot.",
            symptom_vector=[0.05, 0.05, 0.16, 0.98, 0.08],
            vitals=PatientVitals(heart_rate=82, respiratory_rate=16, spo2=98, temperature_c=37.8),
            patient_age_years=33,
            biological_sex="UNKNOWN",
            patient_context={"age_band": "adult", "context_group": "immunization", "recent_vaccination_hours": 24},
            ai_suggested_severity=ai,  # type: ignore[arg-type]
            nurse_override_rationale=rationale,
            recent_vaccination_hours=recent_vaccination_hours,
        )

    @staticmethod
    def compact_row(
        result: Dict[str, Any],
        occurred_at: datetime,
        profile: str,
        fhir_entry_count: int,
        regional_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        staff = result["staff"]
        return {
            "encounter_id": result["encounter_id"],
            "occurred_at": iso(occurred_at),
            "synthetic": True,
            "profile": profile,
            "staff": {
                "ist_staff_id": staff["ist_staff_id"],
                "department": staff["department"],
                "job_title": staff["job_title"],
                "duty_status": staff["duty_status"],
            },
            "dependent_id": result["dependent"]["id"] if result.get("dependent") else None,
            "patient_context": result["patient_context"],
            "biological_sex": result["biological_sex"],
            "regional_context": regional_context,
            "protocol": result["protocol"],
            "vitals": result["vitals"],
            "score": result["score"],
            "severity": result["severity"],
            "route": result["route"],
            "fit_to_fly_status": result["fit_to_fly_status"],
            "safety_floor_triggered": result["safety_floor"]["override_triggered"],
            "ai_suggested_severity": result["ai_suggested_severity"],
            "ai_downgrade_blocked": result["ai_downgrade_blocked"],
            "fhir_writeback": {
                "simulated": True,
                "bundle_type": "transaction",
                "entry_count": fhir_entry_count,
                "resource_types": ["Encounter", "Observation", "ClinicalImpression"],
            },
        }

    @staticmethod
    def compact_audit(
        result: Dict[str, Any], occurred_at: datetime, profile: str, regional_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "encounter_id": result["encounter_id"],
            "occurred_at": iso(occurred_at),
            "synthetic": True,
            "profile": profile,
            "original_ai_recommendation": result["ai_suggested_severity"],
            "rules_engine_severity": result["severity"],
            "override_status_flag": "NURSE_OVERRIDE_UP" if result["ai_downgrade_blocked"] else "REVIEW_REQUIRED",
            "nurse_override_rationale": result.get("nurse_override_rationale")
            or "Sampled nurse review event for synthetic bulk simulation.",
            "explainability_trace": {
                "protocol": result["protocol"],
                "safety_floor": result["safety_floor"],
                "route": result["route"],
                "fit_to_fly_status": result["fit_to_fly_status"],
                "regional_context": {
                    "season": regional_context["climate"]["season"],
                    "heat_risk": regional_context["climate"]["heat_risk"],
                    "dust_risk": regional_context["climate"]["dust_risk"],
                    "health_impact_tags": regional_context["health"]["health_impact_tags"],
                },
                "pdppl_audit_ready": True,
            },
        }

    @staticmethod
    def training_row(
        result: Dict[str, Any], occurred_at: datetime, profile: str, regional_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        user_payload = {
            "synthetic": True,
            "occurred_at": iso(occurred_at),
            "profile": profile,
            "staff": {
                "department": result["staff"]["department"],
                "job_title": result["staff"]["job_title"],
                "duty_status": result["staff"]["duty_status"],
            },
            "dependent_case": result.get("dependent") is not None,
            "biological_sex": result["biological_sex"],
            "patient_context": result["patient_context"],
            "regional_context": {
                "climate": {
                    "season": regional_context["climate"]["season"],
                    "temperature_max_c": regional_context["climate"]["temperature_max_c"],
                    "apparent_temperature_max_c": regional_context["climate"]["apparent_temperature_max_c"],
                    "relative_humidity_mean_percent": regional_context["climate"]["relative_humidity_mean_percent"],
                    "heat_risk": regional_context["climate"]["heat_risk"],
                    "dust_risk": regional_context["climate"]["dust_risk"],
                    "respiratory_season": regional_context["climate"]["respiratory_season"],
                },
                "health_impact_tags": regional_context["health"]["health_impact_tags"],
                "vulnerable_groups": regional_context["health"]["vulnerable_groups"],
                "triage_cautions": regional_context["health"]["triage_cautions"],
            },
            "symptom_text": result["symptom_text"],
            "vitals": result["vitals"],
            "ai_suggested_severity": result["ai_suggested_severity"],
        }
        expected_output = {
            "protocol": result["protocol"],
            "safety_floor_triggered": result["safety_floor"]["override_triggered"],
            "score": result["score"],
            "final_severity": result["severity"],
            "route": result["route"],
            "fit_to_fly_status": result["fit_to_fly_status"],
            "ai_downgrade_blocked": result["ai_downgrade_blocked"],
            "nurse_approval_required": True,
            "regional_context_used_for_explanation_only": True,
        }
        return {
            "id": result["encounter_id"],
            "synthetic": True,
            "purpose": "llm-evaluation-and-governed-copilot-training",
            "safety_notice": "Synthetic only. Use to evaluate or train advisory AI behavior; deterministic rules and nurse approval remain authoritative.",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an IST Tech tele-triage AI copilot. Explain, summarize, and draft only. Never downgrade deterministic safety floors or aviation restrictions.",
                },
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False, sort_keys=True)},
                {"role": "assistant", "content": json.dumps(expected_output, ensure_ascii=False, sort_keys=True)},
            ],
            "expected_output": expected_output,
        }

    def run(self) -> Dict[str, Any]:
        start = time.time()
        encounter_writer = PartitionWriter(os.path.join(self.config.output_dir, "encounters"))
        audit_writer = PartitionWriter(os.path.join(self.config.output_dir, "audit"))
        training_writer = (
            PartitionWriter(os.path.join(self.config.output_dir, "training"))
            if self.config.write_training_output
            else None
        )
        profiles = select_profiles(self.config.record_count, self.rng)
        counts: Dict[str, Dict[str, int]] = {
            "by_profile": {},
            "by_month": {},
            "by_severity": {},
            "by_route": {},
            "by_fit_to_fly": {},
        }
        audit_count = 0
        samples: List[Dict[str, Any]] = []

        for index, profile in enumerate(profiles):
            occurred_at = self.occurred_at_for_index(index)
            case = self.make_case(profile, index)
            result = self.triage.run_case(case)
            regional_context = self.regional_context.context_for(
                occurred_at=occurred_at,
                patient_context=result["patient_context"],
                biological_sex=result["biological_sex"],
                patient_age_years=result["patient_age_years"],
            )
            sbar = EMRWritebackEngine.compile_sbar(result)
            fhir_bundle = EMRWritebackEngine.fhir_transaction(result, sbar)
            row = self.compact_row(result, occurred_at, profile, len(fhir_bundle["entry"]), regional_context)
            encounter_writer.write(occurred_at, row)
            if training_writer is not None:
                training_writer.write(occurred_at, self.training_row(result, occurred_at, profile, regional_context))

            counter_add(counts["by_profile"], profile)
            counter_add(counts["by_month"], month_key(occurred_at))
            counter_add(counts["by_severity"], result["severity"])
            counter_add(counts["by_route"], result["route"])
            counter_add(counts["by_fit_to_fly"], result["fit_to_fly_status"])

            if result["ai_downgrade_blocked"] or result.get("nurse_override_rationale"):
                audit_writer.write(occurred_at, self.compact_audit(result, occurred_at, profile, regional_context))
                audit_count += 1

            if len(samples) < 3:
                samples.append({"encounter": row, "sbar_markdown": sbar, "fhir_transaction": fhir_bundle})

        encounter_partitions = encounter_writer.close()
        audit_partitions = audit_writer.close()
        training_partitions = training_writer.close() if training_writer is not None else []
        elapsed = round(time.time() - start, 3)
        manifest = {
            "synthetic": True,
            "generated_at": iso(datetime.now(timezone.utc)),
            "record_count": self.config.record_count,
            "audit_record_count": audit_count,
            "start_date": iso(self.config.start_date),
            "end_date": iso(self.config.end_date),
            "output_dir": self.config.output_dir,
            "aircraft_count": self.config.aircraft_count,
            "seed": self.config.seed,
            "audit_rate": self.config.audit_rate,
            "employee_source": "synthetic_oracle_fusion_hcm_api",
            "regional_context": {
                "enabled": True,
                "mode": "deterministic_climatology_fallback_with_open_data_hydration_contract",
                "weather_point": {"latitude": self.regional_context.latitude, "longitude": self.regional_context.longitude},
                "open_data_sources": [
                    "NASA POWER Daily API",
                    "Open-Meteo Historical Weather API",
                    "WHO heat and health",
                    "WHO ambient outdoor air pollution",
                    "WMO sand and dust storms",
                    "World Bank Qatar indicators",
                ],
            },
            "elapsed_seconds": elapsed,
            "counts": counts,
            "encounter_partitions": encounter_partitions,
            "audit_partitions": audit_partitions,
            "training_partitions": training_partitions,
            "samples": samples,
        }
        manifest_path = os.path.join(self.config.output_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as handle:
            json.dump(manifest, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        manifest["manifest_path"] = manifest_path
        return manifest


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a partitioned bulk IST Tech clinical simulation.")
    parser.add_argument("--records", type=int, default=1_000_000)
    parser.add_argument("--start-date", default="2024-01-01")
    parser.add_argument("--end-date", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--output-dir", default=os.path.join("data", "generated", "bulk_clinical_sim_1m"))
    parser.add_argument("--aircraft", type=int, default=260)
    parser.add_argument("--seed", type=int, default=20240711)
    parser.add_argument("--audit-rate", type=float, default=0.05)
    parser.add_argument("--skip-training-output", action="store_true")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.records <= 0:
        raise ValueError("--records must be positive")
    if not (0 <= args.audit_rate <= 1):
        raise ValueError("--audit-rate must be between 0 and 1")
    config = BulkRunConfig(
        record_count=args.records,
        start_date=parse_date(args.start_date),
        end_date=parse_date(args.end_date, end_of_day=True),
        output_dir=args.output_dir,
        aircraft_count=args.aircraft,
        seed=args.seed,
        audit_rate=args.audit_rate,
        write_training_output=not args.skip_training_output,
    )
    manifest = BulkClinicalSimulationRunner(config).run()
    print(
        json.dumps(
            {
                "synthetic": manifest["synthetic"],
                "record_count": manifest["record_count"],
                "audit_record_count": manifest["audit_record_count"],
                "start_date": manifest["start_date"],
                "end_date": manifest["end_date"],
                "output_dir": manifest["output_dir"],
                "manifest_path": manifest["manifest_path"],
                "elapsed_seconds": manifest["elapsed_seconds"],
                "encounter_partitions": len(manifest["encounter_partitions"]),
                "audit_partitions": len(manifest["audit_partitions"]),
                "training_partitions": len(manifest["training_partitions"]),
                "counts": manifest["counts"],
            },
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
