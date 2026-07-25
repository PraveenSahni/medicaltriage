// One-off text-correction script: replaces every known UK-specific NHS
// operational term (GP, 111, A&E, and prior half-fixed "Qatar urgent clinical
// review pathway" phrasing) with clean, natural Qatar-appropriate wording
// across the open-source guideline catalog's source JSON files. Exact-string
// replacement only -- no clinical meaning/severity tier changed, only the
// operational-system references. Applies to json/ (Batch 1), batch-03/json,
// batch-04/json, batch-05/json, batch-06/json, batch-07/json, batch-08/json.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const CATALOG_ROOT = path.resolve("docs/protocol-review/catalog/open-source");
const DIRS = [
  "json",
  "batch-03/json",
  "batch-04/json",
  "batch-05/json",
  "batch-06/json",
  "batch-07/json",
  "batch-08/json"
];

const REPLACEMENTS = [
  // --- Emergency tier: keep 999 (Qatar-appropriate), fix A&E -> Emergency Department ---
  [
    "NHS.UK animal and human bites guidance lists a large or deep wound, or bleeding that cannot be stopped, as call-999/A&E criteria.",
    "NHS.UK animal and human bites guidance lists a large or deep wound, or bleeding that cannot be stopped, as call-999/Emergency Department criteria."
  ],
  [
    "NHS.UK back pain guidance lists bilateral leg symptoms, saddle numbness, new bladder/bowel changes, sexual dysfunction, concurrent chest pain, and a major-trauma trigger as its own call-999/A&E criteria - possible cauda equina syndrome or major trauma.",
    "NHS.UK back pain guidance lists bilateral leg symptoms, saddle numbness, new bladder/bowel changes, sexual dysfunction, concurrent chest pain, and a major-trauma trigger as its own call-999/Emergency Department criteria - possible cauda equina syndrome or major trauma."
  ],
  [
    "NHS.UK burns and scalds guidance lists large/deep burns, burns to the face/genitals/bottom, and chemical or electrical burns as call-999/A&E criteria.",
    "NHS.UK burns and scalds guidance lists large/deep burns, burns to the face/genitals/bottom, and chemical or electrical burns as call-999/Emergency Department criteria."
  ],
  [
    "NHS.UK carbon monoxide poisoning guidance lists these as call-999/A&E criteria for suspected exposure. Do not drive to hospital - call for an ambulance instead.",
    "NHS.UK carbon monoxide poisoning guidance lists these as call-999/Emergency Department criteria for suspected exposure. Do not drive to hospital - call for an ambulance instead."
  ],
  [
    "NHS.UK frostbite guidance lists these as call-999/A&E criteria, including hypothermia signs (constant shivering, slurred speech, slow breathing, confusion).",
    "NHS.UK frostbite guidance lists these as call-999/Emergency Department criteria, including hypothermia signs (constant shivering, slurred speech, slow breathing, confusion)."
  ],
  [
    "NHS.UK headache guidance lists these as call-999/A&E criteria - possible stroke, meningitis, or other serious cause.",
    "NHS.UK headache guidance lists these as call-999/Emergency Department criteria - possible stroke, meningitis, or other serious cause."
  ],
  [
    "NHS.UK nosebleed guidance lists prolonged/excessive bleeding, a head-injury trigger, and weakness/dizziness/breathing difficulty as call-999/A&E criteria.",
    "NHS.UK nosebleed guidance lists prolonged/excessive bleeding, a head-injury trigger, and weakness/dizziness/breathing difficulty as call-999/Emergency Department criteria."
  ],
  [
    "NHS.UK cuts and grazes guidance lists these as call-999/A&E criteria.",
    "NHS.UK cuts and grazes guidance lists these as call-999/Emergency Department criteria."
  ],
  [
    "NHS.UK high blood sugar guidance lists these as call-999/A&E criteria for possible diabetic ketoacidosis (DKA). Do not drive to A&E - call an ambulance.",
    "NHS.UK high blood sugar guidance lists these as call-999/Emergency Department criteria for possible diabetic ketoacidosis (DKA). Do not drive to the Emergency Department - call an ambulance."
  ],
  [
    "Do not drive to A&E yourself - call an ambulance or have someone else drive. Keep the person as calm and still as possible while waiting.",
    "Do not drive to the Emergency Department yourself - call an ambulance or have someone else drive. Keep the person as calm and still as possible while waiting."
  ],
  [
    "NHS.UK guidance lists this as a call-999 sign for both adults and children. Do not drive to A&E - call an ambulance or have someone else drive.",
    "NHS.UK guidance lists this as a call-999 sign for both adults and children. Do not drive to the Emergency Department - call an ambulance or have someone else drive."
  ],
  [
    'NHS.UK guidance: "go to A&E or call 999 if someone suddenly becomes confused" - many causes need urgent assessment and can be life-threatening (infection, stroke, low blood sugar, head injury, medication, carbon monoxide, severe respiratory/cardiac problems, seizure).',
    'NHS.UK guidance: "go to the Emergency Department or call 999 if someone suddenly becomes confused" - many causes need urgent assessment and can be life-threatening (infection, stroke, low blood sugar, head injury, medication, carbon monoxide, severe respiratory/cardiac problems, seizure).'
  ],
  [
    'NHS.UK guidance: \\"go to A&E or call 999 if someone suddenly becomes confused\\" - many causes need urgent assessment and can be life-threatening (infection, stroke, low blood sugar, head injury, medication, carbon monoxide, severe respiratory/cardiac problems, seizure).',
    'NHS.UK guidance: \\"go to the Emergency Department or call 999 if someone suddenly becomes confused\\" - many causes need urgent assessment and can be life-threatening (infection, stroke, low blood sugar, head injury, medication, carbon monoxide, severe respiratory/cardiac problems, seizure).'
  ],
  [
    "Is the person severely distressed, at risk of harming themselves or others, or refusing to go to A&E when they urgently need to?",
    "Is the person severely distressed, at risk of harming themselves or others, or refusing to go for emergency care when they urgently need to?"
  ],
  [
    "NHS.UK psychosis guidance: for a crisis where someone is at risk, take them to A&E if they agree, contact their GP or out-of-hours GP, or call 999 for an ambulance.",
    "NHS.UK psychosis guidance: for a crisis where someone is at risk, take them to the Emergency Department if they agree, contact the HMC urgent mental health pathway (16000, option 4), or call 999 for an ambulance."
  ],
  [
    "NHS.UK poisoning guidance lists these as call-999/A&E criteria. Do not try to make the person sick - they could choke. Start CPR if unresponsive and not breathing; place in recovery position if unconscious but breathing.",
    "NHS.UK poisoning guidance lists these as call-999/Emergency Department criteria. Do not try to make the person sick - they could choke. Start CPR if unresponsive and not breathing; place in recovery position if unconscious but breathing."
  ],
  [
    "NHS.UK guidance: go to A&E or call 999 if you think you or your child have hypothermia - do not drive yourself, ask someone else to drive or call an ambulance.",
    "NHS.UK guidance: go to the Emergency Department or call 999 if you think you or your child have hypothermia - do not drive yourself, ask someone else to drive or call an ambulance."
  ],
  [
    "NHS.UK COVID-19 guidance lists these as call-999/A&E criteria.",
    "NHS.UK COVID-19 guidance lists these as call-999/Emergency Department criteria."
  ],

  // --- Urgent tier: standalone "111" calls (no GP mention) ---
  [
    "NHS.UK guidance lists these as reasons to call 111 for same-day assessment rather than manage entirely at home.",
    "NHS.UK guidance lists these as reasons for a same-day urgent clinical review rather than managing entirely at home."
  ],
  [
    "NHS.UK guidance recommends calling 111 whenever there is uncertainty about a burn or scald, and specifically for children under 5.",
    "NHS.UK guidance recommends an urgent clinical review whenever there is uncertainty about a burn or scald, and specifically for children under 5."
  ],
  [
    "NHS.UK guidance recommends calling 111 for suspected carbon monoxide exposure when severe symptoms are not present.",
    "NHS.UK guidance recommends an urgent clinical review for suspected carbon monoxide exposure when severe symptoms are not present."
  ],
  [
    "NHS.UK guidance recommends calling 111 for these symptoms alongside high blood pressure.",
    "NHS.UK guidance recommends an urgent clinical review for these symptoms alongside high blood pressure."
  ],
  [
    "NHS.UK guidance recommends calling 111 when unsure if a substance is harmful.",
    "NHS.UK guidance recommends an urgent clinical review when unsure if a substance is harmful."
  ],

  // --- Urgent tier: "call 111 or GP" combos ---
  [
    "NHS.UK guidance lists these as reasons to call 111 or get an urgent GP appointment.",
    "NHS.UK guidance lists these as reasons for an urgent clinical review."
  ],
  [
    "NHS.UK guidance lists these as reasons to call 111 or see a GP urgently rather than manage entirely at home.",
    "NHS.UK guidance lists these as reasons for an urgent clinical review rather than managing entirely at home."
  ],
  [
    "NHS.UK guidance lists these as reasons to call 111 or see a GP for the wound.",
    "NHS.UK guidance lists these as reasons for an urgent clinical review for the wound."
  ],

  // --- Urgent tier: "GP appointment or 111" combos ---
  [
    "NHS.UK guidance flags fever/feeling unwell with back pain, and sudden severe or rapidly worsening pain, as needing a same-day GP appointment or 111 call.",
    "NHS.UK guidance flags fever/feeling unwell with back pain, and sudden severe or rapidly worsening pain, as needing a same-day urgent clinical review."
  ],
  [
    "NHS.UK sunburn guidance lists these as reasons for an urgent GP appointment or 111 call.",
    "NHS.UK sunburn guidance lists these as reasons for an urgent clinical review."
  ],
  [
    "NHS.UK guidance recommends an urgent GP appointment or 111 call for sudden hearing loss or hearing loss with other symptoms - it may need to be treated quickly.",
    "NHS.UK guidance recommends an urgent clinical review for sudden hearing loss or hearing loss with other symptoms - it may need to be treated quickly."
  ],
  [
    "Arrange an urgent GP appointment or 111 assessment - sudden hearing changes may need quick treatment.",
    "Arrange an urgent clinical review - sudden hearing changes may need quick treatment."
  ],
  [
    "NHS.UK boils guidance lists these as reasons for an urgent GP appointment or 111 call.",
    "NHS.UK boils guidance lists these as reasons for an urgent clinical review."
  ],

  // --- Routine tier: "Book/see a routine GP appointment/visit" ---
  [
    "NHS.UK guidance lists these as reasons to book a routine GP appointment rather than manage entirely at home.",
    "NHS.UK guidance lists these as reasons for a routine primary-care review rather than managing entirely at home."
  ],
  [
    "Book a routine GP appointment. Continue gentle activity and over-the-counter pain relief in the meantime.",
    "Book a routine primary-care review. Continue gentle activity and over-the-counter pain relief in the meantime."
  ],
  [
    "NHS.UK guidance recommends a GP appointment for these situations even when the bleed itself has stopped.",
    "NHS.UK guidance recommends a primary-care review for these situations even when the bleed itself has stopped."
  ],
  [
    "Book a routine GP appointment to review recurrent nosebleeds or bleeding-risk factors.",
    "Book a routine primary-care review to review recurrent nosebleeds or bleeding-risk factors."
  ],
  [
    "NHS.UK guidance: this pattern may indicate panic disorder and warrants a GP visit for assessment.",
    "NHS.UK guidance: this pattern may indicate panic disorder and warrants a primary-care review for assessment."
  ],
  [
    "Book a routine GP appointment to discuss recurring panic attacks and treatment options.",
    "Book a routine primary-care review to discuss recurring panic attacks and treatment options."
  ],
  [
    "NHS.UK guidance defines these as high blood pressure readings warranting a GP or pharmacy check and follow-up.",
    "NHS.UK guidance defines these as high blood pressure readings warranting a primary-care or pharmacy check and follow-up."
  ],
  [
    "Book a GP or pharmacy blood pressure check and follow-up. Lifestyle measures: balanced diet, 150+ minutes of exercise weekly, weight management, reduced salt and alcohol, and no smoking.",
    "Book a primary-care or pharmacy blood pressure check and follow-up. Lifestyle measures: balanced diet, 150+ minutes of exercise weekly, weight management, reduced salt and alcohol, and no smoking."
  ],
  [
    "NHS.UK guidance: see a GP if you experience symptoms of depression for most of the day, every day, for more than 2 weeks.",
    "NHS.UK guidance: arrange a primary-care review if you experience symptoms of depression for most of the day, every day, for more than 2 weeks."
  ],
  [
    "Book a routine GP or mental health service appointment for assessment and support options.",
    "Book a routine primary-care or mental health service review for assessment and support options."
  ],
  [
    "Stay connected with friends and family, maintain routine activity and sleep, and reach out to a GP if the low mood persists beyond 2 weeks.",
    "Stay connected with friends and family, maintain routine activity and sleep, and arrange a primary-care review if the low mood persists beyond 2 weeks."
  ],
  [
    "NHS.UK guidance recommends contacting a diabetes care team or GP for persistent high readings or a new, undiagnosed presentation.",
    "NHS.UK guidance recommends contacting a diabetes care team or primary-care clinician for persistent high readings or a new, undiagnosed presentation."
  ],
  [
    "NHS.UK guidance recommends a routine GP visit for gradual hearing changes or hearing that hasn't improved after prior treatment.",
    "NHS.UK guidance recommends a routine primary-care review for gradual hearing changes or hearing that hasn't improved after prior treatment."
  ],
  [
    "Book a routine GP appointment; a free hearing test may also be available at some pharmacies and opticians.",
    "Book a routine primary-care review; a hearing test may also be available at some pharmacies and opticians."
  ],
  [
    "NHS.UK guidance recommends seeing a GP when self-help sleep changes have not helped, symptoms have lasted months, or daily functioning is impaired.",
    "NHS.UK guidance recommends a primary-care review when self-help sleep changes have not helped, symptoms have lasted months, or daily functioning is impaired."
  ],
  [
    "Book a routine GP appointment to discuss persistent sleep difficulty.",
    "Book a routine primary-care review to discuss persistent sleep difficulty."
  ],
  [
    "NHS.UK guidance recommends a GP visit for unexplained, persistent, or functionally-impairing tiredness, or tiredness with these associated symptoms.",
    "NHS.UK guidance recommends a primary-care review for unexplained, persistent, or functionally-impairing tiredness, or tiredness with these associated symptoms."
  ],
  [
    "Book a routine GP appointment to investigate persistent or unexplained tiredness.",
    "Book a routine primary-care review to investigate persistent or unexplained tiredness."
  ],
  [
    "NHS.UK guidance recommends a routine GP visit for gradual forgetfulness/confusion, which may indicate dementia rather than an acute cause.",
    "NHS.UK guidance recommends a routine primary-care review for gradual forgetfulness/confusion, which may indicate dementia rather than an acute cause."
  ],
  [
    "Book a routine GP appointment to assess gradual forgetfulness or confusion.",
    "Book a routine primary-care review to assess gradual forgetfulness or confusion."
  ],
  [
    "NHS.UK guidance: see a GP if you're worried about your hair loss, to identify the cause before considering commercial hair clinic options.",
    "NHS.UK guidance: arrange a primary-care review if you're worried about your hair loss, to identify the cause before considering commercial hair clinic options."
  ],
  [
    "Book a routine GP appointment to discuss the cause of hair loss and available treatment options. Losing 50-100 hairs a day is normal.",
    "Book a routine primary-care review to discuss the cause of hair loss and available treatment options. Losing 50-100 hairs a day is normal."
  ],
  [
    "NHS.UK guidance: see a GP immediately if experiencing symptoms of psychosis, since early treatment can be more effective.",
    "NHS.UK guidance: arrange an urgent clinical review immediately if experiencing symptoms of psychosis, since early treatment can be more effective."
  ],
  [
    "NHS.UK guidance lists these as reasons to see a GP about tics.",
    "NHS.UK guidance lists these as reasons for a primary-care review about tics."
  ],
  [
    "NHS.UK guidance: tics are not usually serious and don't damage the brain; mild tics without problems may not need GP evaluation.",
    "NHS.UK guidance: tics are not usually serious and don't damage the brain; mild tics without problems may not need a primary-care review."
  ],
  [
    "Book a routine GP appointment to discuss the tics and their impact.",
    "Book a routine primary-care review to discuss the tics and their impact."
  ],
  [
    "Mild tics are common and usually not serious. Continue to monitor and see a GP if they become more frequent, severe, or start causing problems.",
    "Mild tics are common and usually not serious. Continue to monitor and arrange a primary-care review if they become more frequent, severe, or start causing problems."
  ],
  [
    "NHS.UK guidance: see a GP if iron deficiency anemia is suspected - pale skin, tiredness, shortness of breath, and palpitations are common symptoms.",
    "NHS.UK guidance: arrange a primary-care review if iron deficiency anemia is suspected - pale skin, tiredness, shortness of breath, and palpitations are common symptoms."
  ],
  [
    "Book a routine GP appointment to check for iron deficiency anemia with a blood test.",
    "Book a routine primary-care review to check for iron deficiency anemia with a blood test."
  ],
  [
    "NHS.UK guidance: see a GP as soon as possible if there is weight loss and other symptoms - the earlier the cause is found, the sooner it can be treated; weight loss without trying should always be checked.",
    "NHS.UK guidance: arrange a prompt primary-care review if there is weight loss and other symptoms - the earlier the cause is found, the sooner it can be treated; weight loss without trying should always be checked."
  ],
  [
    "Book a prompt GP appointment to investigate the cause of unexplained weight loss.",
    "Book a prompt primary-care review to investigate the cause of unexplained weight loss."
  ],
  [
    "NHS.UK guidance recommends a routine GP visit for a persistent boil, recurring boils, or a carbuncle.",
    "NHS.UK guidance recommends a routine primary-care review for a persistent boil, recurring boils, or a carbuncle."
  ],
  [
    "Book a routine GP appointment for a persistent, recurring, or clustered boil.",
    "Book a routine primary-care review for a persistent, recurring, or clustered boil."
  ],
  [
    "NHS.UK guidance recommends a GP visit for persistent or recurrent ear infections.",
    "NHS.UK guidance recommends a primary-care review for persistent or recurrent ear infections."
  ],
  [
    "Book a GP appointment for persistent or recurring ear infections.",
    "Book a primary-care review for persistent or recurring ear infections."
  ],
  [
    "NHS.UK guidance recommends a routine GP visit for recurring earaches.",
    "NHS.UK guidance recommends a routine primary-care review for recurring earaches."
  ],
  [
    "Book a routine GP appointment for recurring earaches.",
    "Book a routine primary-care review for recurring earaches."
  ],

  // --- Pharmacist/GP combos ---
  [
    "NHS.UK guidance flags these infection or tick-bite signs as needing a pharmacist or GP review.",
    "NHS.UK guidance flags these infection or tick-bite signs as needing pharmacist advice or a primary-care review."
  ],
  [
    "NHS.UK guidance flags these infection signs as needing a pharmacist or GP review.",
    "NHS.UK guidance flags these infection signs as needing pharmacist advice or a primary-care review."
  ],
  [
    "NHS.UK guidance: a pharmacist can give the same medicines as a GP for straightforward impetigo.",
    "NHS.UK guidance: a pharmacist can give the same medicines a primary-care clinician would for straightforward impetigo."
  ],
  [
    "A pharmacist can provide the same medicines as a GP. Wash affected areas with soap and water, wash hands frequently (especially before/after applying cream), and wash bedding/towels at high temperature. Do not touch or scratch sores. Stay away from work, school, or nursery until no longer contagious (48 hours after starting treatment, or once patches dry and crust over without treatment). Don't share towels or prepare food for others.",
    "A pharmacist can provide the same medicines a primary-care clinician would. Wash affected areas with soap and water, wash hands frequently (especially before/after applying cream), and wash bedding/towels at high temperature. Do not touch or scratch sores. Stay away from work, school, or nursery until no longer contagious (48 hours after starting treatment, or once patches dry and crust over without treatment). Don't share towels or prepare food for others."
  ],
  [
    "NHS.UK guidance lists these as reasons for a primary-care review rather than pharmacist self-care. Impetigo is very infectious - check with the GP surgery before attending in person.",
    "NHS.UK guidance lists these as reasons for a primary-care review rather than pharmacist self-care. Impetigo is very infectious - check with the clinic before attending in person."
  ],

  // --- Already half-fixed "Qatar urgent clinical review pathway" garbled text (batch-06, batch-07) ---
  [
    "NHS.UK guidance: seek an urgent GP appointment or the Qatar urgent clinical review pathway for diarrhea associated with antibiotic use - possible C. difficile infection. Do not use antidiarrheal medication like loperamide, as it can prevent proper infection clearance.",
    "NHS.UK guidance: seek an urgent clinical review for diarrhea associated with antibiotic use - possible C. difficile infection. Do not use antidiarrheal medication like loperamide, as it can prevent proper infection clearance."
  ],
  [
    'NHS.UK earache guidance lists "something stuck in the ear" as one of its urgent GP/the Qatar urgent clinical review pathway criteria.',
    'NHS.UK earache guidance lists "something stuck in the ear" as one of its urgent clinical review criteria.'
  ],
  [
    'NHS.UK earache guidance lists \\"something stuck in the ear\\" as one of its urgent GP/the Qatar urgent clinical review pathway criteria.',
    'NHS.UK earache guidance lists \\"something stuck in the ear\\" as one of its urgent clinical review criteria.'
  ],
  [
    "NHS.UK ear infection guidance lists these as urgent the Qatar urgent clinical review pathway/GP criteria.",
    "NHS.UK ear infection guidance lists these as urgent clinical review criteria."
  ],
  [
    "NHS.UK earache guidance lists these as reasons for an urgent GP appointment or the Qatar urgent clinical review pathway call.",
    "NHS.UK earache guidance lists these as reasons for an urgent clinical review."
  ],
  [
    "NHS.UK guidance: contact a GP or the Qatar urgent clinical review pathway right away for severe pain, fever, or blood in the urine.",
    "NHS.UK guidance: arrange an urgent clinical review right away for severe pain, fever, or blood in the urine."
  ]
];

export { REPLACEMENTS };

function main() {
  let filesChanged = 0;
  let totalReplacements = 0;
  const unmatched = [];

  for (const dir of DIRS) {
    const fullDir = path.join(CATALOG_ROOT, dir);
    for (const file of readdirSync(fullDir).filter((n) => n.endsWith(".db.json"))) {
      const filePath = path.join(fullDir, file);
      let text = readFileSync(filePath, "utf8");
      let fileChanged = false;
      for (const [oldStr, newStr] of REPLACEMENTS) {
        if (text.includes(oldStr)) {
          text = text.split(oldStr).join(newStr);
          fileChanged = true;
          totalReplacements++;
        }
      }
      if (fileChanged) {
        writeFileSync(filePath, text, "utf8");
        filesChanged++;
      }
    }
  }

  console.log(`Files changed: ${filesChanged}`);
  console.log(`Total replacements applied: ${totalReplacements}`);
}

if (process.argv[1] && process.argv[1].endsWith("fixUkWordingCatalog.mjs")) {
  main();
}
