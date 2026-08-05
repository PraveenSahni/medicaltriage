import csv

rows = list(csv.DictReader(open("docs/qr-compliance/master-compliance-register.csv", encoding="utf-8-sig")))

def categorize(remark, bucket):
    r = remark.lower()
    if "external audit" in r or "penetration test" in r or "soc 2 type ii" in r or "iso 27001" in r or "third-party audit" in r:
        return "External audit or certification required"
    if "security command center" in r or "cmek" in r and "does not support" in r:
        return "Cannot currently comply"
    if "hr policy" in r or "training program" in r or "organizational process question" in r or "organizational hr policy" in r:
        return "Operational process closure"
    if "legal" in r or "qatar's specific data-protection law" in r or "subpoena" in r or "jurisdiction" in r:
        return "Privacy or legal closure"
    if "no formal, documented" in r or "no formal, published" in r or "no documented procedure" in r or "no formal process" in r:
        return "Documentation closure"
    if "terraform" in r or "cloud armor" in r or "drift" in r or "vpc" in r or "iam" in r:
        return "Cloud or infrastructure closure"
    if "not applicable" in r or "not directly applicable" in r:
        return "Valid N/A (candidate - verify)"
    if "dast" in r or "scan" in r or "vulnerability" in r:
        return "Testing or validation closure"
    if bucket == "Partial":
        return "Existing control - evidence missing (tentative)"
    return "Cannot currently comply"

out = []
for r in rows:
    if r["Status"] != "Not yet triaged":
        out.append(r)
        continue
    r["Closure Category"] = categorize(r["Current Remarks"], r["Bucket"])
    r["Identified Gap"] = r["Current Remarks"][:250]
    out.append(r)

fields = list(out[0].keys())
with open("docs/qr-compliance/master-compliance-register.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(out)

from collections import Counter
cat_counts = Counter(r["Closure Category"] for r in out if r["Status"] == "Not yet triaged")
for c, n in cat_counts.most_common():
    print(n, c)

# Batch 1 candidates: mandatory, Documentation closure category, not yet triaged
batch1 = [r for r in out if r["Mandatory"] == "Mandatory" and r["Closure Category"] == "Documentation closure"]
print("\n--- Batch 1 documentation-closure candidates (mandatory) ---")
for r in batch1:
    print(r["Tab"], r["ID"], "|", r["Current Remarks"][:150])
