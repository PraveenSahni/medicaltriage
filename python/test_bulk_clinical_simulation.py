import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from run_bulk_clinical_simulation import BulkClinicalSimulationRunner, BulkRunConfig


class BulkClinicalSimulationTests(unittest.TestCase):
    def _generated_file_bytes(self, output_dir: str) -> dict[str, bytes]:
        root = Path(output_dir)
        return {
            str(path.relative_to(root)): path.read_bytes()
            for path in sorted(root.rglob("*"))
            if path.is_file()
        }

    def test_bulk_runner_streams_partitioned_rows_and_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            config = BulkRunConfig(
                record_count=100,
                start_date=datetime(2024, 1, 1, tzinfo=timezone.utc),
                end_date=datetime(2024, 1, 31, 23, 59, 59, tzinfo=timezone.utc),
                output_dir=tmpdir,
                aircraft_count=10,
                seed=2024,
                audit_rate=0.10,
                write_training_output=True,
            )
            manifest = BulkClinicalSimulationRunner(config).run()

            self.assertEqual(manifest["record_count"], 100)
            self.assertEqual(sum(item["rows"] for item in manifest["encounter_partitions"]), 100)
            self.assertIn("PEDIATRIC_FEVER_DEHYDRATION", manifest["counts"]["by_profile"])
            self.assertIn("FEMALE_HEALTH_URINARY", manifest["counts"]["by_profile"])
            self.assertIn("MALE_GENITOURINARY_URGENT", manifest["counts"]["by_profile"])
            self.assertGreater(manifest["audit_record_count"], 0)
            self.assertEqual(sum(item["rows"] for item in manifest["training_partitions"]), 100)
            self.assertTrue(Path(manifest["manifest_path"]).exists())
            self.assertEqual(len(manifest["samples"]), 3)

            first_partition = Path(manifest["encounter_partitions"][0]["path"])
            first_row = json.loads(first_partition.read_text(encoding="utf-8").splitlines()[0])
            self.assertTrue(first_row["synthetic"])
            self.assertIn("fhir_writeback", first_row)
            self.assertIn("patient_context", first_row)
            self.assertIn("regional_context", first_row)
            self.assertIn("heat_risk", first_row["regional_context"]["climate"])
            self.assertIn("demographic_priors", first_row["regional_context"]["health"])
            self.assertEqual(first_row["fhir_writeback"]["bundle_type"], "transaction")

            first_training = Path(manifest["training_partitions"][0]["path"])
            training_row = json.loads(first_training.read_text(encoding="utf-8").splitlines()[0])
            self.assertEqual(training_row["purpose"], "llm-evaluation-and-governed-copilot-training")
            self.assertEqual(len(training_row["messages"]), 3)
            self.assertIn("patient_context", training_row["messages"][1]["content"])
            self.assertIn("regional_context", training_row["messages"][1]["content"])
            self.assertTrue(training_row["expected_output"]["regional_context_used_for_explanation_only"])

    def test_same_seed_regenerates_byte_identical_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            config = BulkRunConfig(
                record_count=100,
                start_date=datetime(2024, 1, 1, tzinfo=timezone.utc),
                end_date=datetime(2024, 1, 31, 23, 59, 59, tzinfo=timezone.utc),
                output_dir=tmpdir,
                aircraft_count=10,
                seed=777,
                audit_rate=0.10,
                write_training_output=True,
            )

            BulkClinicalSimulationRunner(config).run()
            first_run = self._generated_file_bytes(tmpdir)

            BulkClinicalSimulationRunner(config).run()
            second_run = self._generated_file_bytes(tmpdir)

            self.assertEqual(first_run, second_run)


if __name__ == "__main__":
    unittest.main()
