
from dataclasses import dataclass


@dataclass
class DataIngestionArtifact:
    train_file_path: str
    test_file_path: str
    rul_file_path: str


@dataclass
class DataValidationArtifact:
    validation_status: bool
    validation_report_path: str

@dataclass
class ModelTrainerArtifact:
    best_model_name: str
    best_model_path: str
    best_model_metrics: dict
