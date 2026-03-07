# VisionBridge Mobile
## Teacher Dashboard and Learning Analytics Research Component
### AI-Powered Support System for Visually Impaired ICT Learners

---

# 1. Component Overview

This repository contains the implementation of the **Teacher Dashboard and Learning Analytics research component** of the **VisionBridge Mobile** project.

VisionBridge Mobile is an accessible mobile learning platform designed for **visually impaired students studying G.C.E. Ordinary Level ICT in Sri Lanka**. The student side of the application focuses on **audio-first learning**, gesture navigation, and accessible quizzes. This research component focuses on the **teacher-facing analytics system** that transforms learner interaction behaviour into actionable educational insights.

The purpose of this component is to help teachers:

• monitor learner engagement  
• identify struggling students early  
• detect weak topics  
• analyse learning behaviour patterns  
• generate research-level analytics reports  

The component integrates **machine learning predictions**, **learning analytics**, and a custom research metric called the **Behavioral Learning Difficulty Index (BLDI)**.

---

# 2. Research Context

## Research Title
Machine Learning Based Learning Difficulty Prediction and Behavioral Analytics for Visually Impaired ICT Learners in an Audio First Educational Environment

## Research Problem
Most accessible learning systems focus on delivering content but lack **intelligent teacher support tools** that can detect learning difficulties early.

Traditional dashboards typically show only descriptive metrics such as:

• scores  
• completion rates  
• attendance  

These metrics do not provide predictive insights about **which students are likely to struggle next**.

This research addresses that gap by introducing:

• predictive machine learning models  
• behavioural learning analytics  
• topic level risk detection  
• a custom difficulty index based on audio interaction behaviour  

---

# 3. Research Objectives

The main objectives of this research component are:

1. To collect behavioural interaction data from audio based learning sessions.
2. To engineer meaningful features from learner interaction patterns.
3. To train and compare multiple machine learning models to predict learner difficulty.
4. To design a teacher dashboard that visualizes predictive learning analytics.
5. To introduce a new metric called **Behavioral Learning Difficulty Index (BLDI)** that quantifies learner struggle in audio learning environments.

---

# 4. End to End System Pipeline

The teacher analytics component works through the following pipeline.

## Step 1 – Student Learning Interaction
Students interact with the audio lesson system.

Interaction signals include:

• pause frequency  
• replay behaviour  
• seek-back actions  
• listening duration  
• completion rate  

These signals capture **learning difficulty behaviour patterns**.

## Step 2 – Data Collection
Interaction events are stored in datasets:

assets/datasets/

• students_dataset.csv  
• student_lesson.csv  
• student_lesson_features.csv  

## Step 3 – Feature Engineering
The ML pipeline generates additional features such as:

• listen_time_min  
• interaction_load  
• replay_pause_ratio  
• seek_pause_ratio  
• completion_gap  

These engineered features help improve model prediction quality.

## Step 4 – Machine Learning Prediction
Three machine learning models are trained to classify learning difficulty.

Models trained:

• Logistic Regression  
• Random Forest  
• XGBoost  

The best model is selected based on evaluation metrics.

## Step 5 – Difficulty Prediction
The selected model generates predictions for each learner interaction:

• difficulty_probability  
• predicted_difficulty  
• risk_level  

## Step 6 – BLDI Computation
A custom **Behavioral Learning Difficulty Index** is calculated for each learner.

## Step 7 – Teacher Dashboard
The mobile dashboard visualizes:

• high risk learners  
• weak topics  
• engagement statistics  
• model evaluation results  
• BLDI analytics  

---

# 5. Machine Learning Model Training

## Training Script

The model training pipeline is implemented in:

ml/train_student_difficulty_models.py

This script performs:

• dataset loading  
• feature engineering  
• model training  
• cross validation  
• model comparison  
• model export  

## Models Compared

### Logistic Regression
A baseline interpretable model used to understand feature relationships.

### Random Forest
An ensemble decision tree model capable of capturing non-linear interactions.

### XGBoost
A gradient boosting model with strong predictive performance on structured data.

---

# 6. Model Evaluation

The models were evaluated using:

**Stratified 5 Fold Cross Validation**

Evaluation metrics used:

• Accuracy  
• Balanced Accuracy  
• F1 Macro  
• Precision Recall AUC  
• ROC AUC  

Final results:

Best Model: **XGBoost**

Performance metrics:

F1 Macro: 0.935  
Balanced Accuracy: 0.915  
PR AUC: 0.991  

These results demonstrate strong predictive performance for detecting learning difficulty.

---

# 7. Behavioral Learning Difficulty Index (BLDI)

## Motivation
Machine learning predictions alone can sometimes be difficult for teachers to interpret. Therefore this research introduces a composite difficulty score derived directly from learner behaviour.

## BLDI Formula

BLDI is calculated using normalized behavioural signals:

BLDI =  
0.25 × normalized pause_count  
+ 0.25 × normalized replay_count  
+ 0.20 × normalized seek_back_seconds  
+ 0.30 × normalized completion_gap  

The final score is scaled to a **0–100 range**.

## BLDI Interpretation

0 – 39 → Low Difficulty  
40 – 69 → Moderate Difficulty  
70 – 100 → High Difficulty  

This metric helps teachers quickly understand learner struggle without needing to interpret raw ML probabilities.

---

