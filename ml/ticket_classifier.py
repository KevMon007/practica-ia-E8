"""Entrenamiento e inferencia del clasificador TF-IDF de tickets.

Este componente es aprendizaje automático supervisado, no un LLM. El módulo
permite entrenar el pipeline una sola vez, guardarlo y reutilizarlo durante la
inferencia sin volver a leer ni dividir el dataset.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

REQUIRED_COLUMNS = {"message", "category"}
ALLOWED_CATEGORIES = frozenset({"ACCESS", "BUG", "FEATURE", "SECURITY"})


class TicketClassifier:
    """Pipeline entrenable para clasificar mensajes de soporte."""

    def __init__(self, model: Pipeline | None = None) -> None:
        self.model = model or Pipeline(
            [
                ("vectorizer", TfidfVectorizer(ngram_range=(1, 2))),
                (
                    "classifier",
                    LogisticRegression(max_iter=1000, random_state=42),
                ),
            ]
        )
        self.is_fitted = model is not None

    def train(
        self,
        csv_path: str | Path,
        *,
        test_size: float = 0.2,
        random_state: int = 42,
    ) -> dict:
        """Entrena con un CSV y devuelve el reporte de evaluación."""
        data = _load_dataset(csv_path)
        _validate_split(data, test_size)

        x_train, x_test, y_train, y_test = train_test_split(
            data["message"],
            data["category"],
            test_size=test_size,
            stratify=data["category"],
            random_state=random_state,
        )

        self.model.fit(x_train, y_train)
        self.is_fitted = True
        predictions = self.model.predict(x_test)
        report = classification_report(
            y_test,
            predictions,
            output_dict=True,
            zero_division=0,
        )
        labels = sorted(data["category"].unique())
        report["confusion_matrix"] = {
            "labels": labels,
            "counts": confusion_matrix(y_test, predictions, labels=labels).tolist(),
        }
        return report

    def predict(self, messages: Iterable[str]) -> list[str]:
        """Clasifica uno o más mensajes usando un modelo entrenado."""
        return self.model.predict(self._validate_messages(messages)).tolist()

    def predict_with_score(self, message: str) -> dict[str, str | float]:
        """Devuelve la categoría predicha y su probabilidad estimada."""
        messages = self._validate_messages([message])
        probabilities = self.model.predict_proba(messages)[0]
        category_index = probabilities.argmax()
        return {
            "prediction": str(self.model.classes_[category_index]),
            "score": round(float(probabilities[category_index]), 3),
        }

    def _validate_messages(self, messages: Iterable[str]) -> list[str]:
        if not self.is_fitted:
            raise RuntimeError("El modelo debe entrenarse o cargarse antes de predecir.")

        normalized = list(messages)
        if not normalized or any(
            not isinstance(item, str) or not item.strip() for item in normalized
        ):
            raise ValueError("Se requiere al menos un mensaje de texto no vacío.")

        return normalized

    def save(self, model_path: str | Path) -> Path:
        """Guarda el pipeline entrenado en disco."""
        if not self.is_fitted:
            raise RuntimeError("No se puede guardar un modelo sin entrenar.")

        destination = Path(model_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, destination)
        return destination

    @classmethod
    def load(cls, model_path: str | Path) -> "TicketClassifier":
        """Carga un pipeline previamente guardado."""
        source = Path(model_path)
        if not source.is_file():
            raise FileNotFoundError(f"No existe el modelo: {source}")
        return cls(joblib.load(source))


def _load_dataset(csv_path: str | Path) -> pd.DataFrame:
    source = Path(csv_path)
    if not source.is_file():
        raise FileNotFoundError(f"No existe el dataset: {source}")

    data = pd.read_csv(source)
    missing = REQUIRED_COLUMNS.difference(data.columns)
    if missing:
        raise ValueError(
            "El CSV debe incluir las columnas: " + ", ".join(sorted(REQUIRED_COLUMNS))
        )

    data = data.loc[:, ["message", "category"]].dropna().copy()
    data["message"] = data["message"].astype(str).str.strip()
    data["category"] = data["category"].astype(str).str.strip().str.upper()
    data = data[(data["message"] != "") & (data["category"] != "")]
    if data.empty:
        raise ValueError("El dataset no contiene tickets válidos.")

    unknown_categories = sorted(set(data["category"]) - ALLOWED_CATEGORIES)
    if unknown_categories:
        raise ValueError(
            "El dataset contiene categorías no permitidas: "
            + ", ".join(unknown_categories)
        )
    return data


def _validate_split(data: pd.DataFrame, test_size: float) -> None:
    if not 0 < test_size < 1:
        raise ValueError("test_size debe ser un valor entre 0 y 1.")

    category_counts = data["category"].value_counts()
    categories = len(category_counts)
    test_rows = int(len(data) * test_size + 0.999999)
    train_rows = len(data) - test_rows

    if categories < 2:
        raise ValueError("El dataset debe contener al menos dos categorías.")
    if (category_counts < 2).any():
        raise ValueError("Cada categoría debe tener al menos dos tickets para estratificar.")
    if test_rows < categories or train_rows < categories:
        raise ValueError(
            "El dataset o test_size no permite incluir todas las categorías "
            "en entrenamiento y prueba."
        )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)

    train = commands.add_parser("train", help="Entrena y guarda el clasificador")
    train.add_argument("--data", default="tickets.csv", help="Ruta del CSV de tickets")
    train.add_argument(
        "--model",
        default="models/ticket_classifier.joblib",
        help="Ruta donde se guardará el modelo",
    )
    train.add_argument("--test-size", type=float, default=0.2)
    train.add_argument("--message", help="Mensaje opcional para probar al terminar")

    predict = commands.add_parser("predict", help="Clasifica con un modelo guardado")
    predict.add_argument(
        "--model",
        default="models/ticket_classifier.joblib",
        help="Ruta del modelo guardado",
    )
    predict.add_argument("--message", required=True, help="Mensaje que se clasificará")
    return parser


def main() -> None:
    args = _build_parser().parse_args()

    if args.command == "train":
        classifier = TicketClassifier()
        report = classifier.train(args.data, test_size=args.test_size)
        destination = classifier.save(args.model)
        result = {"model": str(destination), "report": report}
        if args.message:
            result.update(classifier.predict_with_score(args.message))
    else:
        classifier = TicketClassifier.load(args.model)
        result = classifier.predict_with_score(args.message)

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
