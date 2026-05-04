"""
train_weakness_model.py

Trains 3 models to predict weak categories from per-category learning signals:
- Logistic Regression (scaled)
- Random Forest
- Gradient Boosting

Input (default):
- assets/data/weakness_dataset.csv

Outputs (default, saved into assets/data/):
- weakness_model_metrics.json       (CV + holdout metrics + confusion matrices)
- best_weakness_model.joblib        (best model by CV accuracy; reusable later)
- logreg_weights.json               (portable LR weights for offline mobile inference)

Run from project root:
  python app/features/karunarathne_lesson_quiz/scripts/train_weakness_model.py
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = ["attempts", "correct_ratio", "avg_time_sec", "hint_rate", "repeat_rate"]
LABEL = "weak_label"

# Script location:
#   app/features/karunarathne_lesson_quiz/scripts/train_weakness_model.py
# Project root is 4 parents up from scripts/
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[3]

DEFAULT_DATASET = (PROJECT_ROOT / "assets" / "data" / "weakness_dataset.csv").resolve()
ASSETS_DATA_DIR = (PROJECT_ROOT / "assets" / "data").resolve()
ASSETS_DATA_DIR.mkdir(parents=True, exist_ok=True)

METRICS_PATH = (ASSETS_DATA_DIR / "weakness_model_metrics.json").resolve()
BEST_MODEL_PATH = (ASSETS_DATA_DIR / "best_weakness_model.joblib").resolve()
LOGREG_WEIGHTS_PATH = (ASSETS_DATA_DIR / "logreg_weights.json").resolve()


# ---------------- Data ----------------
def load_data(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    if path.suffix.lower() == ".json":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        df = pd.DataFrame(data)
    else:
        df = pd.read_csv(path)

    missing_cols = [c for c in FEATURES + [LABEL] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset missing required columns: {missing_cols}")

    df = df.dropna(subset=FEATURES + [LABEL]).copy()
    df[LABEL] = df[LABEL].astype(int)

    # Clamp rates/ratios into valid ranges (defensive)
    for c in ["correct_ratio", "hint_rate", "repeat_rate"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").clip(0, 1)

    # Ensure numeric feature types
    for c in FEATURES:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    df = df.dropna(subset=FEATURES + [LABEL]).copy()
    return df


# ---------------- Metrics helpers ----------------
def _to_float(x: Any) -> float:
    try:
        return float(x)
    except Exception:
        return float("nan")


def evaluate_cv(model, X: np.ndarray, y: np.ndarray, name: str) -> Dict[str, float]:
    """
    5-fold stratified CV; returns mean metrics.
    """
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {
        "acc": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc",
    }

    scores = cross_validate(model, X, y, cv=cv, scoring=scoring)

    out: Dict[str, float] = {}
    for k, v in scores.items():
        if k.startswith("test_"):
            out[k.replace("test_", "")] = _to_float(np.mean(v))

    print(f"\n=== {name} (5-fold CV mean) ===")
    for k in ["acc", "precision", "recall", "f1", "roc_auc"]:
        if k in out:
            print(f"{k}: {out[k]:.4f}")
    return out


def holdout_report(model, X: np.ndarray, y: np.ndarray, name: str) -> Dict[str, Any]:
    """
    Holdout 80/20 evaluation for confusion matrix + classification report.
    Returns ROC-AUC if model supports predict_proba.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)

    proba = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X_test)[:, 1]

    cm = confusion_matrix(y_test, preds).tolist()
    rep = classification_report(y_test, preds, digits=4, output_dict=True)

    out: Dict[str, Any] = {
        "accuracy": _to_float(accuracy_score(y_test, preds)),
        "precision": _to_float(precision_score(y_test, preds, zero_division=0)),
        "recall": _to_float(recall_score(y_test, preds, zero_division=0)),
        "f1": _to_float(f1_score(y_test, preds, zero_division=0)),
        "confusion_matrix": cm,
        "classification_report": rep,
    }

    if proba is not None:
        out["roc_auc"] = _to_float(roc_auc_score(y_test, proba))

    print(f"\n=== {name} (Holdout 80/20) ===")
    print("Confusion Matrix:")
    print(np.array(cm))
    print("Accuracy:", out["accuracy"])
    if "roc_auc" in out:
        print("ROC-AUC:", out["roc_auc"])

    return out


