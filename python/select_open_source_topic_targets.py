"""Rank candidate topics for the open-source-sourced STCC-shaped content expansion.

Read-only against the already-cached synthetic corpus (no network calls, no
re-scrape). Selects roughly the real commercial STCC catalog size (~400 topics)
out of our generator's larger (1,684-entry, deduped-within-index-category-only)
topic list, restricted to this system's permanent after-hours-only domain
constraint, and writes a resumable tracking ledger so authoring progress
persists across sessions.

Usage:
    python python/select_open_source_topic_targets.py
"""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CACHED_CORPUS_PATH = REPO_ROOT / "data" / "generated" / "synthetic_stcc_guidelines" / "synthetic_stcc_guidelines.json"
OUTPUT_CSV_PATH = REPO_ROOT / "data" / "open-source-topic-tracking.csv"

TARGET_TOTAL = 400

# Topics matched by EXACT normalized title (not substring) against the 4
# already hand-authored + cited protocols (src/data/openSourceClinicalRulesContent.ts).
# Substring matching was tried first and rejected: "foot" alone false-matched
# "Athlete's Foot"/"Hand-Foot-Mouth Disease", "cough" alone false-matched
# "Whooping Cough Exposure"/"Coughing Up Blood" - clinically wrong tags in a
# tracking ledger are worse than a few real topics staying untagged.
FORMAL_RULE_VERIFIED = {
    "ankle injury": ("Ottawa Ankle Rule", "oscr-ankle-foot-injury"),
    "foot injury": ("Ottawa Ankle Rule", "oscr-ankle-foot-injury"),
    "sore throat": ("Centor/McIsaac Score", "oscr-sore-throat"),
    "cough - acute productive": ("CURB-65", "oscr-cough-fever-curb65"),
    "leg swelling and edema": ("Wells' Criteria for DVT", "oscr-leg-swelling-wells-dvt"),
    "leg swelling or edema": ("Wells' Criteria for DVT", "oscr-leg-swelling-wells-dvt"),
}

# Exact-title matches only, confirmed free of false positives against the
# cached corpus. These are plausible candidates for a SECOND wave - the rule's
# precise point table has NOT been fetched/confirmed with the same citation
# rigor as the 4 verified ones yet. Do not author these as formal-rule content
# without first fetching and citing the real rule.
FORMAL_RULE_CANDIDATES = {
    "chest pain": "HEART Score (candidate - not yet fetched/verified)",
    "knee injury": "Ottawa Knee Rule (candidate - not yet fetched/verified)",
    "knee pain": "Ottawa Knee Rule (candidate - not yet fetched/verified)",
    "neck injury": "NEXUS / Canadian C-Spine Rule (candidate - not yet fetched/verified)",
    "neck pain or stiffness": "NEXUS / Canadian C-Spine Rule (candidate - not yet fetched/verified)",
    "head injury": "Canadian CT Head Rule / PECARN (candidate - not yet fetched/verified)",
}


def normalize_title(title: str) -> str:
    lowered = title.lower().strip()
    lowered = re.sub(r"[^a-z0-9\s-]", " ", lowered)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    return lowered


def source_tier_for(normalized_title: str) -> str:
    if normalized_title in FORMAL_RULE_VERIFIED:
        return "formal-rule-verified"
    if normalized_title in FORMAL_RULE_CANDIDATES:
        return "formal-rule-candidate"
    return "needs-guideline-research"


def rule_note_for(normalized_title: str) -> str:
    if normalized_title in FORMAL_RULE_VERIFIED:
        return FORMAL_RULE_VERIFIED[normalized_title][0]
    if normalized_title in FORMAL_RULE_CANDIDATES:
        return FORMAL_RULE_CANDIDATES[normalized_title]
    return ""


def protocol_id_for(normalized_title: str) -> str:
    if normalized_title in FORMAL_RULE_VERIFIED:
        return FORMAL_RULE_VERIFIED[normalized_title][1]
    return ""


