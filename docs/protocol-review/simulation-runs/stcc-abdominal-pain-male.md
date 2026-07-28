# Simulation Transcript: stcc-abdominal-pain-male

**Queue Item ID:** case-15463fb3-7083-4d9a-a717-e137f0a30c1e
**Employee (staff record):** IST-00014 - Ramp Agent, Ground Operations
**Patient:** Employee Dependent, age 34, biological sex: male
**Reason for Call (caller narrative):** "Severe abdominal pain and stomach pain for two hours, epigastric pain that comes and goes."

**Auto-matched protocol:** stcc-abdominal-pain-male - "Abdominal Pain - Male"
**Match correct:** YES

## Initial Assessment Questions (10)

- **Q (LOCATION):** 1. LOCATION: "Where does it hurt?"
  **Simulated patient response:** Localized, one side, not spreading
- **Q (OPEN_TEXT):** 2. RADIATION: "Does the pain shoot anywhere else?" (e.g., chest, back)
  **Simulated patient response:** No additional findings reported by caller.
- **Q (DURATION):** 3. ONSET: "When did the pain begin?" (e.g., minutes, hours or days ago)
  **Simulated patient response:** Since yesterday
- **Q (OPEN_TEXT):** 4. SUDDEN: "Gradual or sudden onset?"
  **Simulated patient response:** No additional findings reported by caller.
- **Q (OPEN_TEXT):** 5. PATTERN: "Does the pain come and go, or is it constant?" - If it comes and goes: "How long does it last?" "Do you have pain now?" (Note: Comes and goes means the pain is intermittent. It goes away completely between bouts.) - If constant: "Is it getting better, staying the same, or getting worse?" (Note: Constant means the pain never goes away completely; most serious pain is constant and gets worse.)
  **Simulated patient response:** No additional findings reported by caller.
- **Q (PAIN_SCALE):** 6. SEVERITY: "How bad is the pain?" (e.g., Scale 1-10; mild, moderate, or severe) - MILD (1-3): Doesn't interfere with normal activities, abdomen soft and not tender to touch. - MODERATE (4-7): Interferes with normal activities or awakens from sleep, abdomen tender to touch. - SEVERE (8-10): Excruciating pain, doubled over, unable to do any normal activities.
  **Simulated patient response:** Moderate (4-7)
- **Q (YES_NO):** 7. RECURRENT SYMPTOM: "Have you ever had this type of stomach pain before?" If Yes, ask: "When was the last time?" and "What happened that time?"
  **Simulated patient response:** No
- **Q (OPEN_TEXT):** 8. CAUSE: "What do you think is causing the stomach pain?" (e.g., gallstones, recent abdominal surgery)
  **Simulated patient response:** No additional findings reported by caller.
- **Q (OPEN_TEXT):** 9. RELIEVING/AGGRAVATING FACTORS: "What makes it better or worse?" (e.g., antacids, bending or twisting motion, bowel movement)
  **Simulated patient response:** No additional findings reported by caller.
- **Q (OPEN_TEXT):** 10. OTHER SYMPTOMS: "Do you have any other symptoms?" (e.g., back pain, diarrhea, fever, urination pain, vomiting)
  **Simulated patient response:** No additional findings reported by caller.

## Triage Acuity Questions (30, most urgent first)

1. **[Emergency]** Shock suspected (e.g., cold/pale/clammy skin, too weak to stand, low BP, rapid pulse)
   _Rationale: R/O: shock. FIRST AID: Lie down with the feet elevated._
   **Simulated patient response:** No
2. **[Emergency]** Difficult to awaken or acting confused (e.g., disoriented, slurred speech)
   _Rationale: R/O: shock. FIRST AID: Lie down with the feet elevated._
   **Simulated patient response:** No
3. **[Emergency]** Passed out (e.g., fainted, lost consciousness, blacked out and was not responding)
   _Rationale: R/O: shock. FIRST AID: Lie down with the feet elevated._
   **Simulated patient response:** No
