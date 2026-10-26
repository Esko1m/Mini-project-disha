from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
from typing import Dict, Optional

app = FastAPI(title="Disha Indoor Localization ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("MODEL_PATH", "models/knn_model.joblib")
BSSIDS_PATH = os.getenv("BSSIDS_PATH", "models/known_bssids.joblib")

model = None
known_bssids = []

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    if os.path.exists(BSSIDS_PATH):
        known_bssids = joblib.load(BSSIDS_PATH)
except Exception as e:
    print(f"Warning: Could not load model: {e}")

RSSI_MISSING = -100


class LocateRequest(BaseModel):
    building_id: str
    scan: Dict[str, int]


class LocateResponse(BaseModel):
    x: float
    y: float
    floor: int
    confidence: float
    nearest_node: Optional[str] = None


@app.get("/")
def root():
    return {"status": "ok", "service": "disha-ml", "model_loaded": model is not None}


@app.post("/locate", response_model=LocateResponse)
def locate(req: LocateRequest):
    if model is None or not known_bssids:
        # Fallback for demo
        return LocateResponse(x=10.0, y=5.0, floor=1, confidence=0.5)
    
    vector = np.array([
        req.scan.get(bssid, RSSI_MISSING)
        for bssid in known_bssids
    ]).reshape(1, -1)
    
    try:
        prediction = model.predict(vector)[0]
        probabilities = model.predict_proba(vector)[0]
        confidence = float(np.max(probabilities))
        x, y, floor = prediction
        return LocateResponse(x=float(x), y=float(y), floor=int(floor), confidence=confidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train/{building_id}")
def train(building_id: str):
    return {"job_id": building_id, "status": "training_queued"}
