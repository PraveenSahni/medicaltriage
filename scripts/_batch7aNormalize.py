import openpyxl
from datetime import date

path = r"C:\Users\PraveenSAHNI\OneDrive - IRISSTAR TECHNOLOGIES\000.PSDownload\NFR_COTS_CSQ_v8.3-edc758c5-2b70-496a-9db4-947af34a67a4.xlsx"
today = "2026-08-05"

wb = openpyxl.load_workbook(path)

def count_tab_nfr_shape(ws, mandatory_col=5, compliance_col=6, header_row=2, start_row=3):
    total = yes = na = partial = no = other = 0
    for row in range(start_row, ws.max_row + 1):
        mand = ws.cell(row=row, column=mandatory_col).value
        if mand != "Yes":
            continue
        comp = ws.cell(row=row, column=compliance_col).value
        total += 1
        if comp == "Yes":
            yes += 1
        elif comp is None:
            other += 1
        elif "N/A" in str(comp):
            na += 1
        elif comp == "Partial":
            partial += 1
        elif comp == "No":
            no += 1
        else:
            other += 1
    return dict(total=total, yes=yes, na=na, partial=partial, no=no, other=other)

def count_csq_shape(ws, mandatory_col=6, compliance_col=9, start_row=11):
    total = yes = na = partial = no = other = 0
    for row in range(start_row, ws.max_row + 1):
        mand = ws.cell(row=row, column=mandatory_col).value
        if mand != "Mandatory":
            continue
        comp = ws.cell(row=row, column=compliance_col).value
        total += 1
        if comp == "Yes":
            yes += 1
        elif comp is None:
            other += 1
        elif "N/A" in str(comp):
            na += 1
        elif comp == "Partial":
            partial += 1
        elif comp == "No" or (isinstance(comp, str) and "Needs" in comp):
            no += 1
        elif isinstance(comp, str) and "inherited" in comp:
            other += 1  # tracked separately below
        else:
            other += 1

    return dict(total=total, yes=yes, na=na, partial=partial, no=no, other=other)

def snapshot():
    ws_nfr = wb["Non Functional Req"]
    ws_ux = wb["UX"]
    ws_ai = wb[" AI"]
    ws_csq = wb["Cloud CSQ"]
    return {
        "NFR": count_tab_nfr_shape(ws_nfr),
        "UX": count_tab_nfr_shape(ws_ux),
        "AI": count_tab_nfr_shape(ws_ai),
        "CSQ": count_csq_shape(ws_csq),
    }

before = snapshot()

# --- Apply edits ---
ws_csq = wb["Cloud CSQ"]

def find_row(ws, id_col, target_id, start_row=11):
    for row in range(start_row, ws.max_row + 1):
        if ws.cell(row=row, column=id_col).value == target_id:
            return row
    return None

edits_yes_inherited = {
    "PA.03": "Physical perimeter security is real and independently attested by Google Cloud for its data centers (fences, guards, surveillance, access control), per Google Cloud's published SOC 2 Type II / ISO 27001 attestations (Google Cloud Trust Center) - inherited from the underlying platform, not something this application team operates directly, but genuinely, verifiably in place. Normalized from \"Yes (inherited)\" to \"Yes\" on {date} (Batch 7A integrity normalization) - no scope limitation found that would justify anything less than Yes; re-assess only if hosting is ever migrated off Google Cloud.",
    "DR.06": "Physical protection against natural disasters and deliberate attacks for the underlying data center is real and independently attested by Google Cloud (Google Cloud Trust Center, SOC 2 Type II / ISO 27001), inherited from the platform. Normalized from \"Yes (inherited)\" to \"Yes\" on {date} (Batch 7A integrity normalization) - no contradicting evidence found; re-assess only if hosting is ever migrated off Google Cloud.",
    "DR.07": "Power/network redundancy for the physical data center is a real, independently-attested Google Cloud capability (Google Cloud Trust Center, SOC 2 Type II / ISO 27001), inherited from the platform. Normalized from \"Yes (inherited)\" to \"Yes\" on {date} (Batch 7A integrity normalization) - no contradicting evidence found; re-assess only if hosting is ever migrated off Google Cloud.",
    "AR.19": "Google Cloud's infrastructure uses synchronized time services (NTP or equivalent) by default across all managed compute - a real, platform-inherited guarantee, confirmed both by Google Cloud's own published infrastructure documentation and by the consistent, correct timestamps observed throughout this engagement's logging and audit-trail work. Normalized from \"Yes (inherited)\" to \"Yes\" on {date} (Batch 7A integrity normalization) - no contradicting evidence found; re-assess only if hosting is ever migrated off Google Cloud.",
}

for cid, remark_template in edits_yes_inherited.items():
    row = find_row(ws_csq, 4, cid)
    assert row, f"row not found for {cid}"
    ws_csq.cell(row=row, column=9).value = "Yes"
    ws_csq.cell(row=row, column=10).value = remark_template.format(date=today)

