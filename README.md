# VisionBridgeMobile

# 👁️ VisionBridge Mobile  
### Gesture-Enabled Learning Platform for Sri Lankan Visually Impaired Students in ICT O/L Education  
**Project ID:** 25-26J-230  

---

## 📘 Overview
**VisionBridge Mobile** is a cross-platform mobile learning solution designed to empower **visually impaired Ordinary Level ICT students** in Sri Lanka.  
It introduces a **multi-sensory interaction model** combining **custom gestures**, **vibration feedback**, and **audio-based content delivery** to promote independent learning and accessibility.

The platform’s design goes beyond traditional screen readers by enabling geometric gesture controls, haptic cues, and non-verbal sound effects that enhance usability, reduce error rates, and improve engagement.

It includes:
- A **mobile app** for visually impaired students.  
- A **teacher dashboard** for lesson uploads and progress tracking.  
- An **accessible content builder** for converting ICT syllabus material.  
- An **audio quiz engine** for interactive self-learning.  

---

## 🏗️ System Architecture

### 🔹 Overall System Architecture
![System Architecture](assets/images/system.png)



## ⚙️ Technologies and Dependencies

| Category | Technologies / Tools |
|-----------|----------------------|
| **Mobile App** | React Native (TypeScript), SQLite |
| **Backend / API** | Node.js / Express.js |
| **Teacher Dashboard** | React.js, Firebase or AWS |
| **Audio & TTS** | React Native TTS, Expo AV |
| **Haptic Feedback** | React Native Haptic Feedback API |
| **Development Tools** | Visual Studio Code, Git, GitHub |
| **Project Management** | Microsoft Planner |
| **Accessibility Compliance** | WCAG Standards, GDPR |
| **Testing** | Manual usability tests with visually impaired students |

---

## 🎯 Project Objectives

### 🧩 Main Objective
To develop an accessible gesture-enabled mobile learning platform for visually impaired ICT learners, combining **gesture recognition**, **vibration feedback**, and **audio narration** to promote independent, inclusive education.

### 🧩 Specific Objectives
- Implement **gesture-based navigation** with geometric commands.  
- Provide **multi-modal feedback** (haptic + audio + sound effects).  
- Enable **audio-first learning** through lessons and quizzes.  
- Allow teachers to upload and analyze content and performance data.  
- Facilitate **offline access** with local database storage.  

---

## 👨‍💻 Individual Components and Responsibilities

### 🟦 **H.E.M Thathsara (IT22322562) — Custom Gestures, Haptics & Sound Effects**
**Responsibilities:**
- Implement basic gestures: swipe, tap, long-press, pan.  
- Add custom geometric gestures (circle, triangle, rectangle).  
- Integrate haptic feedback:  
  - Short buzz = next  
  - Long buzz = error  
  - Double buzz = selection  
- Add sound cues (chime = correct, low tone = wrong, click = navigation).  

**Novelty:**
- Introduces a new **gesture vocabulary** beyond standard swipe/tap.  
- Combines vibration + audio + effects for **multi-sensory learning**.  
- Tailors the interaction model to ICT education, not generic accessibility.  

---

### 🟩 **Karunarathne K.P.P.T (IT22926876) — Lesson Player & Audio Quiz Engine**
**Responsibilities:**
- Build **Lesson Player** with TTS narration and navigation via gestures.  
- Implement **Audio Quiz Engine** supporting spoken questions and gesture-based answers.  
- Provide adaptive reinforcement (repeat wrong questions, hints, encouragement).  
- Ensure offline TTS support with pre-generated audio.  

**Novelty:**
- Integrates **syllabus-aware spoken content** (ICT-specific).  
- Unique **audio-first quiz engine** allowing blind learners full autonomy.  
- Combines **lesson + quiz** in a seamless audio interface.  

---

### 🟨 **Navanjana L.A.V (IT22604712) — Accessible Learning Content Builder**
**Responsibilities:**
- Convert teacher-uploaded ICT syllabus into **structured, accessible content**.  
- Segment lessons into **audio-friendly chunks** with summaries and expansions.  
- Provide alt-texts, summarized tables, and metadata for TTS readability.  

**Novelty:**
- Introduces a **syllabus-aware content transformation pipeline**.  
- Uses adaptive segmentation for **optimized audio-first learning**.  
- Ensures **WCAG-compliant** educational content delivery.  

---

### 🟧 **Vidanapathirana R.T (IT22627896) — Teacher Dashboard & Analytics**
**Responsibilities:**
- Develop **Teacher Web Dashboard** for lesson uploads and student registration.  
- Visualize learner progress (quiz attempts, completion time, weak areas).  
- Generate content packages consumed by the mobile app.  

**Novelty:**
- First **analytics module** designed specifically for visually impaired learning data.  
- Enables early teacher intervention based on learner behavior metrics.  
- Helps identify students needing additional support.  

---

## 🔄 Pull Request History

| PR No | Description | Author | Date | Status |
|-------|--------------|--------|------|--------|
| #1 | Added README and repo setup | @Menusha2k1  | 2025-10-23 | ✅ Merged |



## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```
