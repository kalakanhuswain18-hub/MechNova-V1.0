
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends, HTTPException
from backend.app.core.database import get_db
from backend.app.models.prediction import MachinePrediction
from backend.app.schemas.prediction import PredictionResponse
from fastapi import Query
from sqlalchemy import func
import sys
from pathlib import Path
import pandas as pd
from sqlalchemy import text

# Locate project root from backend/main.py
PROJECT_ROOT = Path(__file__).resolve().parents[1]
ML_PATH = PROJECT_ROOT / "ml"

if str(ML_PATH) not in sys.path:
    sys.path.insert(0, str(ML_PATH))

from ml.components.model_predictor import ModelPredictor
from backend.app.schemas.prediction import SensorPredictionRequest


app = FastAPI(
    title="MechNova V1.0",
    description="Industrial Predictive Maintenance AI Platform",
    version="1.0.0"
)
def get_health_status(predicted_rul: float):

    if predicted_rul > 50:
        return "Normal"

    elif predicted_rul > 20:
        return "Warning"

    else:
        return "Critical"
predictor = ModelPredictor()
predictor.load_artifacts()

print("MechNova ML models loaded successfully!")
@app.get("/")
def home():
    return {
        "message": "Welcome to MechNova API",
        "status": "running"
    }




@app.get(
    "/api/v1/predictions",
    response_model=list[PredictionResponse]
)
def get_predictions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):

    predictions = (
        db.query(MachinePrediction)
        .order_by(MachinePrediction.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return predictions

@app.get("/api/v1/predictions/{unit_id}")
def get_machine_prediction(
    unit_id: int,
    db: Session = Depends(get_db)
):

    predictions = (
        db.query(MachinePrediction)
        .filter(MachinePrediction.unit == unit_id)
        .order_by(MachinePrediction.id.desc())
        .all()
    )

    if not predictions:
        raise HTTPException(
            status_code=404,
            detail=f"No predictions found for machine {unit_id}"
        )

    return [
        {
            "id": machine.id,
            "unit": machine.unit,
            "last_cycle": machine.last_cycle,
            "predicted_rul": round(machine.predicted_rul, 2),
            "health_status": get_health_status(machine.predicted_rul),
            "model_name": machine.model_name,
            "created_at": machine.created_at
        }
        for machine in predictions
    ]

@app.post("/api/v1/predict")
def predict_machine_rul(
    request: SensorPredictionRequest,
    db: Session = Depends(get_db)
):
    try:
        # Convert incoming sensor data into DataFrame
        sensor_data = request.model_dump(exclude={"unit"})
        input_df = pd.DataFrame([sensor_data])

        # Generate RUL prediction
        prediction = predictor.predict(
            input_df,
            model_name="XGBoost"
        )

        predicted_rul = float(prediction[0])

        # Save prediction in MySQL
        record = MachinePrediction(
            unit=request.unit,
            last_cycle=request.cycle,
            predicted_rul=predicted_rul,
            model_name="XGBoost"
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "message": "Prediction generated successfully",
            "unit": record.unit,
            "predicted_rul": round(predicted_rul, 2),
            "model_name": "XGBoost",
            "prediction_id": record.id
        }

    except Exception:
        db.rollback()
        raise
@app.get("/api/v1/machine-groups")
def get_machine_groups(db: Session = Depends(get_db)):

    # Fetch unique machine IDs
    machine_units = (
        db.query(MachinePrediction.unit)
        .distinct()
        .order_by(MachinePrediction.unit.asc())
        .all()
    )

    groups = {}

    for row in machine_units:
        unit = row[0]

        # Create groups of 10 machines
        group_start = ((unit - 1) // 10) * 10 + 1
        group_end = group_start + 9

        group_name = f"Group {group_start}-{group_end}"

        if group_name not in groups:
            groups[group_name] = {
                "group_name": group_name,
                "start_unit": group_start,
                "end_unit": group_end,
                "machine_count": 0,
                "machine_ids": []
            }

        groups[group_name]["machine_count"] += 1
        groups[group_name]["machine_ids"].append(unit)

    return {
        "total_groups": len(groups),
        "total_machines": len(machine_units),
        "groups": list(groups.values())
    }
@app.get("/api/v1/machine-groups/{start_unit}-{end_unit}")
def get_machines_by_group(
    start_unit: int,
    end_unit: int,
    db: Session = Depends(get_db)
):
    if start_unit <= 0 or end_unit < start_unit:
        raise HTTPException(
            status_code=400,
            detail="Invalid machine group range"
        )

    # Get latest prediction ID for each machine in this group
    latest_predictions = (
        db.query(
            func.max(MachinePrediction.id).label("latest_id")
        )
        .filter(
            MachinePrediction.unit >= start_unit,
            MachinePrediction.unit <= end_unit
        )
        .group_by(MachinePrediction.unit)
        .subquery()
    )

    machines = (
        db.query(MachinePrediction)
        .join(
            latest_predictions,
            MachinePrediction.id == latest_predictions.c.latest_id
        )
        .order_by(MachinePrediction.unit.asc())
        .all()
    )

    return {
        "group_name": f"Group {start_unit}-{end_unit}",
        "machine_count": len(machines),
        "machines": [
            {
        "unit": machine.unit,
        "last_cycle": machine.last_cycle,
        "predicted_rul": round(machine.predicted_rul, 2),
        "health_status": get_health_status(machine.predicted_rul),
        "model_name": machine.model_name,
        "created_at": machine.created_at
      }
            for machine in machines
        ]
    }
@app.get("/api/v1/dashboard/health-summary")
def get_health_summary(db: Session = Depends(get_db)):

    # Find latest prediction ID for every machine
    latest_predictions = (
        db.query(
            func.max(MachinePrediction.id).label("latest_id")
        )
        .group_by(MachinePrediction.unit)
        .subquery()
    )

    # Fetch only the latest prediction of each machine
    machines = (
        db.query(MachinePrediction)
        .join(
            latest_predictions,
            MachinePrediction.id == latest_predictions.c.latest_id
        )
        .all()
    )

    normal = 0
    warning = 0
    critical = 0

    for machine in machines:
        status = get_health_status(machine.predicted_rul)

        if status == "Normal":
            normal += 1
        elif status == "Warning":
            warning += 1
        else:
            critical += 1

    return {
        "total_machines": len(machines),
        "normal": normal,
        "warning": warning,
        "critical": critical
    }

@app.get("/api/v1/dashboard/attention-required")
def get_attention_required_machines(
    db: Session = Depends(get_db)
):

    # Find latest prediction for each machine
    latest_predictions = (
        db.query(
            func.max(MachinePrediction.id).label("latest_id")
        )
        .group_by(MachinePrediction.unit)
        .subquery()
    )

    # Fetch latest machine predictions
    machines = (
        db.query(MachinePrediction)
        .join(
            latest_predictions,
            MachinePrediction.id == latest_predictions.c.latest_id
        )
        .filter(MachinePrediction.predicted_rul <= 50)
        .order_by(MachinePrediction.predicted_rul.asc())
        .all()
    )

    return {
        "total_attention_required": len(machines),
        "machines": [
            {
                "unit": machine.unit,
                "last_cycle": machine.last_cycle,
                "predicted_rul": round(machine.predicted_rul, 2),
                "health_status": get_health_status(machine.predicted_rul),
                "model_name": machine.model_name,
                "created_at": machine.created_at
            }
            for machine in machines
        ]
    }
@app.get("/api/v1/dashboard/group-health-summary")
def get_group_health_summary(db: Session = Depends(get_db)):

    # Get latest prediction of every machine
    latest_predictions = (
        db.query(
            func.max(MachinePrediction.id).label("latest_id")
        )
        .group_by(MachinePrediction.unit)
        .subquery()
    )

    machines = (
        db.query(MachinePrediction)
        .join(
            latest_predictions,
            MachinePrediction.id == latest_predictions.c.latest_id
        )
        .all()
    )

    groups = {}

    for machine in machines:

        unit = machine.unit

        group_start = ((unit - 1) // 10) * 10 + 1
        group_end = group_start + 9
        group_name = f"Group {group_start}-{group_end}"

        if group_name not in groups:
            groups[group_name] = {
                "group_name": group_name,
                "total_machines": 0,
                "normal": 0,
                "warning": 0,
                "critical": 0
            }

        status = get_health_status(machine.predicted_rul)

        groups[group_name]["total_machines"] += 1
        groups[group_name][status.lower()] += 1

    # Calculate health percentage
    for group in groups.values():

        total = group["total_machines"]

        healthy_count = group["normal"]

        group["health_percentage"] = round(
            (healthy_count / total) * 100, 2
        )

    return {
        "total_groups": len(groups),
        "groups": list(groups.values())
    }
@app.get("/api/v1/machines/{unit_id}/history")
def get_machine_prediction_history(
    unit_id: int,
    db: Session = Depends(get_db)
):

    # Fetch all historical predictions of a machine
    history = (
        db.query(MachinePrediction)
        .filter(MachinePrediction.unit == unit_id)
        .order_by(MachinePrediction.id.asc())
        .all()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail=f"No prediction history found for machine {unit_id}"
        )

    return {
        "unit": unit_id,
        "total_predictions": len(history),
        "history": [
            {
                "prediction_id": machine.id,
                "last_cycle": machine.last_cycle,
                "predicted_rul": round(machine.predicted_rul, 2),
                "health_status": get_health_status(
                    machine.predicted_rul
                ),
                "model_name": machine.model_name,
                "created_at": machine.created_at
            }
            for machine in history
        ]
    }
@app.get("/api/v1/machines/{unit_id}/analytics")
def get_machine_analytics(
    unit_id: int,
    db: Session = Depends(get_db)
):

    # Fetch historical predictions
    history = (
        db.query(MachinePrediction)
        .filter(MachinePrediction.unit == unit_id)
        .order_by(MachinePrediction.id.asc())
        .all()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail=f"No prediction history found for machine {unit_id}"
        )

    rul_values = [
        machine.predicted_rul for machine in history
    ]

    first_rul = rul_values[0]
    latest_rul = rul_values[-1]

    average_rul = sum(rul_values) / len(rul_values)

    return {
        "unit": unit_id,
        "total_predictions": len(history),
        "first_predicted_rul": round(first_rul, 2),
        "latest_predicted_rul": round(latest_rul, 2),
        "rul_change": round(latest_rul - first_rul, 2),
        "average_predicted_rul": round(average_rul, 2),
        "current_health_status": get_health_status(latest_rul)
    }
@app.get("/api/v1/system/health")
def system_health(db: Session = Depends(get_db)):

    # Check database connection
    try:
        db.execute(text("SELECT 1"))
        database_status = "Connected"
    except Exception:
        database_status = "Disconnected"

    # Check ML model availability
    if (
        predictor.models
        and predictor.scaler is not None
        and predictor.feature_names is not None
    ):
        ml_model_status = "Loaded"
    else:
        ml_model_status = "Not Loaded"

    # Overall system status
    system_status = (
        "Healthy"
        if database_status == "Connected"
        and ml_model_status == "Loaded"
        else "Degraded"
    )

    return {
        "system_status": system_status,
        "backend": "Online",
        "database": database_status,
        "ml_model": ml_model_status
    }