edits_to_na = {
    "IS.41": "No local operating-system-layer vulnerability scanning is performed by this application team, and none can be, by architecture: Cloud Run is a fully managed, Google-operated compute platform with no persistent, application-team-accessible OS layer to scan. OS-layer patching and vulnerability management for the underlying host is Google's own contractual responsibility under Google Cloud's published shared-responsibility model for serverless/PaaS services (covered by Google's own SOC 2 Type II / ISO 27001 attestations), not a gap in this application's controls. Reclassified from \"No\" to \"N/A\" on {date} (Batch 7A integrity verification) - this reassessment is required if the application is ever migrated off a fully managed serverless platform (e.g. to self-managed VMs), at which point OS-layer scanning would become this team's direct responsibility again.",
    "IS.73": "No dedicated detection capability for virtualization-layer/hypervisor attacks (e.g. shimming, Blue Pill, hyperjacking) exists, and none is architecturally possible for this application team to build: on Cloud Run, the hypervisor layer is entirely Google-operated and Google-attested (SOC 2 Type II / ISO 27001), with zero guest-level access to detect at that layer even in principle. Reclassified from \"No\" to \"N/A\" on {date} (Batch 7A integrity verification) - reassessment required if the application is ever migrated to a model where this team operates its own hypervisor/virtualization layer.",
    "SD.06": "No control exists to detect or restrict unauthorized software installation onto the underlying infrastructure, and none is architecturally meaningful in this deployment model: Cloud Run runs immutable, ephemeral container images built entirely through this repository's own CI/CD pipeline, with no persistent filesystem or interactive access for software to be \"installed\" onto in the traditional sense outside that pipeline. The supply-chain equivalent of this risk (unauthorized/unreviewed code entering the deployed image) is the real, already-covered control - see this engagement's SBOM generation and dependency-vulnerability scanning in CI. Reclassified from \"No\" to \"N/A\" on {date} (Batch 7A integrity verification) - reassessment required if the deployment model ever includes persistent, directly-administered compute (VMs/on-prem) where traditional software-installation controls would become directly applicable.",
}

ws_nfr = wb["Non Functional Req"]

def find_row_nfr(ws, id_col, target_id, start_row=3):
    for row in range(start_row, ws.max_row + 1):
        if ws.cell(row=row, column=id_col).value == target_id:
            return row
    return None

row = find_row_nfr(ws_nfr, 1, "NFR-064")
assert row
ws_nfr.cell(row=row, column=6).value = "N/A"
ws_nfr.cell(row=row, column=7).value = (
    "No data-handoff pipeline of the specific kind this row addresses (a distinct, "
    "separately-encrypted data-handoff channel beyond standard API traffic) exists in "
    "this application - all real API traffic is already TLS-encrypted in transit by "
    "Cloud Run/Firebase Hosting by default, and there is no additional, separate "
    "\"handoff\" mechanism this control would apply to beyond that. Reclassified from "
    "\"No\" to \"N/A\" on " + today + " (Batch 7A integrity verification) - this "
    "corrects an internal inconsistency where the prior remark's own prose already "
    "said \"Not applicable\" while the Compliance cell read \"No\"; reassessment "
    "required if a distinct data-handoff/interchange pipeline (e.g. batch file "
    "transfer to a third party) is ever introduced."
)

# Apply IS.41 / IS.73 / SD.06 edits
for cid, remark_template in edits_to_na.items():
    row = find_row(ws_csq, 4, cid)
    assert row, f"row not found for {cid}"
    ws_csq.cell(row=row, column=9).value = "N/A"
    ws_csq.cell(row=row, column=10).value = remark_template.format(date=today)

# --- Integrity-correction-only remarks (Compliance value unchanged) ---
row_is11 = find_row(ws_csq, 4, "IS.11")
assert row_is11
ws_csq.cell(row=row_is11, column=10).value = (
    "No documented policy exists stating the consequences of a security-policy "
    "violation to employees - this is a genuine, unimplemented HR/security-policy "
    "gap (the same real gap as IS.10, a formal disciplinary/sanction policy), not an "
    "architectural non-applicability. Corrected on " + today + " (Batch 7A integrity "
    "review) - the prior remark's \"not applicable\" framing was inaccurate and has "
    "been replaced with an honest \"real gap, pending an HR-owned disciplinary/"
    "awareness policy\" framing; see docs/qr-compliance/mandatory-action-register.md."
)

row_ar17 = find_row(ws_csq, 4, "AR.17")
assert row_ar17
ws_csq.cell(row=row_ar17, column=10).value = (
    "This application has no physical network infrastructure of its own to monitor "
    "for rogue/unauthorized devices - Google Cloud's own network-security controls "
    "cover the hosting-infrastructure side and are independently attested (SOC 2 Type "
    "II / ISO 27001). However, whether IST Health operates any physical corporate-"
    "office network (with its own Wi-Fi/rogue-device exposure) outside this "
    "cloud-hosted application has not been confirmed and is not something this "
    "engagement's codebase review can verify - that fact requires input from IST's "
    "own Facilities/IT function. Corrected on " + today + " (Batch 7A integrity "
    "review) - retained as \"No\" rather than reclassified to N/A, since the "
    "corporate-office-network scope is genuinely unconfirmed rather than confirmed "
    "non-applicable; see docs/qr-compliance/mandatory-action-register.md."
)

after = snapshot()

wb.save(path)

print("BEFORE:", before)
print("AFTER:", after)
