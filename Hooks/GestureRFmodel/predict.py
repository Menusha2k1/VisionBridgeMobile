import pandas as pd
import joblib
import os
import time
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

# 1. Loading the trained model
try:
    model = joblib.load('gesture_RF_model.pkl')
except FileNotFoundError:
    print("Error: Trained model file 'gesture_model.pkl' not found!")
    exit()

clear_screen()
print("===============================================")
print("   GESTURE RECOGNITION SYSTEM - LIVE DEMO    ")
print("===============================================")
print(f"Dataset Source: gesture_data_hard.csv")
print(f"Model Loaded  : Random Forest (Tuned)")
print("Status        : Ready for Live Prediction")
print("-----------------------------------------------")

while True:
    try:
        print("\nEnter gesture parameters from the sensor data:")
        
        # Taking inputs
        dist_input = input("1. Levenshtein Distance (e.g. 2.5): ")
        ratio_input = input("2. Levenshtein Ratio (0.0 - 1.0): ")

        if not dist_input or not ratio_input:
            print("[System] Please enter both values.")
            continue

        dist = float(dist_input)
        ratio = float(ratio_input)

        # Processing...
        print("\n[System] Processing gesture sequence...", end="", flush=True)
        time.sleep(0.5) # Just for a realistic feel
        
        # Prediction logic
        input_data = pd.DataFrame([[dist, ratio]], columns=['dist', 'ratio'])
        pred = model.predict(input_data)[0]
        prob = model.predict_proba(input_data)[0][pred] * 100

        # Output Mapping
        categories = {
            0: "PRO (Student performs gesture correctly)",
            1: "INTERMEDIATE (Student is struggling slightly)",
            2: "BEGINNER (Student is highly struggling)"
        }

        print("\r" + " " * 40 + "\r", end="") # Clear processing line
        print("-" * 45)
        print(f"IDENTIFIED CATEGORY: {categories[pred]}")
        print(f"MODEL CONFIDENCE   : {prob:.2f}%")
        print("-" * 45)

    except ValueError:
        print("\n[Error] Invalid input. Please enter numbers.")
    except KeyboardInterrupt:
        print("\n\nSystem Shutdown... Bye!")
        break