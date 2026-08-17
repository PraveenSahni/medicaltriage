# PR-015 Five-Protocol Adversarial Auto-Match Matrix

Date: 2026-08-17
Technical status: Passed
Clinical approval status: Pending named Clinical QA signature

## Safety behavior

Protocol matching now has three explicit outcomes:

- `PREPARED`: the leading candidate has score 100 or greater and is not
  within 5% of the second candidate;
- `AMBIGUOUS`: the two leading candidates are within 5%; no primary protocol,
  acuity preview, questions, disposition or care advice is selected; and
- `NO_MATCH`: no candidate reaches the minimum score.

Negated complaints (`no`, `not`, `without`, `denies`, `denied`, `never`) and
normal-state statements such as `moving normally` do not contribute positive
match credit. Weak and ambiguous candidates remain visible so the nurse can
explicitly select the clinically appropriate protocol. Selection remains
locked after TAQ answers or disposition to prevent mid-assessment lineage
changes.

## Executed matrix

The executable source of truth is
`tests/pr015ProtocolAdversarialMatrix.test.ts`. It contains five categories for
each of exactly five licensed protocols.

| Protocol | Clear | Synonym | Negation | Ambiguous | No match |
|---|---|---|---|---|---|
| Abdominal Pain - Male | decisive abdominal/epigastric pain | stomach ache/cramps/bloating | explicit no abdominal/stomach pain | abdominal plus ankle pain | non-clinical badge request |
| Diarrhea | watery diarrhea/loose bowel movements | loose stools/bowel motions | explicit no diarrhea/normal bowel movement | diarrhea plus abdominal pain | telephone-detail request |
| Pregnancy - Decreased/Abnormal Fetal Movement | decreased fetal movement | stopped kicking/reduced movement | baby moving normally | baby-movement concern plus diarrhea | appointment-time request |
| Ankle Pain | arthritis/bursitis pain without injury | ankle pain from arthritis/bursitis | explicit no ankle/joint pain | shared sprained/twisted/swollen wording | identity-card request |
| Ankle Injury | fracture/trauma/deformity | injury/broken bone/fall | explicit no injury/fracture/trauma | shared sprained/twisted/swollen wording | no medical symptom |

Result: **25/25 passed**.

## Nurse override evidence

`frontend/src/cockpit/ProtocolMatchPanel.test.tsx` proves that an ambiguous
result:

1. displays an explicit ambiguity warning;
2. displays no automatically selected guideline;
3. exposes both candidates to an authorized nurse; and
4. persists the nurse's exact choice as `matchedProtocolId` through
   `updateItemContext`.

The backend records this as a high-risk `QUEUE_CONTEXT_UPDATE` and includes
`previousMatchedProtocolId`, `selectedMatchedProtocolId` and the prepared
protocol status in the durable chained-ledger metadata.

Read-only users, cases with TAQ answers and cases with a disposition cannot
change the selection. Result: **10/10 UI tests passed**.

## Downstream lineage regression

The focused backend command covered the adversarial matrix, all five-protocol
question/advice/disposition lineage tests, queue orchestration and triage:

```powershell
npx.cmd jest tests/pr015ProtocolAdversarialMatrix.test.ts tests/protocolClinicalLineage.test.ts tests/queueOrchestration.test.ts tests/triage.test.ts --runInBand --silent
```

Result: **100/100 passed**. Backend and frontend TypeScript checks also passed.

## Required clinical signature

Technical tests prove deterministic behavior; they do not approve clinical
wording or thresholds. PR-015 closes only after a qualified reviewer completes:

- Reviewer name: ______________________________
- Role/licence: _______________________________
- Organization: _______________________________
- Review date: ________________________________
- Decision: Approve / Reject / Retest required
- Comments or defect references: __________________________________________
- Signature: _________________________________

The signed artifact must be retained with the release evidence, and the same
matrix must pass against the deployed candidate image before production
approval.
