"""Generate a synthetic STCC-shaped guideline coverage dataset.

This script uses the public STCC guideline-index page only to discover topic
coverage. It does not copy licensed STCC clinical questions, rationale, care
advice, background information, first-aid instructions, or references.

The output is intentionally synthetic and approximate. It is suitable for UI,
queue, search, simulation, AI-evaluation, and import-pipeline testing before a
licensed STCC database/package is available. It must not be used as clinical
truth.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Literal, Optional, Sequence
from urllib.parse import urljoin
from urllib.request import Request, urlopen


INDEX_PAGE_URL = "https://www.stcc-triage.com/guideline-indexes"
DEFAULT_CACHE_DIR = Path("data/stcc-public-indexes")
DEFAULT_OPEN_SOURCE_CACHE_DIR = Path("data/open-source")
DEFAULT_OUTPUT_DIR = Path("data/generated/synthetic_stcc_guidelines")
DEFAULT_VERSION = "2026-public-index-synthetic"
MEDLINEPLUS_XML_PAGE_URL = "https://medlineplus.gov/xml.html"

OPEN_SOURCE_CLINICAL_ANCHORS = [
    {
        "name": "Royal College of Physicians NEWS2",
        "url": "https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/",
        "usage": "Adult physiologic deterioration scaffold for vital-sign safety floors and escalation metadata.",
        "appliesTo": ["adult", "older-adult"],
    },
    {
        "name": "WHO Integrated Management of Childhood Illness",
        "url": "https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/child-health/integrated-management-of-childhood-illness",
        "usage": "Pediatric danger-sign scaffold for child safety floors and guardian callback precautions.",
        "appliesTo": ["pediatric"],
    },
    {
        "name": "WHO IMCI chart booklet",
        "url": "https://cdn.who.int/media/docs/default-source/mca-documents/child/imci-integrated-management-of-childhood-illness/imci-in-service-training/imci-chart-booklet.pdf",
        "usage": "Open child-health charting structure used only as a public safety-reference anchor; no STCC care text is copied.",
        "appliesTo": ["pediatric"],
    },
    {
        "name": "MedlinePlus Health Topic XML",
        "url": "https://medlineplus.gov/xml.html",
        "usage": "Open patient-education topic titles and vocabulary used to attach reference links; summaries and article text are not copied.",
        "appliesTo": ["adult", "pediatric", "older-adult"],
    },
]

DispositionCode = Literal[
    "SIDRA_PEDIATRIC_ED",
    "HMC_EMERGENCY_DEPARTMENT",
    "HMC_URGENT_REVIEW",
    "PHCC_URGENT_CARE_OR_TELECONSULT",
    "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
]

Severity = Literal["Emergency", "Urgent", "Routine", "Self-care"]


@dataclass(frozen=True)
class IndexDescriptor:
    label: str
    url: str
    filename: str
    mode: Literal["after-hours", "office-hours"]
    patient_group: Literal["adult", "pediatric"]
    category: Literal["alphabetical", "anatomical", "behavioral-health", "women-health", "chronic-disease", "older-adult", "hospice"]


@dataclass(frozen=True)
class MedlinePlusTopic:
    title: str
    url: str
    language: str
    terms: tuple[str, ...]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slugify(value: str, limit: int = 92) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:limit].strip("-") or "untitled"


def short_hash(value: str, length: int = 8) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:length]


def stable_id(prefix: str, title: str, source_key: str, limit: int = 96) -> str:
    suffix = short_hash(f"{prefix}|{source_key}")
    allowed_slug_length = max(12, limit - len(prefix) - len(suffix) - 2)
    return f"{prefix}-{slugify(title, allowed_slug_length)}-{suffix}"


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\u200d", "")).strip()


def canonical_topic_key(title: str) -> str:
    normalized = normalize_space(title).lower()
    normalized = normalized.replace("follow up", "follow-up")
    normalized = re.sub(r"[\u2010-\u2015]", "-", normalized)
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return normalize_space(normalized)


def parse_index_descriptors(index_page_url: str = INDEX_PAGE_URL) -> List[IndexDescriptor]:
    request = Request(index_page_url, headers={"User-Agent": "IST-Health-Synthetic-STCC-Generator/1.0"})
    content = urlopen(request, timeout=45).read().decode("utf-8", "ignore")
    links = re.findall(r'<a[^>]+href="([^"]+\.pdf)"[^>]*>(.*?)</a>', content, flags=re.I | re.S)
    descriptors: List[IndexDescriptor] = []
    seen: set[tuple[str, str]] = set()

    for href, raw_label in links:
        label = html.unescape(re.sub(r"<.*?>", "", raw_label))
        label = normalize_space(label)
        url = urljoin(index_page_url, href)
        key = (label, url)
        if key in seen:
            continue
        seen.add(key)

        label_lower = label.lower()
        patient_group: Literal["adult", "pediatric"] = "pediatric" if "pediatric" in label_lower or "peds" in label_lower else "adult"
        mode: Literal["after-hours", "office-hours"] = "office-hours" if "office hours" in label_lower else "after-hours"

        if "anatom" in label_lower:
            category = "anatomical"
        elif "behavioral" in label_lower:
            category = "behavioral-health"
        elif "women" in label_lower:
            category = "women-health"
        elif "chronic" in label_lower:
            category = "chronic-disease"
        elif "older adult" in label_lower:
            category = "older-adult"
        elif "hospice" in label_lower:
            category = "hospice"
        else:
            category = "alphabetical"

        descriptors.append(
            IndexDescriptor(
                label=label,
                url=url,
                filename=Path(href).name,
                mode=mode,
                patient_group=patient_group,
                category=category,  # type: ignore[arg-type]
            )
        )

    return descriptors


def download_index_pdf(descriptor: IndexDescriptor, cache_dir: Path) -> Path:
    cache_dir.mkdir(parents=True, exist_ok=True)
    target = cache_dir / descriptor.filename
    if target.exists() and target.stat().st_size > 0:
        return target
    request = Request(descriptor.url, headers={"User-Agent": "IST-Health-Synthetic-STCC-Generator/1.0"})
    target.write_bytes(urlopen(request, timeout=90).read())
    return target


def extract_pdf_text(pdf_path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:  # pragma: no cover - exercised only on incomplete local runtimes.
        raise RuntimeError(
            "pypdf is required to extract public STCC index PDFs. "
            "Run with the bundled Codex Python or install pypdf."
        ) from exc

    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


SKIP_LINE_PATTERNS = [
    r"^$",
    r"^\d+$",
    r"^[A-Z]$",
    r"^Page\s+\d+",
    r"^Alphabetical Index",
    r"^Anatomic Index",
    r"^After Hours",
    r"^Office Hours",
    r"^Anatomic Group and Title",
    r"^Adult\s+\|\s+",
    r"^Pediatric\s+\|\s+",
    r"^Copyright",
]

CONTINUATION_ENDINGS = (
    "-",
    " and",
    " or",
    " for",
    " with",
    " without",
    " than",
    " greater than",
    " less than",
    " symptoms and",
    " follow-",
    " -",
)


def should_skip_line(line: str) -> bool:
    stripped = normalize_space(line)
    return any(re.search(pattern, stripped, flags=re.I) for pattern in SKIP_LINE_PATTERNS)


def is_probable_group_header(line: str, descriptor: IndexDescriptor) -> bool:
    if descriptor.category != "anatomical":
        return False
    normalized = normalize_space(line)
    if "-" in normalized or "(" in normalized:
        return False
    return normalized.endswith(("Symptoms", "Problems", "Health", "System", "Conditions"))


def stitch_lines(lines: Sequence[str]) -> List[str]:
    stitched: List[str] = []
    pending = ""
    for raw in lines:
        line = normalize_space(raw)
        if not line:
            continue
        if pending:
            if pending.endswith("-"):
                pending = pending[:-1] + line
            else:
                pending = f"{pending} {line}"
        else:
            pending = line

        lower = pending.lower()
        if lower.endswith(CONTINUATION_ENDINGS):
            continue
        stitched.append(pending)
        pending = ""
    if pending:
        stitched.append(pending)
    return stitched


def extract_topics_from_index(text: str, descriptor: IndexDescriptor) -> List[str]:
    candidates = []
    for line in stitch_lines(text.splitlines()):
        if should_skip_line(line) or is_probable_group_header(line, descriptor):
            continue
        line = normalize_space(line)
        line = re.sub(r"\s+\|\s+.*$", "", line)
        line = re.sub(r"\s*Page\s+\d+.*$", "", line).strip()
        if len(line) < 4 or len(line) > 180:
            continue
        if line.lower().startswith(("index", "protocol", "telephone triage", "telehealth triage")):
            continue
        candidates.append(line)

    # Preserve order but remove duplicates produced by repeated page headers.
    seen = set()
    topics: List[str] = []
    for item in candidates:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        topics.append(item)
    return topics


STOP_WORDS = {
    "about",
    "after",
    "and",
    "are",
    "call",
    "care",
    "for",
    "from",
    "has",
    "have",
    "health",
    "his",
    "her",
    "into",
    "male",
    "female",
    "office",
    "or",
    "the",
    "their",
    "this",
    "triage",
    "with",
    "without",
}


def token_set(value: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"[A-Za-z][A-Za-z']+", value)
        if len(token) > 2 and token.lower() not in STOP_WORDS
    }


def parse_medlineplus_xml_url(page_url: str = MEDLINEPLUS_XML_PAGE_URL, timeout_seconds: int = 12) -> str:
    request = Request(page_url, headers={"User-Agent": "IST-Health-Synthetic-STCC-Generator/1.0"})
    content = urlopen(request, timeout=timeout_seconds).read().decode("utf-8", "ignore")
    match = re.search(r'href="([^"]*mplus_topics[^"]*\.zip)"', content, flags=re.I)
    if not match:
        raise RuntimeError(f"Could not find MedlinePlus compressed XML link at {page_url}")
    return urljoin(page_url, html.unescape(match.group(1)))


def download_medlineplus_xml(open_source_cache_dir: Path) -> Path:
    medline_dir = open_source_cache_dir / "medlineplus"
    medline_dir.mkdir(parents=True, exist_ok=True)
    marker_path = medline_dir / "source_url.txt"
    zip_url = parse_medlineplus_xml_url()
    filename = Path(zip_url).name or "mplus_topics.zip"
    zip_path = medline_dir / filename
    if not zip_path.exists() or zip_path.stat().st_size == 0:
        request = Request(zip_url, headers={"User-Agent": "IST-Health-Synthetic-STCC-Generator/1.0"})
        zip_path.write_bytes(urlopen(request, timeout=45).read())
        marker_path.write_text(zip_url, encoding="utf-8")

    with zipfile.ZipFile(zip_path) as archive:
        xml_name = next((name for name in archive.namelist() if name.lower().endswith(".xml")), None)
        if not xml_name:
            raise RuntimeError(f"No XML file found inside {zip_path}")
        xml_path = medline_dir / Path(xml_name).name
        if not xml_path.exists() or xml_path.stat().st_size == 0:
            xml_path.write_bytes(archive.read(xml_name))
    return xml_path


def load_medlineplus_topics(open_source_cache_dir: Path) -> List[MedlinePlusTopic]:
    xml_path = download_medlineplus_xml(open_source_cache_dir)
    root = ET.parse(xml_path).getroot()
    topics: List[MedlinePlusTopic] = []

    for node in root.findall(".//health-topic"):
        title = normalize_space(node.attrib.get("title", ""))
        url = normalize_space(node.attrib.get("url", ""))
        language = normalize_space(node.attrib.get("language", "en"))
        if not title or not url or language.lower() != "en":
            continue
        terms = [title]
        terms.extend(normalize_space(child.text or "") for child in node.findall("also-called"))
        terms.extend(normalize_space(child.text or "") for child in node.findall(".//mesh-heading/descriptor"))
        cleaned_terms = tuple(item for item in dict.fromkeys(terms) if item)
        topics.append(MedlinePlusTopic(title=title, url=url, language=language, terms=cleaned_terms))
    return topics


def safe_load_medlineplus_topics(open_source_cache_dir: Path) -> tuple[List[MedlinePlusTopic], Optional[str]]:
    try:
        return load_medlineplus_topics(open_source_cache_dir), None
    except Exception as exc:
        return [], f"{type(exc).__name__}: {exc}"


def match_medlineplus_topic(title: str, topics: Sequence[MedlinePlusTopic]) -> Optional[Dict[str, Any]]:
    query_tokens = token_set(title)
    if not query_tokens:
        return None
    best: Optional[tuple[float, MedlinePlusTopic, List[str]]] = None
    for topic in topics:
        topic_tokens = set().union(*(token_set(term) for term in topic.terms))
        if not topic_tokens:
            continue
        overlap = sorted(query_tokens & topic_tokens)
        if not overlap:
            continue
        score = (2 * len(overlap)) / max(1, len(query_tokens) + len(topic_tokens))
        if best is None or score > best[0]:
            best = (score, topic, overlap)

    if best is None or (best[0] < 0.22 and len(best[2]) < 2):
        return None

    score, topic, overlap = best
    return {
        "source": "MedlinePlus",
        "title": topic.title,
        "url": topic.url,
        "matchScore": round(score, 3),
        "matchedTerms": overlap,
        "usage": "Patient-education reference anchor only. No MedlinePlus article text is copied into synthetic triage content.",
    }


def search_words_for_title(title: str) -> List[str]:
    cleaned = re.sub(r"\([^)]*\)", " ", title)
    cleaned = cleaned.replace("/", " ").replace("-", " ")
    tokens = [
        token.lower()
        for token in re.findall(r"[A-Za-z][A-Za-z']+", cleaned)
        if token.lower() not in {"and", "or", "the", "of", "to", "for", "with", "on", "in", "call", "questions", "symptoms"}
    ]
    phrases = [title.lower()]
    if len(tokens) >= 2:
        phrases.append(" ".join(tokens[:2]))
    phrases.extend(tokens[:8])
    return list(dict.fromkeys(phrases))[:12]


def title_context(title: str, patient_group: str, category: str) -> Dict[str, Any]:
    lower = title.lower()
    sex: Optional[str] = None
    if "female" in lower or "women" in lower or category == "women-health" or "pregnancy" in lower or "postpartum" in lower:
        sex = "female"
    elif "male" in lower or "prostate" in lower or "testicle" in lower or "penis" in lower:
        sex = "male"

    age_min = 18 if patient_group == "adult" else 0
    age_max = 120 if patient_group == "adult" else 17
    if "older adult" in category or "elder" in lower:
        age_min = 60

    return {"genderRestriction": sex, "ageMin": age_min, "ageMax": age_max}


def disposition_for(patient_group: str, severity: Severity) -> DispositionCode:
    if severity == "Emergency":
        return "SIDRA_PEDIATRIC_ED" if patient_group == "pediatric" else "HMC_EMERGENCY_DEPARTMENT"
    if severity == "Urgent":
        return "HMC_URGENT_REVIEW"
    if severity == "Routine":
        return "PHCC_URGENT_CARE_OR_TELECONSULT"
    return "SELF_CARE_WITH_CALLBACK_PRECAUTIONS"


def synthetic_initial_assessment_questions(protocol_id: str, title: str) -> List[Dict[str, Any]]:
    """Create a non-authoritative, structured opening assessment for demo workflow testing."""
    prompts = [
        ("LOCATION", f"Where is the main symptom or concern for {title}?", "Clarify the exact body area or concern."),
        ("OPEN_TEXT", "Does the concern spread anywhere else or affect another part of the body?", "Capture any radiation or related location."),
        ("DURATION", "When did the concern begin?", "Record minutes, hours, days, or an approximate date."),
        ("YES_NO", "Did it start suddenly?", "Ask whether the onset was abrupt or gradual."),
        ("OPEN_TEXT", "Is it constant, intermittent, improving, staying the same, or worsening?", "Capture the current pattern and change over time."),
        ("PAIN_SCALE", "How severe is it now on a scale of zero to ten, if pain is present?", "Use the caller's description if a numeric score is not possible."),
        ("YES_NO", "Has this happened before?", "If yes, capture what happened during the previous episode."),
        ("OPEN_TEXT", "What do you think may have triggered or caused it?", "Capture recent activity, illness, injury, exposure, or treatment context."),
        ("OPEN_TEXT", "What makes it better or worse?", "Capture relieving and aggravating factors."),
        ("OPEN_TEXT", "Are there any other symptoms or immediate concerns?", "Prompt for red-flag symptoms before the protocol assessment begins."),
    ]
    emergency_keywords = ["breathing", "blue", "fainting", "bleeding", "confusion", "unresponsive", "severe"]
    return [
        {
            "id": f"{protocol_id}-iaq{index}",
            "sequence": index,
            "responseType": response_type,
            "promptTextEn": prompt,
            "clarificationPromptEn": clarification,
            "required": True,
            "emergencyKeywords": emergency_keywords if index in {1, 10} else [],
            "syntheticApproximation": True,
        }
        for index, (response_type, prompt, clarification) in enumerate(prompts, start=1)
    ]


# STCC's numeric disposition-level ladder (100 -> 15). Our synthetic generator
# only ever has 4 severity tiers, so it exercises 4 of STCC's ~11 documented
# levels as a representative approximation, not a full clinical mapping.
SEVERITY_TO_DISPOSITION_LEVEL: Dict[str, int] = {
    "Emergency": 100,  # Call EMS 911 Now
    "Urgent": 70,      # See PCP or Video Visit Within 24 Hours
    "Routine": 50,     # See PCP or Video Visit Within 3 Days
    "Self-care": 15,   # Home Care
}


def synthetic_disposition_mappings(patient_group: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
    routes = {
        "Emergency": ("Emergency department escalation", "Immediate safety floor or high-acuity finding requires emergency escalation."),
        "Urgent": ("Urgent clinical review", "Time-sensitive review is required after an urgent finding."),
        "Routine": ("Routine clinic or teleconsult review", "A clinic or teleconsult pathway is appropriate when higher-acuity findings are absent."),
        "Self-care": ("Self-care with callback precautions", "Self-care is only appropriate after the higher-acuity path is negative and callback precautions are understood."),
    }
    return [
        {
            "severity": severity,
            "dispositionCode": disposition_for(patient_group, severity),
            "ageMin": context["ageMin"],
            "ageMax": context["ageMax"],
            "routeLabelEn": routes[severity][0],
            "routeRationaleEn": routes[severity][1],
            "sourceOfCareEn": "Synthetic Qatar routing configuration; validate local provider availability and escalation policy before production.",
            "telemedicineHeadingEn": "Teleconsult eligibility requires nurse confirmation and local policy checks.",
            "aviationContext": {"fitToFlyDecision": "nurse-and-policy-controlled", "syntheticApproximation": True},
            "dispositionLevel": SEVERITY_TO_DISPOSITION_LEVEL[severity],
        }
        for severity in ("Emergency", "Urgent", "Routine", "Self-care")
    ]


def synthetic_questions(protocol_id: str, title: str, patient_group: str) -> List[Dict[str, Any]]:
    subject = title.lower()
    base = [
        (
            "Emergency",
            "Is there severe distress, unsafe appearance, non-alert mental status, breathing difficulty, blue color, uncontrolled bleeding, fainting, or a rapidly worsening condition?",
            "Synthetic emergency floor question. A positive answer requires immediate emergency routing.",
            ["severe", "breathing", "fainting", "bleeding", "confusion"],
        ),
        (
            "Urgent",
            f"Are symptoms from {subject} severe, persistent, recurrent, associated with fever or dehydration, or concerning to the nurse based on age, pregnancy, chronic disease, or duty context?",
            "Synthetic urgent question. A positive answer requires time-sensitive clinician review.",
            ["severe", "persistent", "fever", "dehydration", "worsening"],
        ),
        (
            "Routine",
            f"Are symptoms from {subject} new, bothersome, not improving, or requiring clinic review but without emergency or urgent findings?",
            "Synthetic routine question. A positive answer routes to primary care, clinic, or teleconsult review.",
            ["new", "bothersome", "not improving", "clinic"],
        ),
        (
            "Self-care",
            f"Are symptoms from {subject} mild, improving, and without red flags after the higher-acuity questions are answered No?",
            "Synthetic self-care question. This can only be used after higher-acuity items are negative.",
            ["mild", "improving", "no red flags", "callback"],
        ),
    ]
    telemedicine_notes = {
        "Emergency": None,
        "Urgent": "Teleconsult may be appropriate only after nurse confirms no red-flag findings.",
        "Routine": "Teleconsult is generally suitable for routine-tier findings.",
        "Self-care": "Teleconsult is generally suitable; caller may also be managed by phone advice alone.",
    }
    questions = []
    for idx, (severity, question, rationale, keywords) in enumerate(base, start=1):
        disposition = disposition_for(patient_group, severity)  # type: ignore[arg-type]
        questions.append(
            {
                "id": f"{protocol_id}-q{idx}",
                "acuityOrder": idx,
                "severity": severity,
                "questionTextEn": question,
                "dispositionCode": disposition,
                "rationaleEn": rationale,
                "redFlag": severity == "Emergency",
                "keywords": keywords,
                "careAdviceIds": [f"{protocol_id}-{severity.lower().replace('-', '')}-advice"],
                "syntheticApproximation": True,
                # STCC Question.TelemedicineEligible / Question.Information analog.
                "telemedicineEligible": severity != "Emergency",
                "telemedicineNotesEn": telemedicine_notes[severity],
                "dispositionLevel": SEVERITY_TO_DISPOSITION_LEVEL[severity],
                # Exactly one synthetic TAQ occupies each mapped level today;
                # ready for when real per-protocol STCC data has several TAQs per level.
                "questionOrder": 1,
            }
        )
    return questions


def synthetic_care_advice(protocol_id: str, title: str, patient_group: str) -> List[Dict[str, Any]]:
    # adviceCategory defaults to DISPOSITION for all synthetic advice: this generator's
    # care advice is disposition-linked by construction and does not yet distinguish
    # STCC's other 3 audience types (Note-to-Triager / General / Call-Back-If).
    return [
        {
            "id": f"{protocol_id}-emergency-advice",
            "titleEn": f"Emergency precautions for {title}",
            "instructionTextEn": "Synthetic instruction: keep the patient safe, avoid duty or travel, arrange emergency escalation according to local policy, and document the safety floor.",
            "dispositionCode": disposition_for(patient_group, "Emergency"),
            "warningSigns": ["breathing difficulty", "non-alert", "fainting", "uncontrolled bleeding", "rapid worsening"],
            "syntheticApproximation": True,
            "displayOrder": 1,
            "adviceCategory": "DISPOSITION",
        },
        {
            "id": f"{protocol_id}-urgent-advice",
            "titleEn": f"Urgent review advice for {title}",
            "instructionTextEn": "Synthetic instruction: arrange timely clinician review, provide callback precautions, and restrict duty-sensitive activity until reviewed when aviation context applies.",
            "dispositionCode": disposition_for(patient_group, "Urgent"),
            "warningSigns": ["worsening symptoms", "fever", "dehydration", "new severe pain"],
            "syntheticApproximation": True,
            "displayOrder": 2,
            "adviceCategory": "DISPOSITION",
        },
        {
            "id": f"{protocol_id}-routine-advice",
            "titleEn": f"Routine review advice for {title}",
            "instructionTextEn": "Synthetic instruction: provide routine clinic or teleconsult follow-up instructions, self-monitoring guidance, and clear return precautions.",
            "dispositionCode": disposition_for(patient_group, "Routine"),
            "warningSigns": ["not improving", "new symptoms", "patient concern"],
            "syntheticApproximation": True,
            "displayOrder": 3,
            "adviceCategory": "DISPOSITION",
        },
        {
            "id": f"{protocol_id}-selfcare-advice",
            "titleEn": f"Home care advice for {title}",
            "instructionTextEn": "Synthetic instruction: provide conservative home-care guidance, expected recovery window, and explicit callback instructions if any red flag develops.",
            "dispositionCode": "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
            "warningSigns": ["worsening", "new red flag", "unable to function normally"],
            "syntheticApproximation": True,
            "displayOrder": 4,
            "adviceCategory": "DISPOSITION",
        },
    ]


def unique_id_report(protocols: Sequence[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    buckets = {
        "protocols": [protocol["id"] for protocol in protocols],
        "questions": [question["id"] for protocol in protocols for question in protocol["questions"]],
        "careAdvice": [advice["id"] for protocol in protocols for advice in protocol["careAdvice"]],
    }
    report: Dict[str, Dict[str, Any]] = {}
    for label, values in buckets.items():
        seen: Dict[str, int] = {}
        duplicates: Dict[str, int] = {}
        for value in values:
            seen[value] = seen.get(value, 0) + 1
            if seen[value] > 1:
                duplicates[value] = seen[value]
        report[label] = {
            "total": len(values),
            "unique": len(set(values)),
            "duplicateIds": len(duplicates),
            "duplicateRows": sum(count - 1 for count in seen.values() if count > 1),
            "examples": list(duplicates.keys())[:10],
        }
    return report


def assert_unique_ids(protocols: Sequence[Dict[str, Any]], label: str) -> None:
    report = unique_id_report(protocols)
    failed = {key: value for key, value in report.items() if value["duplicateIds"] > 0}
    if failed:
        raise RuntimeError(f"Duplicate IDs detected in {label}: {json.dumps(failed, indent=2)}")


def synthetic_acuity(mode: str, index_memberships: List[Dict[str, str]]) -> int:
    """Blended synthetic 1-5 guideline-level acuity approximation. NOT real STCC
    AcuityRating. Deriving this from per-question severity alone would be a
    constant value across all protocols, since synthetic_questions() always
    emits the same 4 severity tiers for every protocol - so this blends in
    mode/category signals instead, purely to make the field vary at all."""
    categories = {membership["category"] for membership in index_memberships}
    score = 4 if mode == "after-hours" else 3
    if "hospice" in categories or "older-adult" in categories:
        score -= 1
    return max(1, min(5, score))


def build_protocol_record(
    mode: str,
    patient_group: str,
    title: str,
    index_memberships: List[Dict[str, str]],
    medlineplus_anchor: Optional[Dict[str, Any]],
    canonical_key: str,
) -> Dict[str, Any]:
    protocol_id = stable_id(f"synthetic-stcc-{mode}-{patient_group}", title, canonical_key)
    context = title_context(title, patient_group, ",".join(item["category"] for item in index_memberships))
    search_words = search_words_for_title(title)
    anchor_url = medlineplus_anchor.get("url") if medlineplus_anchor else None
    source_documents = sorted({membership["url"] for membership in index_memberships if membership.get("url")})
    return {
        "id": protocol_id,
        "titleEn": title,
        "mode": mode,
        "patientGroup": patient_group,
        "indexMemberships": index_memberships,
        "clinicalDefinitionEn": f"Synthetic definition placeholder for {title}. Replace with licensed STCC clinical definition before production.",
        "initialAssessmentQuestions": synthetic_initial_assessment_questions(protocol_id, title),
        "backgroundInfoEn": f"Synthetic background placeholder for {title}. This text is generated for workflow simulation and is not clinical authority.",
        "questions": synthetic_questions(protocol_id, title, patient_group),
        "careAdvice": synthetic_care_advice(protocol_id, title, patient_group),
        "firstAid": [
            {
                "titleEn": f"Immediate safety precautions for {title}",
                "instructionTextEn": "Synthetic first-aid placeholder: stabilize the patient, prevent further harm, and follow local emergency escalation policy when red flags are present.",
                "displayOrder": 1,
            }
        ],
        "references": [
            {
                "id": f"{protocol_id}-reference-1",
                "title": "Synthetic clinical-content provenance notice",
                "citationText": "Generated placeholder. Validate against the licensed STCC package and IST Health clinical governance before any production use.",
                "referenceType": "synthetic-provenance",
                "displayOrder": 1,
            }
        ],
        "supplementals": [
            {
                "id": f"{protocol_id}-homecare",
                "titleEn": f"Home-care handoff for {title}",
                "supplementalType": "home-care",
                "plainTextEn": f"Synthetic home-care handoff for {title}: use only after emergency and urgent findings are negative and nurse review agrees.",
                "displayOrder": 1,
                "sectionLabel": "Home care",
            },
            *(
                [
                    {
                        "id": f"{protocol_id}-pediatric-handout",
                        "titleEn": f"Pediatric caregiver handout for {title}",
                        "supplementalType": "pediatric-care-advice",
                        "plainTextEn": f"Synthetic pediatric handout placeholder for {title}. Guardian instructions and red flags require clinical validation.",
                        "displayOrder": 2,
                        "sectionLabel": "Pediatric care advice",
                    }
                ]
                if patient_group == "pediatric"
                else []
            ),
        ],
        "openSourcePatientEducationAnchors": [anchor_url] if anchor_url else [],
        "searchWords": search_words,
        "titleVariants": [title],
        "synonyms": [
            {"canonicalTerm": title, "synonym": phrase, "language": "en", "region": "QA"}
            for phrase in search_words
            if phrase.casefold() != title.casefold()
        ],
        "taxonomy": [
            {
                "category": membership["category"],
                "value": membership["label"],
                "source": "synthetic-public-index",
                "displayOrder": index,
            }
            for index, membership in enumerate(index_memberships, start=1)
        ],
        "dispositionMappings": synthetic_disposition_mappings(patient_group, context),
        "keywords": [
            {"phrase": phrase, "language": "en", "weight": max(20, 100 - idx * 8), "source": "synthetic-public-index"}
            for idx, phrase in enumerate(search_words)
        ],
        "ageMin": context["ageMin"],
        "ageMax": context["ageMax"],
        "genderRestriction": context["genderRestriction"],
        "acuity": synthetic_acuity(mode, index_memberships),
        "syntheticApproximation": True,
        "approximationLevel": "topic-derived-public-index-only",
        "requiresClinicalValidation": True,
        "licensingBoundary": "Does not contain licensed STCC question, advice, rationale, reference, or background text.",
        "provenance": {
            "generated": True,
            "sourceKind": "synthetic-public-topic",
            "sourceDocuments": source_documents,
            "contentNotice": "Synthetic STCC-shaped workflow data generated from public topic-index metadata. It is not licensed STCC clinical content and cannot be used as clinical authority.",
            "requiresClinicalValidation": True,
            "licensedContentIncluded": False,
        },
    }


def build_localized_dispositions() -> List[Dict[str, str]]:
    return [
        {
            "code": "SIDRA_PEDIATRIC_ED",
            "destinationNameEn": "Sidra Medicine Emergency Department",
            "routingNotesEn": "Synthetic Qatar route for pediatric emergency outcomes.",
            "region": "QA",
        },
        {
            "code": "HMC_EMERGENCY_DEPARTMENT",
            "destinationNameEn": "Hamad Medical Corporation Emergency Department",
            "routingNotesEn": "Synthetic Qatar route for adult/general emergency outcomes.",
            "region": "QA",
        },
        {
            "code": "HMC_URGENT_REVIEW",
            "destinationNameEn": "HMC urgent review pathway",
            "routingNotesEn": "Synthetic Qatar route for urgent clinician review.",
            "region": "QA",
        },
        {
            "code": "PHCC_URGENT_CARE_OR_TELECONSULT",
            "destinationNameEn": "PHCC urgent care or IST Health teleconsult",
            "routingNotesEn": "Synthetic Qatar route for routine clinic or teleconsult review.",
            "region": "QA",
        },
        {
            "code": "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
            "destinationNameEn": "Self-care with callback precautions",
            "routingNotesEn": "Synthetic route when higher-acuity questions are negative and nurse review agrees.",
            "region": "QA",
        },
    ]


def generate_package(cache_dir: Path, open_source_cache_dir: Path, output_dir: Path, version: str) -> Dict[str, Any]:
    descriptors = parse_index_descriptors()
    medlineplus_topics, medlineplus_warning = safe_load_medlineplus_topics(open_source_cache_dir)
    topic_map: Dict[tuple[str, str, str], Dict[str, Any]] = {}
    index_summaries: List[Dict[str, Any]] = []

    for descriptor in descriptors:
        pdf_path = download_index_pdf(descriptor, cache_dir)
        checksum = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
        text = extract_pdf_text(pdf_path)
        topics = extract_topics_from_index(text, descriptor)
        for title in topics:
            canonical_key = canonical_topic_key(title)
            key = (descriptor.mode, descriptor.patient_group, canonical_key)
            entry = topic_map.setdefault(key, {"title": title, "canonicalKey": canonical_key, "titleVariants": [], "memberships": []})
            if title not in entry["titleVariants"]:
                entry["titleVariants"].append(title)
            membership = {
                "label": descriptor.label,
                "category": descriptor.category,
                "url": descriptor.url,
                "filename": descriptor.filename,
            }
            if membership not in entry["memberships"]:
                entry["memberships"].append(membership)
        index_summaries.append(
            {
                "label": descriptor.label,
                "url": descriptor.url,
                "filename": descriptor.filename,
                "mode": descriptor.mode,
                "patientGroup": descriptor.patient_group,
                "category": descriptor.category,
                "topicCountExtracted": len(topics),
                "sha256": checksum,
            }
        )

    protocols: List[Dict[str, Any]] = []
    for (mode, patient_group, _normalized_title), entry in sorted(topic_map.items()):
        medlineplus_anchor = match_medlineplus_topic(entry["title"], medlineplus_topics)
        protocol = build_protocol_record(
            mode,
            patient_group,
            entry["title"],
            entry["memberships"],
            medlineplus_anchor,
            entry["canonicalKey"],
        )
        protocol["titleVariants"] = entry["titleVariants"]
        protocols.append(protocol)

    assert_unique_ids(protocols, "rich guideline package")

    package = {
        "metadata": {
            "name": "IST Health Synthetic STCC-Shaped Guideline Coverage",
            "version": version,
            "generatedAt": now_iso(),
            "synthetic": True,
            "sourcePage": INDEX_PAGE_URL,
            "sourceBoundary": "Public STCC guideline indexes were used only for topic coverage. Clinical text is synthetic.",
            "licensingBoundary": "This file must not be treated as licensed STCC content or clinical truth.",
            "openSourceClinicalAnchors": OPEN_SOURCE_CLINICAL_ANCHORS,
            "openSourceDataStats": {
                "medlinePlusTopicCount": len(medlineplus_topics),
                "protocolsWithMedlinePlusAnchor": sum(1 for protocol in protocols if protocol["openSourcePatientEducationAnchors"]),
                "medlinePlusWarning": medlineplus_warning,
            },
            "knownLimitations": [
                "Topic extraction from public PDFs can contain line-wrap or index-heading inaccuracies.",
                "Questions, rationale, care advice, first aid, background, references, and search words are synthetic approximations.",
                "Licensed STCC package import is required before production clinical use.",
            ],
        },
        "indexes": index_summaries,
        "localizedDispositions": build_localized_dispositions(),
        "protocols": protocols,
    }

    counts: Dict[str, Any] = {
        "indexCount": len(index_summaries),
        "rawTopicRows": sum(item["topicCountExtracted"] for item in index_summaries),
        "protocolCount": len(protocols),
        "titleVariantCollapses": sum(max(0, len(protocol["titleVariants"]) - 1) for protocol in protocols),
        "byMode": {},
        "byPatientGroup": {},
        "byIndexCategory": {},
        "idValidation": unique_id_report(protocols),
    }
    for protocol in protocols:
        counts["byMode"][protocol["mode"]] = counts["byMode"].get(protocol["mode"], 0) + 1
        counts["byPatientGroup"][protocol["patientGroup"]] = counts["byPatientGroup"].get(protocol["patientGroup"], 0) + 1
        for membership in protocol["indexMemberships"]:
            category = membership["category"]
            counts["byIndexCategory"][category] = counts["byIndexCategory"].get(category, 0) + 1
    package["counts"] = counts

    output_dir.mkdir(parents=True, exist_ok=True)
    rich_path = output_dir / "synthetic_stcc_guidelines.json"
    rich_path.write_text(json.dumps(package, indent=2, ensure_ascii=False), encoding="utf-8")

    clinical_protocols: List[Dict[str, Any]] = []
    for protocol in protocols:
        clinical_protocol = {
            "id": protocol["id"][:120],
            "titleEn": protocol["titleEn"][:240],
            "clinicalDefinitionEn": protocol["clinicalDefinitionEn"][:3000],
            "backgroundInfoEn": protocol["backgroundInfoEn"][:3000],
            "ageMin": protocol["ageMin"],
            "ageMax": protocol["ageMax"],
            "patientGroup": protocol["patientGroup"],
            "acuity": protocol["acuity"],
            "mode": protocol["mode"],
            "titleVariants": protocol["titleVariants"],
            "synonyms": protocol["synonyms"],
            "taxonomy": protocol["taxonomy"],
            "dispositionMappings": protocol["dispositionMappings"],
            "keywords": protocol["keywords"],
            "initialAssessmentQuestions": [
                {
                    "id": question["id"][:120],
                    "sequence": question["sequence"],
                    "responseType": question["responseType"],
                    "promptTextEn": question["promptTextEn"][:2000],
                    "clarificationPromptEn": question.get("clarificationPromptEn", "")[:2000],
                    "required": question["required"],
                    "emergencyKeywords": question["emergencyKeywords"],
                }
                for question in protocol["initialAssessmentQuestions"]
            ],
            "questions": [
                {
                    "id": question["id"][:120],
                    "acuityOrder": question["acuityOrder"],
                    "severity": question["severity"],
                    "questionTextEn": question["questionTextEn"][:1000],
                    "dispositionCode": question["dispositionCode"],
                    "rationaleEn": question["rationaleEn"][:1200],
                    "redFlag": question["redFlag"],
                    "keywords": question["keywords"],
                    "careAdviceIds": [item[:120] for item in question["careAdviceIds"]],
                    "telemedicineEligible": question["telemedicineEligible"],
                    "telemedicineNotesEn": question["telemedicineNotesEn"],
                    "dispositionLevel": question["dispositionLevel"],
                    "questionOrder": question["questionOrder"],
                }
                for question in protocol["questions"]
            ],
            "careAdvice": [
                {
                    "id": advice["id"][:120],
                    "titleEn": advice["titleEn"][:240],
                    "instructionTextEn": advice["instructionTextEn"][:5000],
                    "dispositionCode": advice["dispositionCode"],
                    "warningSigns": advice["warningSigns"],
                    "displayOrder": advice["displayOrder"],
                    "adviceCategory": advice["adviceCategory"],
                }
                for advice in protocol["careAdvice"]
            ],
            "firstAid": protocol["firstAid"],
            "references": protocol["references"],
            "supplementals": protocol["supplementals"],
            "openSourcePatientEducationAnchors": protocol["openSourcePatientEducationAnchors"],
            "provenance": protocol["provenance"],
        }
        if protocol["genderRestriction"]:
            clinical_protocol["genderRestriction"] = protocol["genderRestriction"]
        clinical_protocols.append(clinical_protocol)

    clinical_content_package = {
        "release": {
            "name": "IST Health Synthetic STCC-Shaped Clinical Content",
            "version": version,
            "sourceType": "synthetic-sample",
            "region": "QA",
            "mode": "both",
        },
        "localizedDispositions": build_localized_dispositions(),
        "protocols": clinical_protocols,
    }
    assert_unique_ids(clinical_content_package["protocols"], "clinical content package")
    content_path = output_dir / "clinical_content_package.json"
    content_path.write_text(json.dumps(clinical_content_package, indent=2, ensure_ascii=False), encoding="utf-8")

    manifest = {
        "synthetic": True,
        "generatedAt": package["metadata"]["generatedAt"],
        "sourcePage": INDEX_PAGE_URL,
        "version": version,
        "cacheDir": str(cache_dir),
        "openSourceCacheDir": str(open_source_cache_dir),
        "outputDir": str(output_dir),
        "files": {
            "richGuidelines": str(rich_path),
            "clinicalContentPackage": str(content_path),
        },
        "counts": counts,
        "indexes": index_summaries,
    }
    manifest_path = output_dir / "manifest.json"
    manifest["files"]["manifest"] = str(manifest_path)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest


def validate_existing_package(output_dir: Path) -> Dict[str, Any]:
    rich_path = output_dir / "synthetic_stcc_guidelines.json"
    content_path = output_dir / "clinical_content_package.json"
    if not rich_path.exists() or not content_path.exists():
        raise RuntimeError(f"Generated package files are missing under {output_dir}")

    rich_package = json.loads(rich_path.read_text(encoding="utf-8"))
    clinical_content_package = json.loads(content_path.read_text(encoding="utf-8"))
    assert_unique_ids(rich_package["protocols"], "rich guideline package")
    assert_unique_ids(clinical_content_package["protocols"], "clinical content package")

    return {
        "valid": True,
        "files": {
            "richGuidelines": str(rich_path),
            "clinicalContentPackage": str(content_path),
        },
        "richGuidelines": unique_id_report(rich_package["protocols"]),
        "clinicalContentPackage": unique_id_report(clinical_content_package["protocols"]),
    }


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Generate synthetic STCC-shaped guideline coverage data.")
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--open-source-cache-dir", default=str(DEFAULT_OPEN_SOURCE_CACHE_DIR))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--version", default=DEFAULT_VERSION)
    parser.add_argument("--print-summary", action="store_true")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args(argv)

    if args.validate_only:
        validation = validate_existing_package(Path(args.output_dir))
        print(json.dumps(validation, indent=2, ensure_ascii=False))
        return 0

    manifest = generate_package(Path(args.cache_dir), Path(args.open_source_cache_dir), Path(args.output_dir), args.version)
    if args.print_summary:
        print(
            json.dumps(
                {
                    "synthetic": manifest["synthetic"],
                    "version": manifest["version"],
                    "sourcePage": manifest["sourcePage"],
                    "counts": manifest["counts"],
                    "files": manifest["files"],
                },
                indent=2,
                ensure_ascii=False,
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