def main() -> None:
    if not CACHED_CORPUS_PATH.exists():
        raise SystemExit(
            f"Cached corpus not found at {CACHED_CORPUS_PATH}. "
            "Run `npm run synthetic:stcc-guidelines` first, or point this script at an "
            "existing export - this script never re-scrapes the public index PDFs itself."
        )

    data = json.loads(CACHED_CORPUS_PATH.read_text(encoding="utf8"))
    protocols = data.get("protocols", data) if isinstance(data, dict) else data

    after_hours = [p for p in protocols if p.get("mode") == "after-hours"]

    groups: dict[str, dict] = defaultdict(lambda: {
        "titleEn": None,
        "patientGroups": set(),
        "membershipCount": 0,
    })

    for protocol in after_hours:
        title = protocol.get("titleEn", "")
        normalized = normalize_title(title)
        if not normalized:
            continue

        entry = groups[normalized]
        if entry["titleEn"] is None:
            entry["titleEn"] = title
        entry["patientGroups"].add(protocol.get("patientGroup", "unknown"))
        entry["membershipCount"] = max(entry["membershipCount"], len(protocol.get("taxonomy", [])))

    rows = []
    for normalized, entry in groups.items():
        patient_groups = entry["patientGroups"]
        if patient_groups >= {"adult", "pediatric"}:
            coverage = "both"
        elif "pediatric" in patient_groups:
            coverage = "pediatric"
        elif "adult" in patient_groups:
            coverage = "adult"
        else:
            coverage = "unknown"

        protocol_id = protocol_id_for(normalized)
        rows.append({
            "titleEn": entry["titleEn"],
            "normalizedTitle": normalized,
            "patientGroupCoverage": coverage,
            "membershipCount": entry["membershipCount"],
            "sourceTier": source_tier_for(normalized),
            "ruleNote": rule_note_for(normalized),
            "status": "authored" if protocol_id else "pending",
            "protocolId": protocol_id,
        })

    # Rank: both-coverage first, then formal-rule tiers, then membership count, then title.
    tier_rank = {"formal-rule-verified": 0, "formal-rule-candidate": 1, "needs-guideline-research": 2}
    rows.sort(
        key=lambda r: (
            0 if r["patientGroupCoverage"] == "both" else 1,
            tier_rank[r["sourceTier"]],
            -r["membershipCount"],
            r["titleEn"],
        )
    )

    selected = rows[:TARGET_TOTAL]

    adult_count = sum(1 for r in selected if r["patientGroupCoverage"] in ("adult", "both"))
    pediatric_count = sum(1 for r in selected if r["patientGroupCoverage"] in ("pediatric", "both"))
    verified_count = sum(1 for r in selected if r["sourceTier"] == "formal-rule-verified")
    candidate_count = sum(1 for r in selected if r["sourceTier"] == "formal-rule-candidate")

    OUTPUT_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV_PATH.open("w", newline="", encoding="utf8") as handle:
        writer = csv.writer(handle)
        writer.writerow([
            "titleEn", "patientGroupCoverage", "membershipCount", "sourceTier",
            "ruleNote", "status", "assignedBatch", "protocolId", "sourceUrls", "notes",
        ])
        for row in selected:
            writer.writerow([
                row["titleEn"],
                row["patientGroupCoverage"],
                row["membershipCount"],
                row["sourceTier"],
                row["ruleNote"],
                row["status"],
                "",
                row["protocolId"],
                "",
                "",
            ])

    print(f"Total unique after-hours canonical topics available: {len(rows)}")
    print(f"Selected: {len(selected)} (target {TARGET_TOTAL})")
    print(f"  adult-relevant: {adult_count}, pediatric-relevant: {pediatric_count}")
    print(f"  formal-rule-verified: {verified_count}, formal-rule-candidate: {candidate_count}, "
          f"needs-guideline-research: {len(selected) - verified_count - candidate_count}")
    print(f"Wrote {OUTPUT_CSV_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
