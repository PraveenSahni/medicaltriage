import unittest

from clinical_simulation_engine import (
    EmployeeSimulator,
    EMRWritebackEngine,
    TriageNurseSimulator,
    VectorKnowledgeEngine,
    build_demo_cases,
    run_end_to_end_suite,
)


class ClinicalSimulationEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.employees = EmployeeSimulator(aircraft_count=10, encounter_count=100, seed=2026)
        cls.knowledge = VectorKnowledgeEngine()
        cls.triage = TriageNurseSimulator(cls.employees, cls.knowledge)

    def test_cosine_similarity_and_unknown_fallback(self) -> None:
        same = self.knowledge.cosine_similarity([1, 0, 0, 0, 0], [1, 0, 0, 0, 0])
        self.assertAlmostEqual(same, 1.0)

        unknown = self.knowledge.match([0, 0, 0, 0, 0])
        self.assertEqual(unknown["codebook_node"], "UNKNOWN_SYMPTOM")
        self.assertFalse(unknown["accepted"])

    def test_case_a_emergency_routes_to_hmc_and_blocks_ai_downgrade(self) -> None:
        case = build_demo_cases(self.employees)[0]
        result = self.triage.run_case(case)

        self.assertEqual(result["severity"], "EMERGENCY")
        self.assertEqual(result["route"], "Hamad Medical Corporation Adult ED")
        self.assertEqual(result["fit_to_fly_status"], "RESTRICTED")
        self.assertTrue(result["safety_floor"]["override_triggered"])
        self.assertTrue(result["ai_downgrade_blocked"])

    def test_case_b_pediatric_tachypnea_routes_to_sidra(self) -> None:
        case = build_demo_cases(self.employees)[1]
        result = self.triage.run_case(case)

        self.assertEqual(result["severity"], "EMERGENCY")
        self.assertEqual(result["route"], "Sidra Medicine Pediatric ED")
        self.assertTrue(result["safety_floor"]["override_triggered"])

    def test_case_c_stable_cabin_crew_routes_to_ist_and_restricts_flying(self) -> None:
        case = build_demo_cases(self.employees)[2]
        result = self.triage.run_case(case)

        self.assertEqual(result["severity"], "ROUTINE")
        self.assertEqual(result["route"], "IST Medical Centre (HIA Midfield Area)")
        self.assertEqual(result["fit_to_fly_status"], "RESTRICTED")

    def test_emr_writeback_builds_fhir_transaction_and_audit_log(self) -> None:
        case = build_demo_cases(self.employees)[0]
        result = self.triage.run_case(case)
        writeback = EMRWritebackEngine().commit(result)

        self.assertEqual(writeback["fhir_transaction"]["resourceType"], "Bundle")
        self.assertEqual(writeback["fhir_transaction"]["type"], "transaction")
        self.assertGreaterEqual(len(writeback["fhir_transaction"]["entry"]), 6)
        self.assertIn("safety_audit_deviation_log", writeback)
        self.assertIn("SBAR", writeback["sbar_markdown"])

    def test_end_to_end_suite_runs_three_prompt_cases(self) -> None:
        suite = run_end_to_end_suite(aircraft_count=10, encounter_count=100, seed=2026)

        self.assertTrue(suite["synthetic"])
        self.assertEqual(suite["employee_source"], "oracle_fusion_hcm_api")
        self.assertEqual(len(suite["cases"]), 3)
        self.assertGreaterEqual(suite["audit_log_count"], 1)


if __name__ == "__main__":
    unittest.main()
