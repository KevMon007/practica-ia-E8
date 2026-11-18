from pathlib import Path
from tempfile import TemporaryDirectory
import json
import subprocess
import sys
import unittest

import pandas as pd

from ml.ticket_classifier import TicketClassifier


class TicketClassifierTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = TemporaryDirectory()
        self.addCleanup(self.temp_directory.cleanup)
        self.root = Path(self.temp_directory.name)
        self.csv_path = self.root / "tickets.csv"

        examples = {
            "ACCESS": ["no puedo entrar", "contraseña incorrecta"],
            "BUG": ["aparece un error", "la aplicación falla"],
            "FEATURE": ["quiero exportar reportes", "agreguen modo oscuro"],
            "SECURITY": ["entraron a mi cuenta", "detecté una vulnerabilidad"],
        }
        rows = [
            {"message": f"{message} ejemplo {number}", "category": category}
            for category, messages in examples.items()
            for message in messages
            for number in range(5)
        ]
        pd.DataFrame(rows).to_csv(self.csv_path, index=False)

    def test_train_predict_save_and_load(self) -> None:
        classifier = TicketClassifier()
        report = classifier.train(self.csv_path)

        self.assertIn("accuracy", report)
        self.assertIn(
            classifier.predict(["alguien entró a mi cuenta sin autorización"])[0],
            {"ACCESS", "BUG", "FEATURE", "SECURITY"},
        )

        model_path = classifier.save(self.root / "models" / "classifier.joblib")
        restored = TicketClassifier.load(model_path)
        self.assertEqual(
            restored.predict(["quiero exportar reportes"]),
            classifier.predict(["quiero exportar reportes"]),
        )

    def test_rejects_missing_columns(self) -> None:
        invalid_path = self.root / "invalid.csv"
        pd.DataFrame([{"text": "hola"}]).to_csv(invalid_path, index=False)

        with self.assertRaisesRegex(ValueError, "columnas"):
            TicketClassifier().train(invalid_path)

    def test_rejects_missing_dataset(self) -> None:
        with self.assertRaisesRegex(FileNotFoundError, "No existe el dataset"):
            TicketClassifier().train(self.root / "missing.csv")

    def test_rejects_empty_dataset(self) -> None:
        empty_path = self.root / "empty.csv"
        pd.DataFrame(columns=["message", "category"]).to_csv(empty_path, index=False)

        with self.assertRaisesRegex(ValueError, "no contiene tickets válidos"):
            TicketClassifier().train(empty_path)

    def test_rejects_unknown_category(self) -> None:
        unknown_path = self.root / "unknown.csv"
        pd.DataFrame(
            [
                {"message": "mensaje uno", "category": "OTHER"},
                {"message": "mensaje dos", "category": "OTHER"},
                {"message": "mensaje tres", "category": "BUG"},
                {"message": "mensaje cuatro", "category": "BUG"},
            ]
        ).to_csv(unknown_path, index=False)

        with self.assertRaisesRegex(ValueError, "categorías no permitidas: OTHER"):
            TicketClassifier().train(unknown_path, test_size=0.5)

    def test_rejects_dataset_with_one_category(self) -> None:
        one_category_path = self.root / "one-category.csv"
        pd.DataFrame(
            [
                {"message": f"error de ejemplo {number}", "category": "BUG"}
                for number in range(10)
            ]
        ).to_csv(one_category_path, index=False)

        with self.assertRaisesRegex(ValueError, "al menos dos categorías"):
            TicketClassifier().train(one_category_path)

    def test_rejects_category_with_one_example(self) -> None:
        unbalanced_path = self.root / "unbalanced.csv"
        rows = [
            {"message": f"error de ejemplo {number}", "category": "BUG"}
            for number in range(10)
        ]
        rows.append({"message": "quiero otra función", "category": "FEATURE"})
        pd.DataFrame(rows).to_csv(unbalanced_path, index=False)

        with self.assertRaisesRegex(ValueError, "al menos dos tickets"):
            TicketClassifier().train(unbalanced_path, test_size=0.5)

    def test_requires_fitted_model(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "entrenarse o cargarse"):
            TicketClassifier().predict(["mensaje"])

    def test_rejects_empty_or_invalid_messages(self) -> None:
        classifier = TicketClassifier()
        classifier.train(self.csv_path)

        for messages in ([], ["   "], [None], ["mensaje", 123]):
            with self.subTest(messages=messages):
                with self.assertRaisesRegex(ValueError, "mensaje de texto no vacío"):
                    classifier.predict(messages)

    def test_command_line_train_and_predict(self) -> None:
        model_path = self.root / "models" / "cli-classifier.joblib"
        train_result = subprocess.run(
            [
                sys.executable,
                "-m",
                "ml.ticket_classifier",
                "train",
                "--data",
                str(self.csv_path),
                "--model",
                str(model_path),
                "--message",
                "detecté una vulnerabilidad",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        trained = json.loads(train_result.stdout)

        self.assertEqual(trained["model"], str(model_path))
        self.assertIn("accuracy", trained["report"])
        self.assertIn(trained["prediction"], {"ACCESS", "BUG", "FEATURE", "SECURITY"})
        self.assertTrue(model_path.is_file())

        predict_result = subprocess.run(
            [
                sys.executable,
                "-m",
                "ml.ticket_classifier",
                "predict",
                "--model",
                str(model_path),
                "--message",
                "quiero exportar reportes",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        predicted = json.loads(predict_result.stdout)
        self.assertIn(predicted["prediction"], {"ACCESS", "BUG", "FEATURE", "SECURITY"})


if __name__ == "__main__":
    unittest.main()