4. **[Emergency]** Sounds like a life-threatening emergency to the triager
   _Rationale: STCC disposition level 100._
   **Simulated patient response:** No
5. **[Emergency]** [1] SEVERE pain (e.g., excruciating) AND [2] present > 1 hour
   _Rationale: R/O: appendicitis or other acute abdomen_
   **Simulated patient response:** No
6. **[Emergency]** [1] SEVERE pain AND [2] age > 60 years
   _Rationale: Reason: Higher risk of serious cause of abdominal pain._
   **Simulated patient response:** No
7. **[Emergency]** [1] Vomiting AND [2] contains red blood or black ("coffee ground") material (Exception: Few red streaks in vomit that only happened once.)
   _Rationale: R/O: gastritis, peptic ulcer disease, Mallory-Weiss tear (tear in esophagus from hard vomiting)_
   **Simulated patient response:** No
8. **[Emergency]** Blood in bowel movements (Exception: Blood on surface of BM with constipation.)
   _Rationale: R/O: gastritis, peptic ulcer disease_
   **Simulated patient response:** No
9. **[Emergency]** Black or tarry bowel movements (Exceptions: Newly black-grey BMs from taking Pepto-Bismol/Kaopectate or unchanged black BMs from taking iron pills.)
   _Rationale: R/O: gastritis, peptic ulcer disease, gastrointestinal bleeding. Note: Certain medicines (such as Kaopectate, Pepto-Bismol) and iron pills can give the stool a somewhat darker or grey-black color. These medicines should not turn the stool jet-black, tarry, sticky, or foul smelling (i.e., like melena)._
   **Simulated patient response:** No
10. **[Emergency]** [1] Unable to urinate (or only a few drops) > 4 hours AND [2] bladder feels very full (e.g., palpable bladder or strong urge to urinate)
   _Rationale: R/O: urinary retention_
   **Simulated patient response:** No
11. **[Emergency]** [1] Pain in the scrotum or testicle AND [2] present > 1 hour
   _Rationale: R/O: testicular torsion, kidney stone_
   **Simulated patient response:** No
12. **[Emergency]** [1] Vomiting AND [2] contains bile (green color)
   _Rationale: R/O: intestinal obstruction_
   **Simulated patient response:** No
13. **[Emergency]** Patient sounds very sick or weak to the triager
   _Rationale: Reason: Severe acute illness or serious complication suspected._
   **Simulated patient response:** No
14. **[Urgent]** [1] MILD to MODERATE pain AND [2] constant AND [3] present > 2 hours
   _Rationale: R/O: appendicitis or other acute abdomen_
   **Simulated patient response:** No
15. **[Urgent]** [1] MILD to MODERATE pain AND [2] constant AND [3] age > 60 years
   _Rationale: R/O: appendicitis or other acute abdomen. Reason: Higher risk of serious cause of abdominal pain._
   **Simulated patient response:** No
16. **[Urgent]** [1] Vomiting AND [2] abdomen looks much more swollen than usual
   _Rationale: R/O: intestinal obstruction_
   **Simulated patient response:** YES
   -> Terminal question reached. Disposition code: HMC_URGENT_REVIEW

## Disposition

- **Severity:** URGENT
- **Disposition code:** HMC_URGENT_REVIEW
- **Destination:** HMC urgent review pathway

## Care Advice (5)

