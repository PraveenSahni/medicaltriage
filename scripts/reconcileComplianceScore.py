"""
Deterministic QR questionnaire compliance-score reconciliation.

Reads all 4 scored tabs of the live questionnaire workbook (Non Functional Req,
UX, AI, Cloud CSQ), normalizes only response values with an unambiguous mapping,
and reports both:
  - Method A (binary compliance rate): exact "Yes" / scored rows excluding N/A
  - Method B (weighted maturity score, NOT an authoritative QA metric):
    (Yes + 0.5*Partial) / scored rows excluding N/A

The workbook itself (Definitions & Instructions sheet) defines only 3 compliance
categories - Fully compliant / Partially compliant / Non-compliant - with no
numeric weight and no summary/scoring sheet, no formula cells, no named ranges.
There is therefore no workbook-authoritative weighted formula; Method B is
reported only as a supplementary, explicitly-labeled maturity indicator.

Usage: python scripts/reconcileComplianceScore.py <path-to-xlsx> [--json out.json] [--csv out.csv]
"""
import sys
import json
import csv
import argparse
from collections import Counter

import openpyxl

TABS = ["Non Functional Req", "UX", " AI", "Cloud CSQ"]

# Column layout differs per tab (confirmed by direct inspection, not assumed):
# Non Functional Req / UX / AI: A=S:No (id), E=Mandatory ("Yes"/blank), F=Compliance
# Cloud CSQ: D=CID (id), F=Control Requirement Type ("Mandatory"/"Optional"), I=Supplier Response
TAB_LAYOUT = {
    "Non Functional Req": {"id_col": 1, "mand_col": 5, "comp_col": 6, "mand_value": "yes", "header_row": 2},
    "UX": {"id_col": 1, "mand_col": 5, "comp_col": 6, "mand_value": "yes", "header_row": 2},
    " AI": {"id_col": 1, "mand_col": 5, "comp_col": 6, "mand_value": "yes", "header_row": 2},
    "Cloud CSQ": {"id_col": 4, "mand_col": 6, "comp_col": 9, "mand_value": "mandatory", "header_row": 9},
}


