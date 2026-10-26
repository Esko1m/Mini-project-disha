import numpy as np
import joblib
import os
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline


def train_model(fingerprints, output_dir="models"):
    os.makedirs(output_dir, exist_ok=True)
    
    all_bssids = sorted(set(
        ap["bssid"]
        for r in fingerprints
        for ap in r.get("readings", [])
    ))
    
    RSSI_MISSING = -100
    X, y = [], []
    
    for r in fingerprints:
        scan_map = {ap["bssid"]: ap["rssi"] for ap in r.get("readings", [])}
        vector = [scan_map.get(bssid, RSSI_MISSING) for bssid in all_bssids]
        X.append(vector)
        y.append((r["x"], r["y"], r["floor"]))
    
    if len(X) == 0:
        raise ValueError("No fingerprints to train on")
    
    X = np.array(X)
    y = np.array(y)
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("knn", KNeighborsClassifier(
            n_neighbors=min(5, len(X)),
            weights="distance",
            metric="euclidean",
            algorithm="ball_tree"
        ))
    ])
    
    pipeline.fit(X, y)
    joblib.dump(pipeline, os.path.join(output_dir, "knn_model.joblib"))
    joblib.dump(all_bssids, os.path.join(output_dir, "known_bssids.joblib"))
    print(f"Model trained on {len(fingerprints)} fingerprints, {len(all_bssids)} BSSIDs.")
    return pipeline, all_bssids
