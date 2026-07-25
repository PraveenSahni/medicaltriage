# Batch 03 - Open-Source Guideline Decomposition

Generated: 2026-07-25

## Outcome

- Ten NHS.UK-derived condition families produced as 20 top-level demographic protocols.
- Nine mixed-age families have Adult Male/Female and source-age-eligible Child Male/Female variants.
- Adult-only High Blood Pressure has Adult Male/Female variants only.
- Algorithm IDs continue sequentially from Batch 2: 1049-1086.
- Every protocol contains condition-relevant intake questions and one schema-valid scope redirect.
- Pain assessment is included only for Cuts and Lacerations, where pain is directly relevant.
- `_source` is a plain string and tracking metadata is separate.
- Suicide Concerns uses Qatar emergency wording (999) and the HMC National Mental Health Helpline (16000, option 4) with an explicit out-of-hours emergency fallback.
- Every protocol has source-backed Background.KeyPoints; empty placeholder backgrounds are not permitted.

| ID | Protocol | Redirect | Status |
|---:|---|---|---|
| 1049 | Suicide Concerns - Male (Adult) | Depression | BLOCKED_BY_RESEARCH_GAP |
| 1050 | Suicide Concerns - Female (Adult) | Depression | BLOCKED_BY_RESEARCH_GAP |
| 1053 | Depression - Male (Adult) | Suicide Concerns | BLOCKED_BY_RESEARCH_GAP |
| 1054 | Depression - Female (Adult) | Suicide Concerns | BLOCKED_BY_RESEARCH_GAP |
| 1057 | Insomnia - Male (Adult) | Anxiety and Panic Attack | BLOCKED_BY_RESEARCH_GAP |
| 1058 | Insomnia - Female (Adult) | Anxiety and Panic Attack | BLOCKED_BY_RESEARCH_GAP |
| 1061 | Anxiety and Panic Attack - Male (Adult) | Depression | BLOCKED_BY_RESEARCH_GAP |
| 1062 | Anxiety and Panic Attack - Female (Adult) | Depression | BLOCKED_BY_RESEARCH_GAP |
| 1065 | Weakness (Generalized) and Fatigue - Male (Adult) | Diabetes - Low Blood Sugar | BLOCKED_BY_RESEARCH_GAP |
| 1066 | Weakness (Generalized) and Fatigue - Female (Adult) | Diabetes - Low Blood Sugar | BLOCKED_BY_RESEARCH_GAP |
| 1069 | Blood Pressure - High - Male (Adult) | Blood Pressure - Low | BLOCKED_BY_RESEARCH_GAP |
| 1070 | Blood Pressure - High - Female (Adult) | Blood Pressure - Low | BLOCKED_BY_RESEARCH_GAP |
| 1071 | Diabetes - Low Blood Sugar - Male (Adult) | Diabetes - High Blood Sugar | BLOCKED_BY_RESEARCH_GAP |
| 1072 | Diabetes - Low Blood Sugar - Female (Adult) | Diabetes - High Blood Sugar | BLOCKED_BY_RESEARCH_GAP |
| 1075 | Diabetes - High Blood Sugar - Male (Adult) | Diabetes - Low Blood Sugar | BLOCKED_BY_RESEARCH_GAP |
| 1076 | Diabetes - High Blood Sugar - Female (Adult) | Diabetes - Low Blood Sugar | BLOCKED_BY_RESEARCH_GAP |
| 1079 | Cuts and Lacerations - Male (Adult) | Animal Bite | BLOCKED_BY_RESEARCH_GAP |
| 1080 | Cuts and Lacerations - Female (Adult) | Animal Bite | BLOCKED_BY_RESEARCH_GAP |
| 1083 | Hearing Loss or Change - Male (Adult) | Earache | BLOCKED_BY_RESEARCH_GAP |
| 1084 | Hearing Loss or Change - Female (Adult) | Earache | BLOCKED_BY_RESEARCH_GAP |

## Running totals

- Condition families: 10
- Demographic protocols: 20
- Research-gap entries: 60
- Clinical-governance-approved protocols: 0
