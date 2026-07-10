from __future__ import annotations

import sqlite3
import tempfile
import unittest
from pathlib import Path

from safety_wrapper import evaluate_ai_recommendation


class SafetyWrapperTests(unittest.TestCase):
    def test_normal_vitals_homecare_passes_without_override(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "safety_audit.db"

            result = evaluate_ai_recommendation(
                {
                    "heart_rate": 72,
                    "respiratory_rate": 16,
                    "spo2": 98,
                    "temperature": 37.0,
                    "conscious_level": "alert",
                },
                "HOMECARE",
                audit_db_path=db_path,
            )

            self.assertTrue(db_path.exists())
            self.assertFalse(result["override_triggered"])
            self.assertEqual(result["final_disposition"], "HOMECARE")
            self.assertEqual(result["final_severity"], "HOMECARE")

    def test_red_vitals_block_llm_downgrade_and_write_audit_row(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "safety_audit.db"

            result = evaluate_ai_recommendation(
                {
                    "heart_rate": 145,
                    "respiratory_rate": 18,
                    "spo2": 97,
                    "temperature": 37.0,
                    "conscious_level": "alert",
                },
                "ROUTINE",
                audit_db_path=db_path,
            )

            self.assertTrue(result["override_triggered"])
            self.assertEqual(result["final_disposition"], "RED_ALERT")
            self.assertEqual(result["final_severity"], "EMERGENCY")
            self.assertIn("Mandatory escalation", result["rationale"])

            conn = sqlite3.connect(db_path)
            try:
                row = conn.execute(
                    """
                    SELECT
                        override_triggered,
                        ai_suggested_disposition,
                        final_disposition,
                        final_severity,
                        rationale,
                        red_floor_reasons_json
                    FROM ai_recommendation_safety_audit
                    ORDER BY created_at DESC
                    LIMIT 1
                    """
                ).fetchone()
            finally:
                conn.close()

            self.assertIsNotNone(row)
            self.assertEqual(row[0], 1)
            self.assertEqual(row[1], "ROUTINE")
            self.assertEqual(row[2], "RED_ALERT")
            self.assertEqual(row[3], "EMERGENCY")
            self.assertIn("Clinical safety floor rule violated", row[4])
            self.assertIn("Heart rate", row[5])

    def test_homecare_downgrade_is_also_blocked_for_red_vitals(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            result = evaluate_ai_recommendation(
                {
                    "heart_rate": 145,
                    "respiratory_rate": 18,
                    "spo2": 97,
                    "temperature": 37.0,
                    "conscious_level": "alert",
                },
                "HOMECARE",
                audit_db_path=Path(temp_dir) / "safety_audit.db",
            )

            self.assertTrue(result["override_triggered"])
            self.assertEqual(result["final_severity"], "EMERGENCY")


if __name__ == "__main__":
    unittest.main(verbosity=2)
