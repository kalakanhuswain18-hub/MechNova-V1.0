
from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func

from backend.app.core.database import Base


class MachinePrediction(Base):

    __tablename__ = "machine_predictions"

    id = Column(Integer, primary_key=True, index=True)

    unit = Column(Integer, nullable=False, index=True)

    last_cycle = Column(Integer, nullable=False)

    predicted_rul = Column(Float, nullable=False)

    model_name = Column(String(50), nullable=False)

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
