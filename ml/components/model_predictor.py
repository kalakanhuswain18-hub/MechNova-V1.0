
import json
import joblib
import numpy as np
import pandas as pd
import os
import mlflow
import mlflow.pyfunc

from pathlib import Path
from mlflow.tracking import MlflowClient
from logging_config.logger import get_logger

logger = get_logger("ModelPredictor")


class ModelPredictor:

    def __init__(self):
        self.project_root = Path(__file__).resolve().parents[2]

        self.model_dir = self.project_root / "models" / "trained"
        self.preprocessing_dir = (
            self.project_root / "models" / "preprocessing"
        )

        self.cache_dir = (
            self.project_root
            / "models"
            / "mlflow_cache"
            / "MechNova-RUL-Predictor"
            / "1"
        )

        self.mlflow_uri = os.getenv(
            "MLFLOW_TRACKING_URI",
            "http://127.0.0.1:5000"
        )

        self.model_name = "MechNova-RUL-Predictor"
        self.model_version = "1"

        self.models = {}
        self.scaler = None
        self.feature_names = None

    def load_xgboost_from_registry(self):

        mlflow.set_tracking_uri(self.mlflow_uri)

        client = MlflowClient(
            tracking_uri=self.mlflow_uri
        )

        version = client.get_model_version(
            name=self.model_name,
            version=self.model_version
        )

        if version.status != "READY":
            raise RuntimeError(
                f"MLflow model is not READY: {version.status}"
            )

        # Reuse cached model if already downloaded
        if not (self.cache_dir / "MLmodel").exists():

            self.cache_dir.parent.mkdir(
                parents=True,
                exist_ok=True
            )

            logger.info(
                "Downloading XGBoost model from MLflow Registry"
            )

            downloaded_path = client.download_artifacts(
                run_id=version.run_id,
                path="model",
                dst_path=str(self.cache_dir.parent)
            )

            self.cache_dir = Path(downloaded_path)

        self.models["XGBoost"] = mlflow.pyfunc.load_model(
            str(self.cache_dir)
        )

        logger.info(
            "XGBoost model loaded from MLflow Registry"
        )

    def load_artifacts(self):

        try:
            # Load RandomForest from local storage
            self.models["RandomForest"] = joblib.load(
                self.model_dir / "RandomForest.pkl"
            )

            # Load XGBoost from MLflow Registry
            self.load_xgboost_from_registry()

            # Load preprocessing artifacts
            self.scaler = joblib.load(
                self.preprocessing_dir / "scaler.pkl"
            )

            with open(
                self.preprocessing_dir / "feature_names.json",
                "r"
            ) as file:
                self.feature_names = json.load(file)

            logger.info(
                "All models and preprocessing artifacts loaded"
            )

        except Exception:
            logger.exception(
                "Failed to load prediction artifacts"
            )
            raise

    def predict(self, input_data, model_name="XGBoost"):

        if not self.models:
            raise RuntimeError(
                "Load model artifacts first"
            )

        if model_name not in self.models:
            raise ValueError(
                f"Unknown model: {model_name}"
            )

        if not isinstance(input_data, pd.DataFrame):
            raise TypeError(
                "Input must be a pandas DataFrame"
            )

        missing_features = [
            col for col in self.feature_names
            if col not in input_data.columns
        ]

        if missing_features:
            raise ValueError(
                f"Missing features: {missing_features}"
            )

        # Maintain exact training feature order
        input_data = input_data[self.feature_names]

        # Apply training scaler
        scaled_data = self.scaler.transform(input_data)

        # Generate prediction
        predictions = self.models[model_name].predict(
            scaled_data
        )

        # RUL cannot be negative
        predictions = np.maximum(
            np.asarray(predictions).reshape(-1),
            0
        )

        logger.info(
            f"Prediction completed using {model_name}"
        )

        return predictions
