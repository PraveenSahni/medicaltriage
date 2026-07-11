import json
import unittest

from simulation_engine import SCENARIOS, emit_jsonl, run_simulation, run_suite


class SimulationEngineTests(unittest.TestCase):
    def test_emergency_safety_floor_is_deterministic(self):
        result = run_simulation(SCENARIOS[0])

        self.assertTrue(result["expected_output"]["safety_floor_triggered"])
        self.assertEqual(result["expected_output"]["severity"], "EMERGENCY")
        self.assertEqual(
            result["expected_output"]["target_routing_endpoint"],
            "HAMAD_MEDICAL_CORPORATION_ADULT_EMERGENCY",
        )

    def test_pediatric_tachypnea_routes_to_sidra(self):
        result = run_simulation(SCENARIOS[1])

        self.assertEqual(result["expected_output"]["severity"], "EMERGENCY")
        self.assertEqual(
            result["expected_output"]["target_routing_endpoint"],
            "SIDRA_MEDICINE_PEDIATRIC_EMERGENCY",
        )

    def test_jsonl_rows_are_marked_synthetic(self):
        lines = emit_jsonl(run_suite()).splitlines()
        parsed = [json.loads(line) for line in lines]

        self.assertGreaterEqual(len(parsed), 4)
        self.assertTrue(all(row["synthetic"] for row in parsed))
        self.assertEqual(parsed[0]["purpose"], "llm-evaluation-and-training")


if __name__ == "__main__":
    unittest.main()
