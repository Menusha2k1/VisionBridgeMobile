import pandas as pd
import joblib
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
ROOT_DIR = ML_DIR.parent

DATA_DIR = ROOT_DIR / "assets" / "datasets"
MODEL_PATH = ROOT_DIR / "assets" / "model" / "best_model_xgboost.joblib"
OUTPUT_PATH = ROOT_DIR / "assets" / "model" / "student_predictions.csv"

STUDENTS_FILE = DATA_DIR / "students_dataset.csv"
LESSON_FILE = DATA_DIR / "student_lesson.csv"


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    for col in ["pause_count", "replay_count", "seek_back_seconds", "total_listen_time_sec", "completion_rate"]:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    df["listen_time_min"] = df["total_listen_time_sec"] / 60.0
    df["interaction_load"] = df["pause_count"] + df["replay_count"]
    df["seek_pause_ratio"] = df["seek_back_seconds"] / (df["pause_count"] + 1)
    df["replay_pause_ratio"] = df["replay_count"] / (df["pause_count"] + 1)
    df["completion_gap"] = 1.0 - df["completion_rate"]

    return df


def minmax(series: pd.Series) -> pd.Series:
    s = pd.to_numeric(series, errors="coerce").fillna(0)
    min_v = s.min()
    max_v = s.max()
    if max_v == min_v:
      return pd.Series([0.0] * len(s), index=s.index)
    return (s - min_v) / (max_v - min_v)


def compute_bldi(df: pd.DataFrame) -> pd.DataFrame:
    """
    Behavioral Learning Difficulty Index (0 to 100)

    Higher score = greater learning difficulty based on audio-learning behavior.
    """
    df = df.copy()

    pause_n = minmax(df["pause_count"])
    replay_n = minmax(df["replay_count"])
    seek_n = minmax(df["seek_back_seconds"])
    completion_gap_n = minmax(df["completion_gap"])

    df["bldi_score"] = (
        0.25 * pause_n
        + 0.25 * replay_n
        + 0.20 * seek_n
        + 0.30 * completion_gap_n
    ) * 100

    df["bldi_score"] = df["bldi_score"].round(1)

    def bldi_band(v: float) -> str:
        if v >= 70:
            return "HIGH"
        if v >= 40:
            return "MEDIUM"
        return "LOW"

    df["bldi_band"] = df["bldi_score"].apply(bldi_band)
    return df


def main():
    print("Loading model...")
    model = joblib.load(MODEL_PATH)

    print("Loading datasets...")
    students = normalize_columns(pd.read_csv(STUDENTS_FILE))
    lessons = normalize_columns(pd.read_csv(LESSON_FILE))

    student_id_students = "student_id" if "student_id" in students.columns else "id"
    student_id_lessons = "student_id" if "student_id" in lessons.columns else "id"

    df = lessons.merge(
        students,
        left_on=student_id_lessons,
        right_on=student_id_students,
        how="left",
        suffixes=("", "_student"),
    )

    df = engineer_features(df)
    df = compute_bldi(df)

    expected_cols = [
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
        "grade",
        "topic",
        "unit",
        "visually_impaired_type",
    ]

    for c in expected_cols:
        if c not in df.columns:
            df[c] = 0 if c not in ["topic", "unit", "visually_impaired_type"] else "unknown"

    X = df[expected_cols].copy()

    print("Generating predictions...")
    df["predicted_difficulty"] = model.predict(X)
    df["difficulty_probability"] = model.predict_proba(X)[:, 1]

    def risk_level(p: float) -> str:
        if p >= 0.80:
            return "HIGH"
        if p >= 0.55:
            return "MEDIUM"
        return "LOW"

    df["risk_level"] = df["difficulty_probability"].apply(risk_level)

    keep_cols = []
    for c in [
        "student_id",
        "lesson_id",
        "full_name",
        "grade",
        "topic",
        "unit",
        "difficulty_probability",
        "predicted_difficulty",
        "risk_level",
        "bldi_score",
        "bldi_band",
    ]:
        if c in df.columns:
            keep_cols.append(c)

    out = df[keep_cols].copy() if keep_cols else df.copy()
    out.to_csv(OUTPUT_PATH, index=False)

    print("Predictions with BLDI saved to:", OUTPUT_PATH)


if __name__ == "__main__":
    main()