def export_logreg_weights(pipe: Pipeline, out_path: Path) -> None:
    """
    Exports Logistic Regression weights + scaler stats for offline mobile inference (TypeScript).
    Requires pipeline steps: [("scaler", StandardScaler()), ("clf", LogisticRegression())].
    """
    scaler: StandardScaler = pipe.named_steps["scaler"]
    clf: LogisticRegression = pipe.named_steps["clf"]

    export = {
        "feature_names": FEATURES,
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "coef": clf.coef_[0].tolist(),
        "intercept": float(clf.intercept_[0]),
    }
    out_path.write_text(json.dumps(export, indent=2), encoding="utf-8")
    print(f"\nSaved logistic regression weights to: {out_path}")


# ---------------- Main training ----------------
def build_models() -> Dict[str, Any]:
    logreg = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, class_weight="balanced")),
        ]
    )

    rf = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        max_depth=None,
    )

    gb = GradientBoostingClassifier(random_state=42)

    return {"logreg": logreg, "rf": rf, "gb": gb}


def select_best_by_cv_accuracy(cv_results: Dict[str, Dict[str, float]]) -> Tuple[str, float]:
    best_name = ""
    best_acc = -1.0
    for name, metrics in cv_results.items():
        acc = metrics.get("acc", float("nan"))
        if not np.isfinite(acc):
            continue
        if acc > best_acc:
            best_acc = acc
            best_name = name
    if not best_name:
        raise RuntimeError("Could not select best model (no valid CV accuracy).")
    return best_name, float(best_acc)


def model_title(key: str) -> str:
    return {
        "logreg": "Logistic Regression",
        "rf": "Random Forest",
        "gb": "Gradient Boosting",
    }.get(key, key)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--data",
        type=str,
        default=str(DEFAULT_DATASET),
        help="Path to weakness_dataset.csv (or .json). Default points to assets/data/weakness_dataset.csv",
    )
    p.add_argument(
        "--metrics_out",
        type=str,
        default=str(METRICS_PATH),
        help="Where to save weakness_model_metrics.json",
    )
    p.add_argument(
        "--best_model_out",
        type=str,
        default=str(BEST_MODEL_PATH),
        help="Where to save best_weakness_model.joblib",
    )
    p.add_argument(
        "--logreg_weights_out",
        type=str,
        default=str(LOGREG_WEIGHTS_PATH),
        help="Where to save logreg_weights.json",
    )
    return p.parse_args()


def main():
    args = parse_args()

    dataset_path = Path(args.data).resolve()
    metrics_path = Path(args.metrics_out).resolve()
    best_model_path = Path(args.best_model_out).resolve()
    logreg_weights_path = Path(args.logreg_weights_out).resolve()

    df = load_data(dataset_path)
    X = df[FEATURES].values.astype(float)
    y = df[LABEL].values.astype(int)

    models = build_models()

    # 1) Cross-validation (all models)
    cv_results: Dict[str, Dict[str, float]] = {}
    for key, model in models.items():
        cv_results[key] = evaluate_cv(model, X, y, model_title(key))

    # 2) Select best by CV accuracy
    best_key, best_acc = select_best_by_cv_accuracy(cv_results)

    # 3) Holdout reports (evidence)
    holdout_results: Dict[str, Any] = {}
    for key, model in models.items():
        holdout_results[key] = holdout_report(model, X, y, model_title(key))

    # 4) Train best model on FULL data & persist it (reusable later)
    best_model = models[best_key]
    best_model.fit(X, y)
    joblib.dump(best_model, best_model_path)
    print(
        f"\nSaved best model ({model_title(best_key)}, CV acc={best_acc:.4f}) to: {best_model_path}"
    )

    # 5) Always export Logistic Regression weights for offline mobile inference
    # (Even if best model is RF/GB, LR is most practical for on-device explainable inference)
    models["logreg"].fit(X, y)
    export_logreg_weights(models["logreg"], logreg_weights_path)

    # 6) Save metrics JSON exactly as requested
    summary: Dict[str, Any] = {
        "dataset": {
            "path": str(dataset_path),
            "rows": int(df.shape[0]),
            "weak_label_rate": float(df[LABEL].mean()),
            "features": FEATURES,
            "label": LABEL,
        },
        "cross_validation": cv_results,
        "holdout_80_20": holdout_results,
        "best_model": {
            "key": best_key,
            "name": model_title(best_key),
            "selection_metric": "cv_accuracy",
            "cv_accuracy": float(best_acc),
            "saved_path": str(best_model_path),
        },
        "artifacts": {
            "metrics_json": str(metrics_path),
            "best_model_joblib": str(best_model_path),
            "logreg_weights_json": str(logreg_weights_path),
        },
    }

    metrics_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"\nSaved metrics to: {metrics_path}")


if __name__ == "__main__":
    main()
