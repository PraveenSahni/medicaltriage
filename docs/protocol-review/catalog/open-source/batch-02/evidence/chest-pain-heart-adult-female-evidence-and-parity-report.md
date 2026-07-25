# Chest Pain (HEART Score) - Female (Adult) - Evidence and Parity Report

## Status

- Algorithm ID: `1042`
- Age group: **Adult**
- Gender at birth: **Female**
- Completion status: **BLOCKED_BY_RESEARCH_GAP**
- Content hash: `32dcc2fe7b1166139712e317dd801e050574396d79fa3570726e53f5ef82c2ac`

## Canonical format

- `_source` is a single provenance string.
- Tracking metadata is held in `../manifests/batch-02-manifest.json`.
- The scope redirect uses `DispositionLevel: null` and a non-empty `GotoGuideline`.

## Demographic differentiation

- Adult-only applicability retained from the runtime source; no pediatric relabeling was performed.
- Pregnancy status is captured for imaging and treatment planning but does not alter the decision-rule score.

## Rule-safety boundary

- This protocol preserves the named rule's adult applicability.
- No child protocol was produced from an adult rule.
- Telephone-only limitations and local disposition choices require clinical governance approval.

## Parity

- Disposition questions: 5
- Redirect questions: 1
- Advice rows: 2
- Initial assessment questions: 6
- References: 3
