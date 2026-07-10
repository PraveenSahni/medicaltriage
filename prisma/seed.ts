import {
  AcuityDispositionCode,
  BiologicalSex,
  ClinicalContentSourceType,
  DependentRelationship,
  DutyStatus,
  PrismaClient,
  ProtocolMode,
  TriageSeverity
} from "@prisma/client";

const prisma = new PrismaClient();

const releaseId = "phase1-open-source-qatar-release";
const algorithmId = "alg-acute-chest-pain-adult";

const questions = [
  {
    id: "q-chest-pain-adult-001",
    acuityOrder: 1,
    severityGrade: TriageSeverity.EMERGENCY,
    questionTextEn: "Is the chest pain severe, crushing, or radiating to the left arm or jaw?",
    questionTextAr: "هل ألم الصدر شديد أو ضاغط أو يمتد إلى الذراع اليسرى أو الفك؟",
    acuityDispositionCode: AcuityDispositionCode.HMC_EMERGENCY_DEPARTMENT,
    rationaleEn:
      "Crushing or radiating chest pain can indicate acute coronary syndrome and must be routed to emergency care."
  },
  {
    id: "q-chest-pain-adult-002",
    acuityOrder: 2,
    severityGrade: TriageSeverity.URGENT,
    questionTextEn: "Is the chest pain moderate, and does it worsen when taking a deep breath?",
    questionTextAr: "هل ألم الصدر متوسط الشدة ويزداد عند أخذ نفس عميق؟",
    acuityDispositionCode: AcuityDispositionCode.PHCC_URGENT_CARE_OR_TELECONSULT,
    rationaleEn:
      "Pleuritic or persistent moderate chest pain needs urgent clinician review even when no emergency floor is present."
  },
  {
    id: "q-chest-pain-adult-003",
    acuityOrder: 3,
    severityGrade: TriageSeverity.ROUTINE,
    questionTextEn: "Is the chest pain mild, localized, and only felt when pressing on the chest wall?",
    questionTextAr: "هل ألم الصدر خفيف ومحدد ويظهر فقط عند الضغط على جدار الصدر؟",
    acuityDispositionCode: AcuityDispositionCode.IST_HIA_MIDFIELD_MEDICAL_CENTRE,
    rationaleEn:
      "Localized reproducible chest-wall pain can be reviewed through the IST clinical pathway after red flags are excluded."
  }
];

const careAdvice = [
  {
    id: "advice-chest-emergency",
    externalCareAdviceId: "PHASE1-CHEST-EMERGENCY",
    adviceTitleEn: "Emergency chest pain escalation",
    adviceTitleAr: "تصعيد طارئ لألم الصدر",
    instructionTextEn:
      "Stop activity, remain seated, do not drive, and arrange immediate emergency transfer through the approved Qatar pathway.",
    instructionTextAr:
      "أوقف النشاط، ابق جالساً، لا تقُد السيارة، ورتب نقلاً فورياً للطوارئ عبر المسار المعتمد في قطر.",
    dispositionCode: AcuityDispositionCode.HMC_EMERGENCY_DEPARTMENT
  },
  {
    id: "advice-chest-urgent",
    externalCareAdviceId: "PHASE1-CHEST-URGENT",
    adviceTitleEn: "Urgent chest pain review",
    adviceTitleAr: "مراجعة عاجلة لألم الصدر",
    instructionTextEn:
      "Book urgent same-day clinical review. Escalate immediately if breathing difficulty, sweating, fainting, or worsening pain occurs.",
    instructionTextAr:
      "احجز مراجعة سريرية عاجلة في نفس اليوم. صعّد فوراً عند حدوث ضيق تنفس أو تعرق أو إغماء أو زيادة الألم.",
    dispositionCode: AcuityDispositionCode.PHCC_URGENT_CARE_OR_TELECONSULT
  },
  {
    id: "advice-chest-routine",
    externalCareAdviceId: "PHASE1-CHEST-ROUTINE",
    adviceTitleEn: "Routine chest-wall pain advice",
    adviceTitleAr: "إرشادات ألم جدار الصدر الروتيني",
    instructionTextEn:
      "Offer IST clinic review, avoid flight duty until cleared if symptoms affect work safety, and provide callback precautions.",
    instructionTextAr:
      "وفر مراجعة في عيادة IST، وتجنب واجبات الطيران حتى التصريح الطبي إذا كانت الأعراض تؤثر على سلامة العمل، مع تعليمات معاودة الاتصال.",
    dispositionCode: AcuityDispositionCode.IST_HIA_MIDFIELD_MEDICAL_CENTRE
  }
];

