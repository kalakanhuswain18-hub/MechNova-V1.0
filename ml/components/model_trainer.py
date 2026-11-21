
import joblib
import json
from entity.artifact_entity import ModelTrainerArtifact
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

from logging_config.logger import get_logger

logger = get_logger("ModelTrainer")


class ModelTrainer:

    def __init__(self, transformed_data):

        self.transformed_data = transformed_data

        self.project_root = Path(__file__).resolve().parents[2]

        self.model_dir = self.project_root / "models" / "trained"
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.models = {
            "RandomForest": RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                n_jobs=-1
            ),

            "XGBoost": XGBRegressor(
                n_estimators=100,
                learning_rate=0.05,
                max_depth=6,
                random_state=42,
                n_jobs=-1
            )
        }

        logger.info("ModelTrainer initialized successfully")

    def train_models(self):
        try:
            logger.info("Starting model training")

            X_train = self.transformed_data["X_train"]
            y_train = self.transformed_data["y_train"]

            trained_models = {}

            for model_name, model in self.models.items():

                logger.info(f"Training {model_name}")

                model.fit(X_train, y_train)

                trained_models[model_name] = model

                logger.info(f"{model_name} training completed")

            logger.info("All models trained successfully")

            return trained_models

        except Exception:
            logger.exception("Model training failed")
            raise

    def evaluate_model(self , trained_models):
        try:
            import numpy as np
            from sklearn.metrics import mean_absolute_error,mean_squared_error
            X_val=self.transformed_data["X_val"]
            y_val=self.transformed_data["y_val"]
            evaluation_results={}
            for model_name , model in trained_models.items():
                logger.info(f"Evaluating:{model_name}")
                predictions=model.predict(X_val)
                mae=mean_absolute_error(y_val,predictions)
                mse=mean_squared_error(y_val,predictions)
                rmse=np.sqrt(mse)
                errors=predictions-np.array(y_val)
                nasa_score=np.sum(
                    np.where(
                        errors<0,
                        np.exp(-errors/13)-1,
                        np.exp(errors/10)
                    )
                )
                evaluation_results[model_name]={
                    "MAE":float(mae),
                    "RMSE":float(rmse),
                    "NASA_Score":float(nasa_score)
                }
                logger.info(
                    f"{model_name} | MAE:{mae:.4f}"
                    f"RMSE:{rmse:.4f} | NASA Score:{nasa_score:.4f}"
                )
            return evaluation_results    

                
        except Exception as e:
            logger.exception("Model evaluation Failed")
            raise 
    
    def save_models(self, trained_models, evaluation_results):
        try:
            logger.info("Saving trained models")

            model_paths = {}

            # Save each trained model
            for model_name, model in trained_models.items():

                model_path = self.model_dir / f"{model_name}.pkl"

                joblib.dump(model, model_path)

                model_paths[model_name] = str(model_path)

                logger.info(f"{model_name} saved at {model_path}")

            # Select best model using lowest NASA Score
            best_model_name = min(
                evaluation_results,
                key=lambda name: evaluation_results[name]["NASA_Score"]
            )

            best_model_path = model_paths[best_model_name]

            # Save evaluation metrics
            metrics_path = self.model_dir / "evaluation_results.json"

            with open(metrics_path, "w") as file:
                json.dump(evaluation_results, file, indent=4)

            logger.info(f"Best model selected: {best_model_name}")

            return ModelTrainerArtifact(
                best_model_name=best_model_name,
                best_model_path=best_model_path,
                best_model_metrics=evaluation_results[best_model_name]
            )

        except Exception:
            logger.exception("Model saving failed")
            raise
    
    def save_comparison_report(self, validation_results, test_results):
        try:
            import json

            logger.info("Generating model comparison report")

            report = {
                "project": "MechNova V1.0",
                "dataset": "NASA C-MAPSS FD001",
                "validation_results": validation_results,
                "test_results": test_results,
                "selected_model": "XGBoost",
                "selection_basis": "Validation performance",
                "test_observation": (
                    "Random Forest performed slightly better "
                    "on the independent test set."
                )
            }

            report_path = self.model_dir / "model_comparison_report.json"

            with open(report_path, "w") as file:
                json.dump(report, file, indent=4)

            logger.info("Model comparison report saved")

            return str(report_path)

        except Exception:
            logger.exception("Failed to save model comparison report")
            raise
        
            