def normalize(raw):
    if raw is None:
        return "Blank", raw
    s = str(raw).strip()
    if s == "":
        return "Blank", raw
    low = s.lower()
    if low == "yes":
        return "Yes", raw
    if low == "partial":
        return "Partial", raw
    if low == "no":
        return "No", raw
    if low in ("n/a", "na", "not applicable"):
        return "N/A", raw
    return "Other", raw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx_path")
    ap.add_argument("--json", default=None)
    ap.add_argument("--csv", default=None)
    args = ap.parse_args()

    wb = openpyxl.load_workbook(args.xlsx_path, data_only=False)

    warnings = []
    per_tab = {}
    seen_keys = set()
    duplicate_keys = []

    overall_yes = overall_partial = overall_no = overall_other = overall_na = overall_blank = 0
    overall_mand_yes = overall_mand_partial = overall_mand_no = overall_mand_other = overall_mand_na = 0
    all_rows_out = []

    for tab in TABS:
        if tab not in wb.sheetnames:
            warnings.append("TAB MISSING: '" + tab + "' not found in workbook")
            continue
        ws = wb[tab]
        physical_rows = ws.max_row

        layout = TAB_LAYOUT[tab]
        id_col, mand_col, comp_col = layout["id_col"], layout["mand_col"], layout["comp_col"]
        header_row = layout["header_row"]
        mand_value = layout["mand_value"]

        requirement_rows = 0
        mandatory_rows = 0
        non_mandatory_rows = 0
        bucket_counts = Counter()
        mand_bucket_counts = Counter()
        unrecognized = []
        tab_rows_out = []

        for r in range(header_row + 1, ws.max_row + 1):
            rid = ws.cell(row=r, column=id_col).value
            comp_raw = ws.cell(row=r, column=comp_col).value
            mand_raw = ws.cell(row=r, column=mand_col).value

            if rid is None or str(rid).strip() == "":
                continue
            if comp_raw is None and mand_raw is None:
                continue

            requirement_rows += 1
            key = (tab, str(rid).strip(), r)
            if key in seen_keys:
                duplicate_keys.append(key)
            seen_keys.add(key)

            mand_norm = "Mandatory" if (mand_raw and str(mand_raw).strip().lower() == mand_value) else "Non-mandatory"
            if mand_norm == "Mandatory":
                mandatory_rows += 1
            else:
                non_mandatory_rows += 1

            bucket, raw_val = normalize(comp_raw)
            bucket_counts[bucket] += 1
            if bucket in ("Other", "Blank"):
                unrecognized.append({"tab": tab, "id": str(rid), "row": r, "raw": raw_val})

            if mand_norm == "Mandatory":
                mand_bucket_counts[bucket] += 1

            tab_rows_out.append({
                "tab": tab, "id": str(rid), "row": r,
                "mandatory": mand_norm, "response_raw": raw_val, "response_bucket": bucket,
            })

        scored_excl_na = requirement_rows - bucket_counts.get("N/A", 0)
        binary_num = bucket_counts.get("Yes", 0)
        weighted_num = bucket_counts.get("Yes", 0) + 0.5 * bucket_counts.get("Partial", 0)

        mand_scored_excl_na = mandatory_rows - mand_bucket_counts.get("N/A", 0)
        mand_binary_num = mand_bucket_counts.get("Yes", 0)
        mand_weighted_num = mand_bucket_counts.get("Yes", 0) + 0.5 * mand_bucket_counts.get("Partial", 0)

        per_tab[tab] = {
            "physical_rows": physical_rows,
            "requirement_rows": requirement_rows,
            "mandatory_rows": mandatory_rows,
            "non_mandatory_rows": non_mandatory_rows,
            "responses": dict(bucket_counts),
            "mandatory_responses": dict(mand_bucket_counts),
            "binary_scored_denominator": scored_excl_na,
            "binary_yes_numerator": binary_num,
            "binary_pct": round(100 * binary_num / scored_excl_na, 2) if scored_excl_na else None,
            "weighted_numerator": weighted_num,
            "weighted_denominator": scored_excl_na,
            "weighted_pct": round(100 * weighted_num / scored_excl_na, 2) if scored_excl_na else None,
            "mandatory_binary_scored_denominator": mand_scored_excl_na,
            "mandatory_binary_yes_numerator": mand_binary_num,
            "mandatory_binary_pct": round(100 * mand_binary_num / mand_scored_excl_na, 2) if mand_scored_excl_na else None,
            "mandatory_weighted_numerator": mand_weighted_num,
            "mandatory_weighted_pct": round(100 * mand_weighted_num / mand_scored_excl_na, 2) if mand_scored_excl_na else None,
            "unrecognized_values": unrecognized,
        }

        overall_yes += bucket_counts.get("Yes", 0)
        overall_partial += bucket_counts.get("Partial", 0)
        overall_no += bucket_counts.get("No", 0)
        overall_other += bucket_counts.get("Other", 0)
        overall_na += bucket_counts.get("N/A", 0)
        overall_blank += bucket_counts.get("Blank", 0)

        overall_mand_yes += mand_bucket_counts.get("Yes", 0)
        overall_mand_partial += mand_bucket_counts.get("Partial", 0)
        overall_mand_no += mand_bucket_counts.get("No", 0)
        overall_mand_other += mand_bucket_counts.get("Other", 0)
        overall_mand_na += mand_bucket_counts.get("N/A", 0)

        all_rows_out.extend(tab_rows_out)

    if duplicate_keys:
        warnings.append("DUPLICATE ROW KEYS DETECTED: " + str(duplicate_keys))

    overall_scored_excl_na = overall_yes + overall_partial + overall_no + overall_other
    overall_binary_pct = round(100 * overall_yes / overall_scored_excl_na, 2) if overall_scored_excl_na else None
    overall_weighted = overall_yes + 0.5 * overall_partial
    overall_weighted_pct = round(100 * overall_weighted / overall_scored_excl_na, 2) if overall_scored_excl_na else None

    overall_mand_scored = overall_mand_yes + overall_mand_partial + overall_mand_no + overall_mand_other
    overall_mand_binary_pct = round(100 * overall_mand_yes / overall_mand_scored, 2) if overall_mand_scored else None
    overall_mand_weighted = overall_mand_yes + 0.5 * overall_mand_partial
    overall_mand_weighted_pct = round(100 * overall_mand_weighted / overall_mand_scored, 2) if overall_mand_scored else None

    for tab, data in per_tab.items():
        if data["unrecognized_values"]:
            warnings.append("UNRECOGNIZED VALUES in " + tab + ": " + str(len(data["unrecognized_values"])) + " rows - see JSON output")

    result = {
        "workbook_note": (
            "No workbook-authoritative weighted scoring formula exists. "
            "Definitions & Instructions sheet defines only 3 compliance categories "
            "(Fully compliant / Partially compliant / Non-compliant) with no numeric "
            "weight, no summary/scoring sheet, no formula cells, no named ranges. "
            "Method A (binary: exact Yes / scored rows excluding N/A) is the only "
            "metric directly supported by the workbook's own definitions. Method B "
            "(weighted maturity: (Yes + 0.5*Partial) / scored rows excluding N/A) is "
            "reported separately as a supplementary, non-authoritative maturity "
            "indicator only."
        ),
        "per_tab": per_tab,
        "overall": {
            "responses": {"Yes": overall_yes, "Partial": overall_partial, "No": overall_no, "Other": overall_other, "N/A": overall_na, "Blank": overall_blank},
            "binary_scored_denominator": overall_scored_excl_na,
            "binary_yes_numerator": overall_yes,
            "binary_pct": overall_binary_pct,
            "weighted_numerator": overall_weighted,
            "weighted_denominator": overall_scored_excl_na,
            "weighted_pct": overall_weighted_pct,
        },
        "mandatory_overall": {
            "responses": {"Yes": overall_mand_yes, "Partial": overall_mand_partial, "No": overall_mand_no, "Other": overall_mand_other, "N/A": overall_mand_na},
            "binary_scored_denominator": overall_mand_scored,
            "binary_yes_numerator": overall_mand_yes,
            "binary_pct": overall_mand_binary_pct,
            "weighted_numerator": overall_mand_weighted,
            "weighted_pct": overall_mand_weighted_pct,
        },
        "warnings": warnings,
        "duplicate_keys": [list(k) for k in duplicate_keys],
    }

    print(json.dumps(result, indent=2))

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

    if args.csv:
        with open(args.csv, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["tab", "id", "row", "mandatory", "response_raw", "response_bucket"])
            w.writeheader()
            w.writerows(all_rows_out)

    for w_ in warnings:
        print("WARNING: " + w_, file=sys.stderr)


if __name__ == "__main__":
    main()
