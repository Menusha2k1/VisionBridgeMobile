import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
    ConfusionMatrixDisplay,
    f1_score,
    precision_recall_curve,
    average_precision_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier

from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE

# Optional XGBoost
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except Exception:
    XGBOOST_AVAILABLE = False


# =========================================================
# Paths (matches your project structure)
# =========================================================
# This file is inside VisionBridgeMobile/ml/
ML_DIR = Path(__file__).resolve().parent
ROOT_DIR = ML_DIR.parent

DATA_DIR = ROOT_DIR / "assets" / "datasets"
OUTPUT_DIR = ROOT_DIR / "assets" / "model"
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

STUDENTS_FILE = DATA_DIR / "students_dataset.csv"
LESSON_FILE = DATA_DIR / "student_lesson.csv"
FEATURES_FILE = DATA_DIR / "student_lesson_features.csv"  # optional


# =========================================================
# Helpers
# =========================================================
def safe_read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return pd.read_csv(path)


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]
    return df


def find_first_existing(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    for c in candidates:
        if c in df.columns:
            return c
    return None


def load_datasets() -> Tuple[pd.DataFrame, pd.DataFrame, Optional[pd.DataFrame]]:
    students = normalize_columns(safe_read_csv(STUDENTS_FILE))
    lessons = normalize_columns(safe_read_csv(LESSON_FILE))
    features = None
    if FEATURES_FILE.exists():
        features = normalize_columns(safe_read_csv(FEATURES_FILE))
    return students, lessons, features


def merge_datasets(
    students: pd.DataFrame,
    lessons: pd.DataFrame,
    features: Optional[pd.DataFrame],
) -> pd.DataFrame:
    student_id_students = find_first_existing(students, ["student_id", "id"])
    student_id_lessons = find_first_existing(lessons, ["student_id", "id"])
    lesson_id_lessons = find_first_existing(lessons, ["lesson_id", "id"])

    if student_id_students is None or student_id_lessons is None:
        raise ValueError("Could not find student_id column in students or lessons CSV.")

    merged = lessons.copy()

    # Merge features if possible
    if features is not None:
        student_id_features = find_first_existing(features, ["student_id", "id"])
        lesson_id_features = find_first_existing(features, ["lesson_id", "id"])

        if student_id_features and lesson_id_features and lesson_id_lessons:
            merged = merged.merge(
                features,
                left_on=[student_id_lessons, lesson_id_lessons],
                right_on=[student_id_features, lesson_id_features],
                how="left",
                suffixes=("", "_feat"),
            )
        elif student_id_features:
            merged = merged.merge(
                features,
                left_on=student_id_lessons,
                right_on=student_id_features,
                how="left",
                suffixes=("", "_feat"),
            )

    # Merge student table
    merged = merged.merge(
        students,
        left_on=student_id_lessons,
        right_on=student_id_students,
        how="left",
        suffixes=("", "_student"),
    )

    return merged


# =========================================================
# Research-grade label: data-driven and balanced
# =========================================================
def create_difficulty_label_quantile(df: pd.DataFrame) -> pd.DataFrame:
    """
    difficulty_label = 1 means: likely struggling/difficulty.

    Use quantiles to avoid extreme imbalance:
    - low completion is bottom 25%
    - high pauses/replays/seek-backs are top 25%

    This produces a balanced target suitable for ML evaluation.
    """
    df = df.copy()

    needed = ["pause_count", "replay_count", "seek_back_seconds", "total_listen_time_sec", "completion_rate"]
    for col in needed:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    comp_q = df["completion_rate"].quantile(0.25)
    pause_q = df["pause_count"].quantile(0.75)
    replay_q = df["replay_count"].quantile(0.75)
    seek_q = df["seek_back_seconds"].quantile(0.75)

    struggle = (
        (df["completion_rate"] <= comp_q)
        | (df["pause_count"] >= pause_q)
        | (df["replay_count"] >= replay_q)
        | (df["seek_back_seconds"] >= seek_q)
    )

    df["difficulty_label"] = struggle.astype(int)

    dist = df["difficulty_label"].value_counts(normalize=True).to_dict()
    dist = {int(k): float(round(v, 3)) for k, v in dist.items()}
    print(f"Label distribution (quantile): {dist}")

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Ensure numeric
    for col in ["pause_count", "replay_count", "seek_back_seconds", "total_listen_time_sec", "completion_rate"]:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Derived features
    df["listen_time_min"] = df["total_listen_time_sec"].fillna(0) / 60.0
    df["interaction_load"] = df["pause_count"].fillna(0) + df["replay_count"].fillna(0)
    df["seek_pause_ratio"] = df["seek_back_seconds"].fillna(0) / (df["pause_count"].fillna(0) + 1)
    df["replay_pause_ratio"] = df["replay_count"].fillna(0) / (df["pause_count"].fillna(0) + 1)
    df["completion_gap"] = 1.0 - df["completion_rate"].fillna(0)

    return df


def select_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, List[str], List[str]]:
    if "difficulty_label" not in df.columns:
        raise ValueError("difficulty_label not found. Did you run label creation?")

    preferred_numeric = [
        "pause_count",
        "replay_count",
        "seek_back_seconds",
        "total_listen_time_sec",
        "completion_rate",
        "listen_time_min",
        "interaction_load",
        "seek_pause_ratio",
        "replay_pause_ratio",
        "completion_gap",
    ]

    preferred_categorical = [
        "grade",
        "topic",
        "unit",
        "visually_impaired_type",
    ]

    numeric_features = [c for c in preferred_numeric if c in df.columns]
    categorical_features = [c for c in preferred_categorical if c in df.columns]

    X = df[numeric_features + categorical_features].copy()
    y = df["difficulty_label"].astype(int)

    return X, y, numeric_features, categorical_features


