
from pathlib import Path
import pandas as pd

from logging_config.logger import get_logger
from entity.artifact_entity import DataIngestionArtifact
logger = get_logger("DataIngestion")
class DataIngestion:

    def __init__(self):
        # Project root directory
        self.project_root = Path(__file__).resolve().parents[2]

        # Raw dataset directory
        self.raw_data_path = self.project_root / "ml" / "data" / "raw"

    
    

    def load_raw_data(self):

        try:
            logger.info("Starting data ingestion")

            columns = [
                "unit", "cycle",
                "op_setting_1", "op_setting_2", "op_setting_3"
            ]
            columns += [f"sensor_{i}" for i in range(1, 22)]

            train_path = self.raw_data_path / "train_FD001.txt"
            test_path = self.raw_data_path / "test_FD001.txt"
            rul_path = self.raw_data_path / "RUL_FD001.txt"

            for file_path in [train_path, test_path, rul_path]:
                if not file_path.exists():
                    raise FileNotFoundError(f"File not found: {file_path}")

            train_df = pd.read_csv(
                train_path, sep=r"\s+", header=None, names=columns
            )
            test_df = pd.read_csv(
                test_path, sep=r"\s+", header=None, names=columns
            )
            rul_df = pd.read_csv(
                rul_path, header=None, names=["RUL"]
            )

            if train_df.empty or test_df.empty or rul_df.empty:
                raise ValueError("One or more datasets are empty")

            # Save ingested data
            output_dir = self.project_root / "ml" / "data" / "ingested"
            output_dir.mkdir(parents=True, exist_ok=True)

            train_output = output_dir / "train.csv"
            test_output = output_dir / "test.csv"
            rul_output = output_dir / "rul.csv"

            train_df.to_csv(train_output, index=False)
            test_df.to_csv(test_output, index=False)
            rul_df.to_csv(rul_output, index=False)

            logger.info("Data ingestion completed successfully")

            return DataIngestionArtifact(
                train_file_path=str(train_output),
                test_file_path=str(test_output),
                rul_file_path=str(rul_output)
            )

        except Exception as e:
            logger.exception("Data ingestion failed")
            raise RuntimeError(f"Data ingestion failed: {e}") from e
