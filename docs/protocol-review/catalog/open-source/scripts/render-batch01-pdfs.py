import json
import argparse
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

parser = argparse.ArgumentParser()
parser.add_argument(
    "--batch-root",
    type=Path,
    default=Path(__file__).resolve().parent.parent,
)
parser.add_argument("--manifest", default="batch-01-manifest.json")
args = parser.parse_args()

ROOT = args.batch_root.resolve()
JSON_DIR = ROOT / "json"
PDF_DIR = ROOT / "pdf"
MANIFEST = json.loads((ROOT / "manifests" / args.manifest).read_text())
META = {Path(row["file"]).name: row for row in MANIFEST["entries"]}
PDF_DIR.mkdir(exist_ok=True)

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontSize=8,
        leading=10,
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#14324A"),
        spaceBefore=8,
        spaceAfter=5,
    )
)


def p(text, style="BodyText"):
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe, styles[style])


def bullets(values):
    return [p(f"• {value}") for value in values]


def format_reference(reference):
    if isinstance(reference, str):
        return reference
    parts = [
        reference.get("title", "Reference"),
        reference.get("publisher"),
        reference.get("url"),
        reference.get("use"),
    ]
    return " - ".join(part for part in parts if part)


def render(source):
    doc = json.loads(source.read_text())
    meta = META[source.name]
    output = PDF_DIR / source.name.replace(".db.json", ".pdf")
    story = [
        p(doc["algorithm"]["Title"], "Title"),
        p(
            f"Algorithm {doc['algorithm']['AlgorithmID']} | {doc['algorithm']['Age']} | "
            f"Gender at birth: {doc['algorithm']['GenderAtBirth']}",
            "Small",
        ),
        Spacer(1, 4 * mm),
        p("Definition", "Section"),
        *bullets(doc["algorithm"]["Definition"]),
    ]
    background = doc["algorithm"].get("Background", {})
    if background.get("KeyPoints"):
        story += [p("Clinical background", "Section"), *bullets(background["KeyPoints"])]
    if doc["algorithm"]["PainSeverity"]:
        story += [p("Pain severity", "Section"), *bullets(doc["algorithm"]["PainSeverity"])]
    story += [p("Initial assessment", "Section")]
    for q in doc["initialAssessmentQuestions"]:
        story += [p(f"{q['Order']}. [{q['Category']}] {q['Question']}")]
    story += [PageBreak(), p("Triage and redirect questions", "Section")]
    for q in doc["questions"]:
        label = (
            f"Redirect → {q['GotoGuideline']}"
            if q["DispositionLevel"] is None
            else f"Disposition level {q['DispositionLevel']}"
        )
        story += [
            p(f"{q['QuestionOrder']}. {label}", "Heading3"),
            p(q["Question"]),
            p(q["Information"], "Small"),
        ]
    story += [p("Advice", "Section")]
    for advice in doc["advice"]:
        story += [p(advice["Title"], "Heading3"), *bullets(advice["Content"])]
    story += [
        p("First aid", "Section"),
        *bullets(doc["algorithm"]["FirstAid"]),
        p("References", "Section"),
        *bullets(format_reference(reference) for reference in doc["references"]),
        p("Provenance", "Section"),
        p(doc["_source"], "Small"),
        p(
            f"Manifest hash: {meta['canonicalContentHash']} | Status: {meta['validationStatus']}",
            "Small",
        ),
    ]
    pdf = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=doc["algorithm"]["Title"],
    )
    pdf.build(story)


for item in sorted(JSON_DIR.glob("*.db.json")):
    render(item)

print(f"Rendered {len(list(JSON_DIR.glob('*.db.json')))} PDFs")