const localizedDispositions = [
  {
    code: AcuityDispositionCode.HMC_EMERGENCY_DEPARTMENT,
    destinationNameEn: "Hamad Medical Corporation (HMC) Emergency Department",
    destinationNameAr: "قسم الطوارئ في مؤسسة حمد الطبية",
    routingNotesEn: "Adult or general emergency pathway for mandatory RED safety-floor cases.",
    routingNotesAr: "مسار الطوارئ للبالغين أو الحالات العامة عند تفعيل حد السلامة الأحمر."
  },
  {
    code: AcuityDispositionCode.SIDRA_PEDIATRIC_ED,
    destinationNameEn: "Sidra Medicine Emergency Department",
    destinationNameAr: "قسم الطوارئ في سدرة للطب",
    routingNotesEn: "Pediatric emergency pathway for patients under 18 years.",
    routingNotesAr: "مسار طوارئ الأطفال للمرضى دون 18 سنة."
  },
  {
    code: AcuityDispositionCode.PHCC_URGENT_CARE_OR_TELECONSULT,
    destinationNameEn: "PHCC urgent care or IST teleconsult",
    destinationNameAr: "الرعاية العاجلة في مؤسسة الرعاية الصحية الأولية أو استشارة IST عن بعد",
    routingNotesEn: "Urgent but non-emergency pathway with clinician review.",
    routingNotesAr: "مسار عاجل غير طارئ مع مراجعة سريرية."
  },
  {
    code: AcuityDispositionCode.IST_HIA_MIDFIELD_MEDICAL_CENTRE,
    destinationNameEn: "IST Medical Centre, HIA Midfield",
    destinationNameAr: "مركز IST الطبي في مبنى المطار الأوسط",
    routingNotesEn: "Aviation medicine, fit-to-fly, sickness validation, and staff clinic pathway.",
    routingNotesAr: "مسار طب الطيران وتقييم اللياقة للطيران والتحقق من الإجازة المرضية وعيادة الموظفين."
  },
  {
    code: AcuityDispositionCode.IST_OLD_AIRPORT_MEDICAL_COMMISSION,
    destinationNameEn: "IST Old Airport Road Medical Commission",
    destinationNameAr: "اللجنة الطبية IST في طريق المطار القديم",
    routingNotesEn: "Occupational clearance, vaccination review, and medical commission pathway.",
    routingNotesAr: "مسار التصاريح المهنية ومراجعة التطعيمات واللجنة الطبية."
  },
  {
    code: AcuityDispositionCode.SELF_CARE_WITH_CALLBACK_PRECAUTIONS,
    destinationNameEn: "Self-care with callback precautions",
    destinationNameAr: "رعاية ذاتية مع تعليمات معاودة الاتصال",
    routingNotesEn: "Low-risk pathway after emergency and urgent triggers are excluded.",
    routingNotesAr: "مسار منخفض الخطورة بعد استبعاد مؤشرات الطوارئ والعجلة."
  }
];

async function seedClinicalContent() {
  await prisma.protocolRelease.upsert({
    where: {
      sourceType_version: {
        sourceType: ClinicalContentSourceType.SYNTHETIC_SAMPLE,
        version: "phase1-qatar-open-source-2026.07"
      }
    },
    create: {
      id: releaseId,
      name: "IST Qatar Phase I Open-Source Safety Floor",
      version: "phase1-qatar-open-source-2026.07",
      sourceType: ClinicalContentSourceType.SYNTHETIC_SAMPLE,
      region: "QA",
      mode: ProtocolMode.BOTH,
      active: true,
      importedAt: new Date()
    },
    update: {
      name: "IST Qatar Phase I Open-Source Safety Floor",
      active: true,
      importedAt: new Date()
    }
  });

  await prisma.algorithm.upsert({
    where: { externalProtocolId: "PHASE1-ACUTE-CHEST-PAIN-ADULT" },
    create: {
      id: algorithmId,
      releaseId,
      externalProtocolId: "PHASE1-ACUTE-CHEST-PAIN-ADULT",
      titleEn: "Acute Chest Pain - Adult",
      titleAr: "ألم الصدر الحاد - البالغون",
      clinicalDefinitionEn:
        "Rules-first adult chest pain triage protocol used to rule out life-threatening symptoms before urgent or routine advice.",
      clinicalDefinitionAr:
        "بروتوكول فرز ألم الصدر للبالغين المعتمد على القواعد لاستبعاد الأعراض المهددة للحياة قبل الإرشادات العاجلة أو الروتينية.",
      backgroundInfoEn:
        "Phase I sample content based on open-source safety-floor logic and prepared for later licensed clinical protocol import.",
      backgroundInfoAr:
        "محتوى عينة للمرحلة الأولى قائم على منطق حدود السلامة مفتوح المصدر ومهيأ لاستيراد بروتوكولات سريرية مرخصة لاحقاً.",
      ageMin: 18,
      mode: ProtocolMode.BOTH,
      active: true
    },
    update: {
      releaseId,
      titleEn: "Acute Chest Pain - Adult",
      titleAr: "ألم الصدر الحاد - البالغون",
      active: true
    }
  });

  for (const item of questions) {
    await prisma.triageQuestion.upsert({
      where: { id: item.id },
      create: {
        ...item,
        algorithmId,
        redFlag: item.severityGrade === TriageSeverity.EMERGENCY
      },
      update: {
        ...item,
        algorithmId,
        redFlag: item.severityGrade === TriageSeverity.EMERGENCY
      }
    });
  }

  for (const item of careAdvice) {
    await prisma.careAdvice.upsert({
      where: { externalCareAdviceId: item.externalCareAdviceId },
      create: item,
      update: item
    });

    await prisma.algorithmCareAdvice.upsert({
      where: {
        algorithmId_careAdviceId: {
          algorithmId,
          careAdviceId: item.id
        }
      },
      create: {
        algorithmId,
        careAdviceId: item.id
      },
      update: {}
    });
  }

  for (const [index, question] of questions.entries()) {
    const advice = careAdvice[index];
    await prisma.questionAdviceBridge.upsert({
      where: {
        questionId_adviceId_triggerAnswer: {
          questionId: question.id,
          adviceId: advice.id,
          triggerAnswer: "YES"
        }
      },
      create: {
        questionId: question.id,
        adviceId: advice.id,
        triggerAnswer: "YES"
      },
      update: {}
    });
  }

  for (const item of localizedDispositions) {
    await prisma.localizedDisposition.upsert({
      where: { code: item.code },
      create: item,
      update: item
    });
  }
}

