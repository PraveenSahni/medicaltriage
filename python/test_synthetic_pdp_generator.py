import unittest

from generate_synthetic_pdp_data import generate_dataset


class SyntheticPdpGeneratorTests(unittest.TestCase):
    def test_generates_scaled_workforce_and_exact_encounter_mix(self) -> None:
        dataset = generate_dataset(aircraft_count=10, encounter_count=100, seed=42)
        stats = dataset["statistics"]

        self.assertEqual(stats["staff_count"], 1000)
        self.assertEqual(stats["dependent_count"], 810)
        self.assertEqual(stats["encounter_count"], 100)
        self.assertEqual(stats["audit_log_count"], 5)
        self.assertEqual(stats["staff_by_department"]["Flight Operations"], 170)
        self.assertEqual(stats["staff_by_department"]["Inflight Services"], 200)
        self.assertEqual(dataset["oracle_fusion_hcm_api"]["collections"]["publicWorkers"]["count"], 1000)
        self.assertEqual(dataset["oracle_fusion_hcm_api"]["collections"]["workers"]["count"], 1000)
        self.assertEqual(dataset["oracle_fusion_hcm_api"]["collections"]["assignments"]["count"], 1000)
        self.assertEqual(dataset["oracle_fusion_hcm_api"]["collections"]["hcmContacts"]["count"], 810)
        self.assertEqual(dataset["oracle_fusion_hcm_api"]["collections"]["contactRelationships"]["count"], 810)
        self.assertEqual(stats["encounters_by_profile"]["HIGH_ACUITY_CARDIAC_EMERGENCY"], 12)
        self.assertEqual(stats["encounters_by_profile"]["PEDIATRIC_RESPIRATORY_DISTRESS"], 15)
        self.assertEqual(stats["encounters_by_profile"]["CABIN_CREW_BACK_PAIN"], 28)
        self.assertEqual(stats["encounters_by_profile"]["PILOT_EAR_BAROTRAUMA"], 20)
        self.assertEqual(stats["encounters_by_profile"]["MANDATED_IMMUNIZATION_FEVER"], 25)

    def test_records_follow_prisma_seed_shapes(self) -> None:
        dataset = generate_dataset(aircraft_count=10, encounter_count=20, seed=7)
        staff = dataset["staff_members"][0]
        dependent = dataset["dependents"][0]
        encounter = dataset["aviation_triage_encounters"][0]
        audit = dataset["safety_audit_deviation_logs"][0]
        oracle = dataset["oracle_fusion_hcm_api"]
        public_worker = oracle["collections"]["publicWorkers"]["items"][0]
        assignment = oracle["collections"]["assignments"]["items"][0]

        self.assertTrue(staff["ist_staff_id"].startswith("IST-"))
        self.assertIn(staff["duty_status"], {"ACTIVE", "ON_LEAVE", "REST_PERIOD"})
        self.assertIn(staff["insurance_eligibility_status"], {"ELIGIBLE", "SUSPENDED"})
        self.assertEqual(public_worker["PersonNumber"], "IST-00001")
        self.assertIn("AssignmentStatusType", assignment)
        self.assertIn("publicWorkers", public_worker["links"][0]["href"])
        self.assertIn("Oracle Fusion HCM", oracle["adapter_contract"])
        self.assertIn(dependent["relationship"], {"SPOUSE", "SON", "DAUGHTER"})
        self.assertIn("semantic_match", encounter["custom_aviation_tags"])
        self.assertTrue(encounter["clipboard_payload"]["synthetic"])
        self.assertEqual(audit["encounter_id"], audit["encounter_id"])
        self.assertTrue(audit["explainability_trace"]["rules_first_ai_second"])

    def test_full_prompt_scale_math_for_260_aircraft(self) -> None:
        dataset = generate_dataset(aircraft_count=260, encounter_count=100, seed=99)
        stats = dataset["statistics"]
        workforce = dataset["metadata"]["workforce_math"]

        self.assertEqual(stats["staff_count"], 26000)
        self.assertEqual(workforce["pilots"], 4300)
        self.assertEqual(workforce["captains"], 2150)
        self.assertEqual(workforce["first_officers"], 2150)
        self.assertEqual(workforce["cabin_crew_total"], 5200)
        self.assertEqual(workforce["cabin_supervisors"], 780)
        self.assertEqual(workforce["cabin_crew"], 4420)
        self.assertEqual(workforce["engineering"], 4950)
        self.assertEqual(workforce["ground_operations"], 6600)
        self.assertEqual(workforce["administration"], 4950)


if __name__ == "__main__":
    unittest.main()