- **CALL BACK IF:
* You become wo:** CALL BACK IF: * You become worse
- **NOTE TO TRIAGER - AMBULANCE TR:** NOTE TO TRIAGER - AMBULANCE TRANSPORT FOR BEDRIDDEN PATIENT: * Because of bedridden state, it is likely that the patient will need to be transported via ambulance and examined at the emergency department. * Caregivers can arrange ambulance transport via private ambulance company or via EMS 911.
- **SEE HCP (OR PCP TRIAGE) WITHIN:** SEE HCP (OR PCP TRIAGE) WITHIN 4 HOURS: * IF OFFICE WILL BE OPEN: You need to be seen within the next 3 or 4 hours. Call your doctor (or NP/PA) now or as soon as the office opens. * IF OFFICE WILL BE CLOSED AND NO PCP (PRIMARY CARE PROVIDER) SECOND-LEVEL TRIAGE: You need to be seen within the next 3 or 4 hours. A nearby Urgent Care Center (UCC) is often a good source of care. Another choice is to go to the ED. Go sooner if you become worse. * IF OFFICE WILL BE CLOSED AND PCP SECOND-LEVEL TRIAGE REQUIRED: You may need to be seen. Your doctor (or NP/PA) will want to talk with you to decide what's best. I'll page the on-call provider now. If you haven't heard from the provider (or me) within 30 minutes, call again. NOTE: If on-call provider can't be reached, send to UCC or ED. NOTE TO TRIAGER: * Use nurse judgment to select the most appropriate source of care. * Consider both the urgency of the patient's symptoms AND what resources may be needed to evaluate and manage the patient. SOURCES OF CARE: * ED: Patients who may need surgery or hospital admission need to be sent to an ED. So do most patients with serious symptoms or complex medical problems. * UCC: Some UCCs can manage patients who are stable and have less serious symptoms (e.g., minor illnesses and injuries). The triager must know the UCC capabilities before sending a patient there. If unsure, call ahead. * OFFICE: If patient sounds stable and not seriously ill, consult PCP (or follow your office policy) to see if patient can be seen NOW in office.
- **FEVER MEDICINE - ACETAMINOPHEN:** FEVER MEDICINE - ACETAMINOPHEN: * Fever above 101° F (38.3° C) should be treated with acetaminophen (such as Tylenol). * It is an over-the-counter (OTC) drug that helps treat both fever and pain. You can buy it at the drugstore. * The goal of fever therapy is to bring the fever down to a comfortable level. Remember that fever medicine usually lowers fever 2 to 3° F (1 to 1.5° C). * ACETAMINOPHEN - REGULAR STRENGTH TYLENOL: Take 650 mg (two 325 mg pills) by mouth every 4 to 6 hours as needed. Each Regular Strength Tylenol pill has 325 mg of acetaminophen. The most you should take is 10 pills a day (3,250 mg total). Note: In Canada, the maximum is 12 pills a day (3,900 mg total). * ACETAMINOPHEN - EXTRA STRENGTH TYLENOL: Take 1,000 mg (two 500 mg pills) every 6 to 8 hours as needed. Each Extra Strength Tylenol pill has 500 mg of acetaminophen. The most you should take is 6 pills a day (3,000 mg total). Note: In Canada, the maximum is 8 pills a day (4,000 mg total). * Use the lowest amount of medicine that makes your fever better.
- **FEVER MEDICINE - ACETAMINOPHEN:** FEVER MEDICINE - ACETAMINOPHEN - EXTRA NOTES AND WARNINGS: * Follow these dosing instructions unless your doctor (or NP/PA) has told you to take a different dose. * Acetaminophen is in many OTC and prescription medicines. It might be in more than one medicine that you are taking. You need to be careful and not take an overdose. An acetaminophen overdose can hurt the liver. * CAUTION: Do not take acetaminophen if you have liver disease. * Before taking any medicine, read all the instructions on the package.

## Reference / Patient Education (Supplementals) (4)

- **Acid Indigestion, Heartburn, and Sour Stomach** (Adult OTC Drug Dosage Table): See guideline for details.
- **Gastroesophageal Reflux Disease** (Adult OTC Drug Dosage Table): See guideline for details.
- **Constipation** (Adult OTC Drug Dosage Table): See guideline for details.
- **Diarrhea** (Adult OTC Drug Dosage Table): See guideline for details.

## Final Persisted State

- **Status:** COMPLETED
- **Disposition code (persisted):** HMC_URGENT_REVIEW
- **Severity (persisted):** URGENT
- **Destination (persisted):** HMC urgent review pathway
- **Validated end-to-end:** YES