async function seedStaffDirectory() {
  const staff = [
    {
      id: "staff_ist_1001",
      istStaffId: "IST-1001",
      department: "Flight Operations",
      jobTitle: "Pilot",
      dutyStatus: DutyStatus.ACTIVE,
      insuranceProvider: "IST Staff Health Plan",
      insuranceEligibilityStatus: "ELIGIBLE" as const,
      dependent: {
        id: "dep_ist_1001_child_01",
        fullName: "Dependent of IST-1001",
        relationshipType: DependentRelationship.CHILD,
        age: 6,
        biologicalSex: BiologicalSex.FEMALE
      }
    },
    {
      id: "staff_ist_2002",
      istStaffId: "IST-2002",
      department: "Cabin Services",
      jobTitle: "Cabin Crew",
      dutyStatus: DutyStatus.ACTIVE,
      insuranceProvider: "IST Staff Health Plan",
      insuranceEligibilityStatus: "ELIGIBLE" as const
    },
    {
      id: "staff_ist_3003",
      istStaffId: "IST-3003",
      department: "Airport Operations",
      jobTitle: "Operations Specialist",
      dutyStatus: DutyStatus.ACTIVE,
      insuranceProvider: "IST Staff Health Plan",
      insuranceEligibilityStatus: "ELIGIBLE" as const
    }
  ];

  for (const item of staff) {
    await prisma.staffMember.upsert({
      where: { istStaffId: item.istStaffId },
      create: {
        id: item.id,
        istStaffId: item.istStaffId,
        department: item.department,
        jobTitle: item.jobTitle,
        dutyStatus: item.dutyStatus,
        insuranceProvider: item.insuranceProvider,
        insuranceEligibilityStatus: item.insuranceEligibilityStatus,
        insuranceLastChecked: new Date("2026-07-01T08:00:00.000Z")
      },
      update: {
        department: item.department,
        jobTitle: item.jobTitle,
        dutyStatus: item.dutyStatus,
        insuranceProvider: item.insuranceProvider,
        insuranceEligibilityStatus: item.insuranceEligibilityStatus,
        insuranceLastChecked: new Date("2026-07-01T08:00:00.000Z")
      }
    });

    if (item.dependent) {
      await prisma.dependent.upsert({
        where: { id: item.dependent.id },
        create: {
          ...item.dependent,
          staffMemberId: item.id
        },
        update: {
          ...item.dependent,
          staffMemberId: item.id
        }
      });
    }
  }
}

async function main() {
  await seedClinicalContent();
  await seedStaffDirectory();

  const [algorithmCount, questionCount, adviceCount, staffCount] = await Promise.all([
    prisma.algorithm.count(),
    prisma.triageQuestion.count(),
    prisma.careAdvice.count(),
    prisma.staffMember.count()
  ]);

  console.log(
    JSON.stringify(
      {
        seed: "complete",
        algorithmCount,
        questionCount,
        adviceCount,
        staffCount
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Phase I seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
