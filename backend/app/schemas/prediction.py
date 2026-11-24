
from datetime import datetime
from pydantic import BaseModel, ConfigDict,Field


class PredictionResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    unit: int
    last_cycle: int
    predicted_rul: float
    model_name: str
    created_at: datetime



class SensorPredictionRequest(BaseModel):
    unit: int = Field(gt=0)
    cycle: int = Field(gt=0)

    op_setting_1: float
    op_setting_2: float
    op_setting_3: float

    sensor_2: float
    sensor_3: float
    sensor_4: float
    sensor_6: float
    sensor_7: float
    sensor_8: float
    sensor_9: float
    sensor_11: float
    sensor_12: float
    sensor_13: float
    sensor_14: float
    sensor_15: float
    sensor_17: float
    sensor_20: float
    sensor_21: float