def build_preprocessor(numeric_features: List[str], categorical_features: List[str]) -> ColumnTransformer:
    num = [
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ]
    cat = [
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ]

    return ColumnTransformer(
        transformers=[
            ("num", ImbPipeline(steps=num), numeric_features),
            ("cat", ImbPipeline(steps=cat), categorical_features),
        ]
    )


def build_models(preprocessor: ColumnTransformer, use_smote: bool = True) -> Dict[str, ImbPipeline]:
    steps_common = [("preprocessor", preprocessor)]
    if use_smote:
        # SMOTE requires numeric features after preprocessing, imblearn pipeline handles it.
        # Note: SMOTE runs after preprocessing step output.
        steps_common.append(("smote", SMOTE(random_state=42)))

    models: Dict[str, ImbPipeline] = {}

    models["logistic_regression"] = ImbPipeline(
        steps=[
            *steps_common,
            ("clf", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)),
        ]
    )

    models["random_forest"] = ImbPipeline(
        steps=[
            *steps_common,
            ("clf", RandomForestClassifier(
                n_estimators=400,
                max_depth=12,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=42,
            )),
        ]
    )

    if XGBOOST_AVAILABLE:
        models["xgboost"] = ImbPipeline(
            steps=[
                *steps_common,
                ("clf", XGBClassifier(
                    n_estimators=400,
                    max_depth=5,
                    learning_rate=0.06,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    reg_lambda=1.0,
                    objective="binary:logistic",
                    eval_metric="logloss",
                    random_state=42,
                )),
            ]
        )

    return models


# =========================================================
# Cross-validation evaluation
# =========================================================
def get_probabilities(model: ImbPipeline, X: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)[:, 1]
    # fallback
    pred = model.predict(X)
    return pred.astype(float)


def evaluate_cv(
    model_name: str,
    model: ImbPipeline,
    X: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5,
) -> Dict[str, float]:
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    accs, baccs, f1macs, praucs, rocaucs = [], [], [], [], []

    for fold, (train_idx, test_idx) in enumerate(skf.split(X, y), start=1):
        X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
        y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]

        model.fit(X_tr, y_tr)
        y_pred = model.predict(X_te)
        y_prob = get_probabilities(model, X_te)

        accs.append(accuracy_score(y_te, y_pred))
        baccs.append(balanced_accuracy_score(y_te, y_pred))
        f1macs.append(f1_score(y_te, y_pred, average="macro", zero_division=0))

        praucs.append(average_precision_score(y_te, y_prob))
        # ROC-AUC only valid if both classes exist in fold
        if len(np.unique(y_te)) > 1:
            rocaucs.append(roc_auc_score(y_te, y_prob))
        else:
            rocaucs.append(np.nan)

    def mean_std(arr: List[float]) -> Tuple[float, float]:
        a = np.array(arr, dtype=float)
        return float(np.nanmean(a)), float(np.nanstd(a))

    acc_m, acc_s = mean_std(accs)
    bacc_m, bacc_s = mean_std(baccs)
    f1_m, f1_s = mean_std(f1macs)
    pr_m, pr_s = mean_std(praucs)
    roc_m, roc_s = mean_std(rocaucs)

    out = {
        "model": model_name,
        "accuracy_mean": acc_m, "accuracy_std": acc_s,
        "balanced_accuracy_mean": bacc_m, "balanced_accuracy_std": bacc_s,
        "f1_macro_mean": f1_m, "f1_macro_std": f1_s,
        "pr_auc_mean": pr_m, "pr_auc_std": pr_s,
        "roc_auc_mean": roc_m, "roc_auc_std": roc_s,
    }
    return out


