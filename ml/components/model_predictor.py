
import json
import joblib
import numpy as np
import pandas as pd

from pathlib import Path
from logging_config.logger import get_logger

logger = get_logger("ModelPredictor")


class ModelPredictor:

    def __init__(self):
        self.project_root = Path(__file__).resolve().parents[2]

        self.model_dir = self.project_root / "models" / "trained"
        self.preprocessing_dir = (
            self.project_root / "models" / "preprocessing"
        )

        self.models = {}
        self.scaler = None
        self.feature_names = None

    def load_artifacts(self):

        try:
            # Load trained models
            self.models["RandomForest"] = joblib.load(
                self.model_dir / "RandomForest.pkl"
            )

            self.models["XGBoost"] = joblib.load(
                self.model_dir / "XGBoost.pkl"
            )

            # Load preprocessing artifacts
            self.scaler = joblib.load(
                self.preprocessing_dir / "scaler.pkl"
            )

            with open(
                self.preprocessing_dir / "feature_names.json",
                "r"
            ) as file:
                self.feature_names = json.load(file)

            logger.info("Models and preprocessing artifacts loaded")

        except Exception:
            logger.exception("Failed to load prediction artifacts")
            raise

    def predict(self, input_data, model_name="XGBoost"):

        if not self.models:
            raise RuntimeError("Load model artifacts first")

        if model_name not in self.models:
            raise ValueError(f"Unknown model: {model_name}")

        if not isinstance(input_data, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame")

        missing_features = [
            col for col in self.feature_names
            if col not in input_data.columns
        ]

        if missing_features:
            raise ValueError(
                f"Missing features: {missing_features}"
            )

        # Maintain the exact training feature order
        input_data = input_data[self.feature_names]

        # Apply the same scaler used during training
        scaled_data = self.scaler.transform(input_data)

        # Generate RUL prediction
        predictions = self.models[model_name].predict(scaled_data)

        # RUL cannot be negative
        predictions = np.maximum(predictions, 0)

        logger.info(
            f"Prediction completed using {model_name}"
        )

        return predictions