# 8. Implemented Teacher Dashboard Features

## Teacher Login
A simple authentication screen allowing access to the teacher module.

Demo credentials:

Email: teacher@visionbridge.lk  
Password: 1234

---

## Teacher Dashboard

The main dashboard shows high level learning analytics including:

• Total Students  
• High Risk Students  
• Average Risk Probability  
• Average Completion Rate  
• Average BLDI  

It also displays:

• ML Research Summary  
• Model Comparison Chart  
• Risk Distribution  
• Top Risk Topics  
• Students needing immediate attention  

---

## Students Page

The student analytics page displays:

• learner name  
• grade level  
• visual impairment type  
• lesson attempts  
• average completion rate  
• average listening time  
• most risky topic  
• ML difficulty probability  
• risk label  
• BLDI score  
• BLDI band  

This allows teachers to monitor individual learner progress.

---

## Weak Topics Page

The weak topics page helps identify:

• topics where learners struggle most  
• topic level difficulty patterns  
• intervention targets for teachers  

---

## Reports Page

The reports page summarizes the research outputs including:

• best performing ML model  
• F1 Macro score  
• Balanced Accuracy  
• PR AUC  
• high risk learners  
• average completion statistics  
• average BLDI score  

Teachers can export a **research summary report**.

---

## Lesson Upload Page

Teachers can simulate uploading lesson files.

Supported formats:

• PDF  
• DOCX  
• TXT  

The system generates:

• lesson segments  
• topic metadata  
• quiz mappings  
• offline learning packages

This simulates content preparation for the student mobile application.

---

## Settings Page

Teacher preferences include:

• weak topic alerts  
• weekly research reports  
• offline content packaging  
• audio feedback support  

---

# 9. Project Folder Structure

VisionBridgeMobile
│
├── assets
│ ├── datasets
│ │ ├── students_dataset.csv
│ │ ├── student_lesson.csv
│ │ └── student_lesson_features.csv
│ │
│ └── model
│ ├── best_model_xgboost.joblib
│ ├── student_predictions.csv
│ ├── cv_results.csv
│ ├── model_comparison.png
│ └── training_metadata.json
│
├── data
│ ├── analytics.ts
│ ├── predictions.ts
│ └── mlMetrics.ts
│
├── ml
│ ├── train_student_difficulty_models.py
│ ├── predict_students.py
│ └── requirements.txt
│
├── Screens
│ ├── StudentLogin.tsx
│ └── Teacher
│ ├── login.tsx
│ ├── Dashboard.tsx
│ ├── Students.tsx
│ ├── Reports.tsx
│ ├── WeakTopics.tsx
│ ├── LessonUpload.tsx
│ ├── Settings.tsx
│ ├── StudentRegistration.tsx
│ ├── useAnalytics.ts
│ ├── usePredictions.ts
│ └── components
│
├── utils
│ └── csv.ts
│
├── App.tsx
└── README.md

---

# 10. Running the Mobile Application

Install dependencies: npm install

Start the Expo development server: npx expo start -c

Open the application using:

• Expo Go mobile app  
• Android emulator  
• iOS simulator  

---

# 11. Running the Machine Learning Pipeline

Create Python virtual environment: python -m venv ml_env
Activate environment: ml_env\Scripts\activate

Install dependencies: cd ml
                      pip install -r requirements.txt

Train models: python train_student_difficulty_models.py

Generate predictions: python predict_students.py


This produces:

assets/model/student_predictions.csv

which is loaded by the mobile dashboard.

---

# 12. Demonstration Flow

For evaluation panels the system can be demonstrated in this order:

Step 1  
Open the Student Login screen.

Step 2  
Access the Teacher Login page.

Step 3  
Login with demo credentials.

Step 4  
Show the Teacher Dashboard analytics cards.

Step 5  
Open the Students page and demonstrate risk predictions and BLDI scores.

Step 6  
Open Weak Topics page to show topic difficulty analysis.

Step 7  
Open Reports page to explain ML evaluation results.

Step 8  
Explain the research novelty including the BLDI metric.

---

# 13. Research Contribution

This component demonstrates how **behavioral interaction signals from audio based learning environments** can be transformed into predictive analytics using machine learning.

The key research contributions include:

• integration of learning analytics and predictive ML models  
• comparison of three machine learning algorithms  
• development of a custom Behavioral Learning Difficulty Index  
• teacher facing mobile analytics dashboard for accessible education  

The system shows how accessible educational platforms can move beyond content delivery to provide **data driven intervention support for teachers**.

---

# 14. Limitations

Current limitations include:

• limited dataset size  
• prototype level teacher authentication  
• simulated lesson upload process  
• probability calibration may be improved with larger datasets  

---

# 15. Future Work

Potential improvements include:

• larger real world datasets  
• live backend integration  
• explainable AI visualizations  
• teacher intervention recommendations  
• longitudinal learner progress modelling  
• automated adaptive learning suggestions  

---

# 16. Author

VisionBridge Mobile Research Component  
Machine Learning Based Learning Difficulty Prediction System for Visually Impaired ICT Learners

---

# 17. Final Summary

This component implements a complete **teacher facing learning analytics system** for the VisionBridge Mobile platform. It combines accessibility focused educational design with machine learning based predictive analytics and introduces a novel Behavioral Learning Difficulty Index to support early intervention for visually impaired ICT learners.