def save_comparison_plot(df: pd.DataFrame) -> None:
    # Plot mean values for key metrics
    metrics = ["balanced_accuracy_mean", "f1_macro_mean", "pr_auc_mean", "roc_auc_mean"]
    ax = df.set_index("model")[metrics].plot(kind="bar", figsize=(10, 6))
    ax.set_title("Cross-Validation Model Comparison")
    ax.set_ylabel("Score (mean)")
    ax.set_ylim(0, 1)
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "model_comparison.png", dpi=220)
    plt.close()


def save_final_curves_and_cm(best_name: str, best_model: ImbPipeline, X_test: pd.DataFrame, y_test: pd.Series) -> None:
    y_pred = best_model.predict(X_test)
    y_prob = get_probabilities(best_model, X_test)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm)
    disp.plot()
    plt.title(f"Confusion Matrix (holdout) - {best_name}")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / f"{best_name}_confusion_matrix_holdout.png", dpi=220)
    plt.close()

    # ROC curve
    if len(np.unique(y_test)) > 1:
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        auc = roc_auc_score(y_test, y_prob)
        plt.figure()
        plt.plot(fpr, tpr, label=f"ROC-AUC={auc:.3f}")
        plt.plot([0, 1], [0, 1], linestyle="--")
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title(f"ROC Curve (holdout) - {best_name}")
        plt.legend(loc="lower right")
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / f"{best_name}_roc_curve_holdout.png", dpi=220)
        plt.close()

    # PR curve
    precision, recall, _ = precision_recall_curve(y_test, y_prob)
    ap = average_precision_score(y_test, y_prob)
    plt.figure()
    plt.plot(recall, precision, label=f"PR-AUC={ap:.3f}")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title(f"Precision-Recall Curve (holdout) - {best_name}")
    plt.legend(loc="lower left")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / f"{best_name}_pr_curve_holdout.png", dpi=220)
    plt.close()


# =========================================================
# Main
# =========================================================
def main() -> None:
    print("Loading datasets...")
    students, lessons, features = load_datasets()

    print("Merging datasets...")
    df = merge_datasets(students, lessons, features)

    print("Creating label (quantile method)...")
    df = create_difficulty_label_quantile(df)

    print("Engineering features...")
    df = engineer_features(df)

    print("Selecting features...")
    X, y, numeric_features, categorical_features = select_features(df)

    print(f"Dataset shape: {df.shape}")
    print(f"Feature matrix shape: {X.shape}")
    print("Class distribution (counts):")
    print(y.value_counts())

    # Preprocessor + models
    preprocessor = build_preprocessor(numeric_features, categorical_features)

    # SMOTE is usually helpful here, keep True for research version
    models = build_models(preprocessor, use_smote=True)

    # Cross-validation results
    print("\nRunning Stratified 5-fold cross-validation...")
    cv_rows = []
    for name, model in models.items():
        row = evaluate_cv(name, model, X, y, n_splits=5)
        cv_rows.append(row)
        print(
            f"{name}: "
            f"F1-macro={row['f1_macro_mean']:.3f}±{row['f1_macro_std']:.3f}, "
            f"BalAcc={row['balanced_accuracy_mean']:.3f}±{row['balanced_accuracy_std']:.3f}, "
            f"PR-AUC={row['pr_auc_mean']:.3f}±{row['pr_auc_std']:.3f}"
        )

    cv_df = pd.DataFrame(cv_rows).sort_values("f1_macro_mean", ascending=False)
    cv_df.to_csv(OUTPUT_DIR / "cv_results.csv", index=False)
    save_comparison_plot(cv_df)

    # Pick best by F1-macro mean
    best_name = cv_df.iloc[0]["model"]
    best_model = models[str(best_name)]

    print(f"\nBest model by CV F1-macro: {best_name}")

    # Holdout evaluation for curves and saved model
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    print("Fitting best model on train split...")
    best_model.fit(X_train, y_train)

    # Save best model
    model_path = OUTPUT_DIR / f"best_model_{best_name}.joblib"
    joblib.dump(best_model, model_path)
    print(f"Saved best model to: {model_path}")

    # Save holdout curves and confusion matrix
    save_final_curves_and_cm(str(best_name), best_model, X_test, y_test)

    # Save metadata
    metadata = {
        "target": "difficulty_label (quantile-based)",
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "cv_selection_metric": "f1_macro_mean",
        "best_model": str(best_name),
        "records": int(len(df)),
        "saved_model_path": str(model_path),
    }
    with open(OUTPUT_DIR / "training_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"All outputs saved to: {OUTPUT_DIR}")
    print("Done.")


if __name__ == "__main__":
    main()