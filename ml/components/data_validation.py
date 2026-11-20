
import json
from pathlib import Path

import pandas as pd

from entity.artifact_entity import (
    DataIngestionArtifact,
    DataValidationArtifact
)
from logging_config.logger import get_logger


logger = get_logger("DataValidation")


class DataValidation:

    def __init__(self, ingestion_artifact: DataIngestionArtifact):

        self.ingestion_artifact = ingestion_artifact

        self.expected_columns = [
            "unit",
            "cycle",
            "op_setting_1",
            "op_setting_2",
            "op_setting_3"
        ]

        self.expected_columns += [
            f"sensor_{i}" for i in range(1, 22)
        ]

    # 1. Schema Validation
    def validate_schema(self):

        try:
            logger.info("Starting schema validation")

            train_df = pd.read_csv(
                self.ingestion_artifact.train_file_path
            )

            test_df = pd.read_csv(
                self.ingestion_artifact.test_file_path
            )

            rul_df = pd.read_csv(
                self.ingestion_artifact.rul_file_path
            )

            if list(train_df.columns) != self.expected_columns:
                raise ValueError("Train dataset schema mismatch")

            if list(test_df.columns) != self.expected_columns:
                raise ValueError("Test dataset schema mismatch")

            if list(rul_df.columns) != ["RUL"]:
                raise ValueError("RUL dataset schema mismatch")

            logger.info("Schema validation successful")
            return True

        except Exception:
            logger.exception("Schema validation failed")
            raise

    # 2. Missing Values Validation
    def validate_missing_values(self):

        try:
            logger.info("Starting missing values validation")

            datasets = {
                "train": self.ingestion_artifact.train_file_path,
                "test": self.ingestion_artifact.test_file_path,
                "rul": self.ingestion_artifact.rul_file_path
            }

            for name, file_path in datasets.items():

                df = pd.read_csv(file_path)

                missing_count = df.isnull().sum().sum()

                logger.info(
                    "%s dataset missing values: %s",
                    name,
                    missing_count
                )

                if missing_count > 0:
                    raise ValueError(
                        f"Missing values found in {name} dataset"
                    )

            logger.info("Missing values validation successful")
            return True

        except Exception:
            logger.exception("Missing values validation failed")
            raise

    # 3. Duplicate Validation
    def validate_duplicates(self):

        try:
            logger.info("Starting duplicate validation")

            datasets = {
                "train": self.ingestion_artifact.train_file_path,
                "test": self.ingestion_artifact.test_file_path
            }

            for name, file_path in datasets.items():

                df = pd.read_csv(file_path)

                duplicate_count = df.duplicated().sum()

                logger.info(
                    "%s dataset duplicate records: %s",
                    name,
                    duplicate_count
                )

                if duplicate_count > 0:
                    raise ValueError(
                        f"Duplicate records found in {name} dataset"
                    )

            logger.info("Duplicate validation successful")
            return True

        except Exception:
            logger.exception("Duplicate validation failed")
            raise

    # 4. Data Type Validation
    def validate_data_types(self):

        try:
            logger.info("Starting data type validation")

            datasets = {
                "train": self.ingestion_artifact.train_file_path,
                "test": self.ingestion_artifact.test_file_path,
                "rul": self.ingestion_artifact.rul_file_path
            }

            for name, file_path in datasets.items():

                df = pd.read_csv(file_path)

                if name == "rul":

                    if not pd.api.types.is_numeric_dtype(df["RUL"]):
                        raise TypeError("RUL must be numeric")

                else:

                    for column in df.columns:

                        if not pd.api.types.is_numeric_dtype(df[column]):
                            raise TypeError(
                                f"Invalid data type in {name}: {column}"
                            )

                logger.info(
                    "%s dataset data types validated",
                    name
                )

            logger.info("Data type validation successful")
            return True

        except Exception:
            logger.exception("Data type validation failed")
            raise

    # 5. Generate Validation Report
    def generate_validation_report(self):

        try:
            logger.info("Generating validation report")

            report = {}

            checks = {
                "schema_validation": self.validate_schema,
                "missing_values_validation": self.validate_missing_values,
                "duplicate_validation": self.validate_duplicates,
                "data_type_validation": self.validate_data_types
            }

            for check_name, check_function in checks.items():

                try:
                    check_function()
                    report[check_name] = "PASSED"

                except Exception as e:
                    report[check_name] = f"FAILED: {str(e)}"

            # Save report
            report_dir = (
                Path(__file__).resolve().parents[1]
                / "data"
                / "validation"
            )

            report_dir.mkdir(parents=True, exist_ok=True)

            report_path = report_dir / "validation_report.json"

            with open(report_path, "w", encoding="utf-8") as file:
                json.dump(report, file, indent=4)

            # Overall validation status
            validation_status = all(
                status == "PASSED"
                for status in report.values()
            )

            logger.info(
                "Overall validation status: %s",
                validation_status
            )

            logger.info(
                "Validation report saved: %s",
                report_path
            )

            # Return structured artifact
            return DataValidationArtifact(
                validation_status=validation_status,
                validation_report_path=str(report_path)
            )

        except Exception:
            logger.exception("Validation report generation failed")
            raise
