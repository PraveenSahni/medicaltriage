"""Rules-first AI copilot safety wrapper for the IST Qatar tele-triage MVP.

This service intentionally uses a small localized mock ruleset. Production use
requires licensed clinical content, governed translation, clinical safety review,
and approved EMR/HRMS integration.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SEVERITY_RANK = {
    "Self-care": 1,
    "Routine": 2,
    "Urgent": 3,
    "Emergency": 4,
}


@dataclass(frozen=True)
class RuleHit:
    rule_id: str
    matched: bool
    severity: str
    rationale: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "matched": self.matched,
            "severity": self.severity,
            "rationale": self.rationale,
        }


def _joined_text(symptoms: dict[str, Any]) -> str:
    fields = [
        symptoms.get("chief_complaint", ""),
        symptoms.get("narrative", ""),
        *symptoms.get("red_flags", []),
    ]
    return " ".join(str(field) for field in fields).lower()


def _has_any(text: str, terms: list[str]) -> bool:
    return any(term in text for term in terms)


def evaluate_mock_stcc_floor(symptoms: dict[str, Any]) -> tuple[str, list[RuleHit]]:
    """Return the deterministic safety floor and an explainability trace."""
    text = _joined_text(symptoms)
    duration_minutes = int(symptoms.get("duration_minutes") or 0)
    hits: list[RuleHit] = []
    floor = "Self-care"

    emergency_rules = [
        RuleHit(
            rule_id="STCC_MOCK_CHEST_PAIN_SWEATING",
            matched="chest" in text and _has_any(text, ["sweat", "diaphoresis", "tight"]),
            severity="Emergency",
            rationale="Chest pain/tightness with sweating is treated as an emergency safety floor.",
        ),
        RuleHit(
            rule_id="STCC_MOCK_SEVERE_CONSTANT_PAIN_GT_60",
            matched=_has_any(text, ["severe", "constant"])
            and _has_any(text, ["chest", "abdominal", "abdomen"])
            and duration_minutes >= 60,
            severity="Emergency",
            rationale="Severe constant chest or abdominal pain for 60+ minutes cannot be downgraded.",
        ),
        RuleHit(
            rule_id="STCC_MOCK_BREATHING_OR_CONSCIOUSNESS",
            matched=_has_any(
                text,
                ["shortness of breath", "difficulty breathing", "altered consciousness", "unresponsive"],
            ),
            severity="Emergency",
            rationale="Breathing difficulty or altered consciousness requires emergency disposition.",
        ),
        RuleHit(
            rule_id="STCC_MOCK_STROKE_OR_ANAPHYLAXIS",
            matched=_has_any(
                text,
                ["face droop", "slurred speech", "one-sided weakness", "anaphylaxis", "throat swelling"],
            ),
            severity="Emergency",
            rationale="Stroke/anaphylaxis warning terms require emergency disposition.",
        ),
    ]

    for rule in emergency_rules:
        hits.append(rule)
        if rule.matched:
            floor = "Emergency"

    if floor != "Emergency":
        urgent_rule = RuleHit(
            rule_id="STCC_MOCK_URGENT_REVIEW",
            matched=_has_any(text, ["moderate pain", "persistent vomiting", "high fever", "dizziness"]),
            severity="Urgent",
            rationale="Concerning non-emergency terms should receive urgent review.",
        )
        hits.append(urgent_rule)
        if urgent_rule.matched:
            floor = "Urgent"
        elif _has_any(text, ["cough", "sore throat", "back pain", "rash", "fever"]):
            floor = "Routine"
            hits.append(
                RuleHit(
                    rule_id="STCC_MOCK_ROUTINE_REVIEW",
                    matched=True,
                    severity="Routine",
                    rationale="Common lower-acuity symptom matched routine review bucket.",
                )
            )

    return floor, hits


def _normalize_llm_severity(payload: dict[str, Any]) -> tuple[str, str | None]:
    llm_block = payload.get("llm_recommendation") or {}
    severity = llm_block.get("severity", "Self-care")
    if severity in SEVERITY_RANK:
        return severity, None
    return "Self-care", f"Unknown LLM severity {severity!r}; treated as Self-care for safety."


def evaluate_payload(payload: dict[str, Any]) -> dict[str, Any]:
    symptoms = payload.get("symptoms")
    if not isinstance(symptoms, dict):
        raise ValueError("payload.symptoms must be an object")

    floor, rule_hits = evaluate_mock_stcc_floor(symptoms)
    llm_severity, llm_warning = _normalize_llm_severity(payload)
    downgrade_blocked = floor == "Emergency" and SEVERITY_RANK[llm_severity] < SEVERITY_RANK[floor]

    if downgrade_blocked:
        final_severity = floor
        safety_action = "LLM_DOWNGRADE_BLOCKED"
    elif SEVERITY_RANK[llm_severity] > SEVERITY_RANK[floor]:
        final_severity = llm_severity
        safety_action = "LLM_ESCALATION_ACCEPTED"
    else:
        final_severity = floor
        safety_action = "RULE_FLOOR_APPLIED"

    trace = {
        "rules_engine_severity": floor,
        "llm_recommendation": payload.get("llm_recommendation", {}),
        "llm_warning": llm_warning,
        "downgrade_blocked": downgrade_blocked,
        "safety_action": safety_action,
        "rule_hits": [hit.as_dict() for hit in rule_hits],
    }

    return {
        "encounter_id": payload.get("encounter_id") or str(uuid.uuid4()),
        "nurse_id": payload.get("nurse_id"),
        "final_severity": final_severity,
        "rules_engine_severity": floor,
        "llm_severity": llm_severity,
        "downgrade_blocked": downgrade_blocked,
        "audit_required": downgrade_blocked or floor != llm_severity,
        "explainability_trace": trace,
    }


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS safety_audit_deviation_log (
            id TEXT PRIMARY KEY,
            encounter_id TEXT NOT NULL,
            nurse_id TEXT,
            rules_engine_severity TEXT NOT NULL,
            llm_severity TEXT NOT NULL,
            final_severity TEXT NOT NULL,
            downgrade_blocked INTEGER NOT NULL,
            request_json TEXT NOT NULL,
            explainability_trace_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()


def save_audit(db_path: Path, payload: dict[str, Any], result: dict[str, Any]) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        ensure_schema(conn)
        conn.execute(
            """
            INSERT INTO safety_audit_deviation_log (
                id,
                encounter_id,
                nurse_id,
                rules_engine_severity,
                llm_severity,
                final_severity,
                downgrade_blocked,
                request_json,
                explainability_trace_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                result["encounter_id"],
                result.get("nurse_id"),
                result["rules_engine_severity"],
                result["llm_severity"],
                result["final_severity"],
                1 if result["downgrade_blocked"] else 0,
                json.dumps(payload, ensure_ascii=False, sort_keys=True),
                json.dumps(result["explainability_trace"], ensure_ascii=False, sort_keys=True),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()


def load_payload(args: argparse.Namespace) -> dict[str, Any]:
    if args.payload_file:
        return json.loads(Path(args.payload_file).read_text(encoding="utf-8"))
    if args.payload:
        return json.loads(args.payload)
    return json.loads(sys.stdin.read())


def main() -> int:
    parser = argparse.ArgumentParser(description="IST Qatar AI copilot safety wrapper")
    parser.add_argument("--payload-file", help="Path to a JSON payload file")
    parser.add_argument("--payload", help="Inline JSON payload")
    parser.add_argument("--db", default="python/audit.sqlite3", help="SQLite audit log path")
    args = parser.parse_args()

    payload = load_payload(args)
    result = evaluate_payload(payload)
    save_audit(Path(args.db), payload, result)
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

