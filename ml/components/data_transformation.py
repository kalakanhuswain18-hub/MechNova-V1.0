
import pandas as pd
from pathlib import Path

from entity.artifact_entity import DataValidationArtifact
from logging_config.logger import get_logger
import json
import joblib

logger = get_logger("DataTransformation")


class DataTransformation:

    def __init__(self, validation_artifact: DataValidationArtifact):

        self.validation_artifact = validation_artifact

        self.project_root = Path(__file__).resolve().parents[2]

        self.data_dir = (
            self.project_root / "ml" / "data" / "ingested"
        )

    def load_validated_data(self):

        try:
            logger.info("Starting validated data loading")

            if not self.validation_artifact.validation_status:
                raise ValueError(
                    "Data validation failed. Transformation stopped."
                )

            train_path = self.data_dir / "train.csv"
            test_path = self.data_dir / "test.csv"
            rul_path = self.data_dir / "rul.csv"

            for file_path in [train_path, test_path, rul_path]:

                if not file_path.exists():
                    raise FileNotFoundError(
                        f"Validated data file not found: {file_path}"
                    )

            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)
            rul_df = pd.read_csv(rul_path)

            logger.info("Train data loaded: %s", train_df.shape)
            logger.info("Test data loaded: %s", test_df.shape)
            logger.info("RUL data loaded: %s", rul_df.shape)

            logger.info("Validated data loading successful")

            return train_df, test_df, rul_df

        except Exception:
            logger.exception("Validated data loading failed")
            raise
    
    def calculate_rul(self, train_df):

        try:
            logger.info("Starting RUL calculation")

            train_df = train_df.copy()

            max_cycles = (
                train_df.groupby("unit")["cycle"].max()
            )

            train_df["RUL"] = (
                train_df["unit"].map(max_cycles)
                - train_df["cycle"]
            )

            logger.info("RUL calculation completed")

            return train_df

        except Exception:
            logger.exception("RUL calculation failed")
            raise
    
    def visualize_rul_distribution(self, train_df):

        try:
            logger.info("Generating RUL distribution plot")

            import matplotlib.pyplot as plt

            plt.figure(figsize=(10, 5))

            plt.hist(
                train_df["RUL"],
                bins=40,
                edgecolor="black"
            )

            plt.title("Remaining Useful Life Distribution")
            plt.xlabel("Remaining Useful Life (Cycles)")
            plt.ylabel("Number of Observations")

            plt.tight_layout()
            plt.show()

            logger.info("RUL distribution plot generated")

        except Exception:
            logger.exception("RUL visualization failed")
            raise
    
    def cap_rul(self, train_df, cap=125):

        try:
            logger.info("Starting RUL capping with cap: %s", cap)

            if "RUL" not in train_df.columns:
                raise ValueError("RUL column not found")

            if cap <= 0:
                raise ValueError("RUL cap must be positive")

            train_df = train_df.copy()

            train_df["RUL"] = train_df["RUL"].clip(upper=cap)

            logger.info("RUL capping completed")

            return train_df

        except Exception:
            logger.exception("RUL capping failed")
            raise
    
    def analyze_sensor_variance(self, train_df):

        try:
            logger.info("Starting sensor variance analysis")

            sensor_columns = [
                column for column in train_df.columns
                if column.startswith("sensor_")
            ]

            sensor_std = train_df[sensor_columns].std()

            sensor_report = sensor_std.sort_values()

            logger.info("Sensor variance analysis completed")

            return sensor_report

        except Exception:
            logger.exception("Sensor variance analysis failed")
            raise
    
    def remove_constant_sensors(self, train_df, test_df):

        try:
            logger.info("Starting constant sensor removal")

            sensor_columns = [
                column for column in train_df.columns
                if column.startswith("sensor_")
            ]

            sensor_std = train_df[sensor_columns].std()

            constant_sensors = sensor_std[
                sensor_std == 0
            ].index.tolist()

            train_df = train_df.drop(
                columns=constant_sensors
            )

            test_df = test_df.drop(
                columns=constant_sensors
            )

            logger.info(
                "Constant sensors removed: %s",
                constant_sensors
            )

            logger.info("Constant sensor removal completed")

            return train_df, test_df, constant_sensors

        except Exception:
            logger.exception("Constant sensor removal failed")
            raise
    
    def remove_constant_sensors(self, train_df, test_df):

        try:
            logger.info("Starting constant sensor removal")

            sensor_columns = [
                column for column in train_df.columns
                if column.startswith("sensor_")
            ]

            constant_sensors = [
                column
                for column in sensor_columns
                if train_df[column].nunique() <= 1
            ]

            train_df = train_df.drop(
                columns=constant_sensors
            )

            test_df = test_df.drop(
                columns=constant_sensors
            )

            logger.info(
                "Constant sensors removed: %s",
                constant_sensors
            )

            logger.info("Constant sensor removal completed")

            return train_df, test_df, constant_sensors

        except Exception:
            logger.exception("Constant sensor removal failed")
            raise
    
    def split_train_validation(self, train_df, test_size=0.2):

        try:
            logger.info("Starting engine-wise train-validation split")

            from sklearn.model_selection import GroupShuffleSplit

            if not 0 < test_size < 1:
                raise ValueError("test_size must be between 0 and 1")

            X = train_df.drop(columns=["unit", "RUL"])
            y = train_df["RUL"]
            groups = train_df["unit"]

            splitter = GroupShuffleSplit(
                n_splits=1,
                test_size=test_size,
                random_state=42
            )

            train_idx, val_idx = next(
                splitter.split(X, y, groups=groups)
            )

            X_train = X.iloc[train_idx]
            X_val = X.iloc[val_idx]

            y_train = y.iloc[train_idx]
            y_val = y.iloc[val_idx]

            logger.info("Train shape: %s", X_train.shape)
            logger.info("Validation shape: %s", X_val.shape)

            return X_train, X_val, y_train, y_val

        except Exception:
            logger.exception("Train-validation split failed")
            raise
    
    def scale_features(self, X_train, X_val):

        try:
            logger.info("Starting feature scaling")

            from sklearn.preprocessing import StandardScaler

            scaler = StandardScaler()

            X_train_scaled = scaler.fit_transform(X_train)

            X_val_scaled = scaler.transform(X_val)

            logger.info("Feature scaling completed")

            return X_train_scaled, X_val_scaled, scaler

        except Exception:
            logger.exception("Feature scaling failed")
            raise
    def save_preprocessing_artifacts(self, scaler, feature_names):
        try:
            logger.info("Saving preprocessing artifacts")

            artifact_dir = self.project_root / "models" / "preprocessing"
            artifact_dir.mkdir(parents=True, exist_ok=True)

        # Save fitted scaler
            scaler_path = artifact_dir / "scaler.pkl"
            joblib.dump(scaler, scaler_path)

        # Save feature names and their order
            feature_path = artifact_dir / "feature_names.json"
            with open(feature_path, "w") as file:
                json.dump(list(feature_names), file, indent=4)

            logger.info("Preprocessing artifacts saved successfully")

            return str(scaler_path), str(feature_path)

        except Exception:
            logger.exception("Failed to save preprocessing artifacts")
            raise 
    
    def run_transformation(self):
        try:
            logger.info("Starting complete data transformation")

            # Load validated data
            train_df, test_df, rul_df = self.load_validated_data()

            # Calculate and cap RUL
            train_df = self.calculate_rul(train_df)
            train_df = self.cap_rul(train_df, cap=125)

            # Remove constant sensors
            train_df, test_df, removed_sensors = (
                self.remove_constant_sensors(train_df, test_df)
            )

            # Split data engine-wise
            X_train, X_val, y_train, y_val = (
                self.split_train_validation(train_df)
            )

            # Scale features
            X_train_scaled, X_val_scaled, scaler = (
                self.scale_features(X_train, X_val)
            )

            # Save preprocessing artifacts
            scaler_path, feature_path = self.save_preprocessing_artifacts(
                scaler, X_train.columns
            )

            logger.info("Data transformation completed successfully")

            return {
                "X_train": X_train_scaled,
                "X_val": X_val_scaled,
                "y_train": y_train,
                "y_val": y_val,
                "test_df": test_df,
                "rul_df": rul_df,
                "scaler_path": scaler_path,
                "feature_path": feature_path,
                "removed_sensors": removed_sensors
            }

        except Exception:
            logger.exception("Data transformation failed")
            raise
       
    
    
    
    
    
    
