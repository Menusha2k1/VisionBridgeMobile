# 📚 Lesson Player & Audio Quiz Engine  
### VisionBridge – Assistive Learning Platform for Visually Impaired Students  

**Contributor:** Karunarathne K.P.P.T (IT22926876)

---

## 1. 🎯 Component Overview

This component implements an **audio-first learning and assessment module** 
for visually impaired **G.C.E. O/L ICT students**.

The system provides a fully eyes-free learning environment where lessons, navigation, and assessments are delivered entirely through speech interaction and accessible controls.

The module integrates two tightly coupled subsystems:

### ✔ Lesson Player

The lesson player delivers structured ICT lessons using Text-to-Speech narration.

- Sequential narration of lessons
- Structured **topic → unit → segment** progression
- Reads lesson content aloud using Text-to-Speech (TTS)
- Gesture-based navigation (next / previous / repeat)
- Resume lesson playback after interruption
- Automatic **end-of-lesson → quiz transition**

### ✔ AI-Adaptive Audio Quiz Engine

The quiz engine provides fully audio-driven multiple-choice assessments.

- Fully audio-only interactive quizzes  
- Four-option MCQs read aloud  
- Double-tap answer submission
- Adaptive session generation
- Hint generation
- Reinforcement-inspired repetition of incorrect questions 
- Weak-area focused practic
e sessions 
- Confidence-aware learning analytics  
- Persistent learner progress tracking

This enables **fully eyes-free learning and testing**.

---

## 2. 🧭 Position in Whole System

| System Module             | Responsibility               | How This Component Connects       |
| ------------------------- | ---------------------------- | --------------------------------- |
| Content & Lesson Designer | Creates ICT syllabus content | Consumes exported lesson JSON     |
| Audio Delivery Module     | Handles speech output        | Uses Expo TTS engine              |
| Quiz Evaluation Engine    | Evaluates MCQ answers        | Implemented within this component |
| Progress Tracking System  | Learner attempt history      | Implemented with AsyncStorage     |
| Accessibility & Gestures  | Interaction layer            | Gesture-ready architecture        |


**This component covers both content delivery and assessment entirely via audio.**

---

## 3. 🚀 Key Research Contributions

- ✔ Audio-only interface for visually impaired learners  
- ✔ Seamless lesson → quiz workflow  
- ✔ Reinforcement-learning inspired repetition model  
- ✔ Adaptive quiz session generation  
- ✔ Hint generation using Gemini AI  
- ✔ Weak-area focused personalization  
- ✔ Offline-first fully working prototype  
- ✔ Hybrid audio architecture (TTS + recorded)  
- ✔ Gesture-first usability concept  

---

## 4. 🗂 Dataset Design

### 4.1 Lesson Dataset (Structured Lessons)

**File:**  
`assets/data/lessons_ict_ol.json`

**Structure includes:**
- Course level
- Grade
- Lesson
- Segments (speakable units)

**Each lesson contains:**
- title  


.
- objective  
- category (e.g., Networking, Security)  
- grade (10/11)  
- ordered segments  
- text spoken via TTS  

---

### 4.2 Quiz Dataset (Question Bank)

**File:**  
`assets/data/large_lesson.json`

**Contains:**
- 10,000+ structured ICT MCQs (expandable)
- category mapping
- grade mapping
- hints
- correct answers

Supports:
- practice
- topic drills
- quick revision
- mock exams
- weak-area sessions

---

## 5. 🧠 Models / Engines Implemented

Although not deep learning models, the component implements **algorithmically intelligent engines**:

### ✔ Engagement Engine
- Detects engagement level  
- Adjusts session length and difficulty  

### ✔ Weak-Area Engine
- Tracks wrong answers  
- Schedules repetition  

### ✔ Reinforcement Repetition Engine
- Repeats incorrect questions  
- Gives adaptive hints  
- Prevents rapid skipping  

### ✔ Question Selection Engine
- Balanced topic sampling  
- Difficulty-adaptive selection  

### ✔ Gemini-Powered Hint Generator
- Provides short targeted hints  
- Avoids revealing full answer  

### ✔ Hybrid Audio Engine (Architecture-ready)
- TTS implemented  
- Pre-recorded audio planned  

---

## 6. 🛠 Technologies Used

| Area | Technology |
|------|------------|
| Mobile Framework | React Native + Expo |
| Navigation | Expo Router |
| Text-to-Speech | expo-speech |
| Gesture Handling | react-native-gesture-handler |
| State Logic | TypeScript controllers |
| AI Integration | Gemini API |
| Local Storage | AsyncStorage |
| Dataset Representation | JSON |

---

## 7. 🧩 System Architecture

### Lesson Player Pipeline
Lesson JSON → LessonRepository → LessonSequencer → AudioTtsEngine → Spoken Output + Large Text

### Quiz Engine Pipeline
Question Bank JSON → QuizRepository → SessionSelector → Question Scheduler → Answer Evaluator → Feedback + Reinforcement

---

## 8. 🧑‍🏫 Gestures (designed / mapped)

| Gesture | Action |
|--------|--------|
| Swipe Right | Next segment |
| Swipe Left | Previous segment |
| Double-tap | Repeat |
| Long press | Hint |
| Swipe Up | Answer A |
| Swipe Down | Answer B |
| Circle gesture | Submit |

Current prototype uses buttons; **gesture layer is ready for binding**.

---

## 9. ✔ Completion Status

### ✅ Completed
- Dataset architecture  
- Lesson player functionality  
- Quiz engine  
- Answer evaluation  
- TTS narration  
- Session types:
  - Practice  
  - Topic Drill  
  - Quick Revision  
  - Mock Exam  
  - Weak-area practice  
- Hint system (Gemini + fallback)
- Progress persistence  
- Lesson → quiz transition  
- Separate **Lesson Mode / Quiz Mode** UI  

### 🟡 Partially Completed
- Engagement detection model  
- Gesture inputs  
- Hybrid audio playback frame  
- Full dataset population  
- UI animations  
- Session statistics dashboard  
- Result summary page  

### 🔴 Remaining
- Bind gesture controls fully  
- Generate full grade 10 & 11 dataset  
- Store quiz result history  
- Confidence scoring feedback  
- Leaderboard / gamification  
- Text explanation after answers  
- Export report PDF / audio  
- True reinforcement Q-learning (optional)  

---

## 10. ▶ How to Run

```bash
npm install
npx expo start
```

## 11. 🧭 Why This Is Novel

- Blind-friendly end-to-end system
- Adaptive feedback loop
- Weak-area reinforcement
- Multimodal hint generation
- Hybrid TTS + recorded audio readiness
- Works offline

## 12. 🌱 Future Improvements

- Sinhala / Tamil TTS voices
- Emotion-aware engagement detection
- Reinforcement learning based scheduling
- Voice-based answering
- Teacher analytics dashboard

## ✔ Final Summary