# AI-Based Confidence & Presentation Performance Analyzer

> An AI-powered presentation performance analyzer and targeted weakness repair platform built for hackathons, SIH, and professional communication coaching.

[![Tech Stack](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-blue.svg)](#frontend)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20Socket.IO-green.svg)](#backend)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Python%20%7C%20OpenCV%20%7C%20MediaPipe-purple.svg)](#ai-engine)

---

## 🌟 Overview

The **AI-Based Confidence Analyzer** evaluates presentation recordings (both real-time webcam/mic rehearsals and uploaded video files) to assess observable delivery performance. Rather than providing a vague, unhelpful overall score, the system pinpoints the **exact timestamp of weak performance**, explains what went wrong, generates a specific 30-second repair exercise, and measures concrete improvement with a **side-by-side Before vs. After comparison**.

---

## 💡 The Core Differentiating Innovation

```
FULL PRESENTATION
        ↓
ANALYZE VIDEO + AUDIO
        ↓
FIND WEAK SECTION (e.g. 04:23 – 04:51)
        ↓
DIAGNOSE EXACT PROBLEMS (Low eye contact + 4 filler words + 168 WPM)
        ↓
GENERATE TARGETED REPAIR EXERCISE
        ↓
PRACTICE THAT EXACT 30s SECTION
        ↓
RE-ANALYZE PRACTICE ATTEMPT
        ↓
BEFORE vs AFTER COMPARISON
        ↓
MEASURED & VISIBLE IMPROVEMENT (Eye contact: 52% → 76%, Fillers: 4 → 1)
```

> **“Don’t just tell the user what went wrong. Show them exactly where it happened, help them practice that specific section, and measure whether they actually improved.”**

---

## 📊 10 Observable Presentation Metrics

### 👁️ Visual Performance Factors
1. **Eye Contact**: Iris/pupil gaze tracking vs. camera center, detecting gaze drops and audience engagement.
2. **Facial Expression**: Engagement variance, smiling metrics, and expressive delivery animation.
3. **Head Position**: 3D orientation (pitch, yaw, roll), detecting looking down at notes or looking away sideways.
4. **Body Posture**: Shoulder slope alignment, vertical spinal stability, and slouching/leaning detection.
5. **Hand Gestures**: Hand elevation and movement frequency, distinguishing natural gesturing from rigidity or flailing.
6. **Body Movement**: Torso displacement and stability, tracking fidgeting/swaying vs. controlled dynamic presence.

### 🎙️ Audio & Speech Factors
7. **Voice / Volume**: Energy envelope, volume consistency across sections, and vocal projection.
8. **Speaking Speed**: Acoustic word segmentation calculating Words Per Minute (WPM) (130–155 WPM optimal).
9. **Pauses & Silence**: Counting deliberate sentence pauses vs. awkward long silences (>2.0s).
10. **Filler Words**: Pinpointing exact occurrences and timestamps of *"um"*, *"uh"*, *"like"*, *"you know"*, *"basically"*, *"actually"*.

---

## 🏗️ System Architecture

```
Ai_confidence_analyzer/
├── frontend/               # React + Vite + Tailwind CSS Single Page Application
│   ├── src/
│   │   ├── components/     # MetricCard, TimelineChart, WeakSectionCard, ComparisonTable, StatusTracker
│   │   ├── context/        # AuthContext, SocketContext
│   │   ├── pages/          # Landing, Dashboard, Presentation, Upload, Results, Practice, History, Settings
│   │   └── services/       # Axios API client & WebSocket listeners
│   ├── package.json
│   └── vite.config.js
├── backend/                # Node.js + Express + Socket.IO REST API
│   ├── config/             # Database connection & embedded store fallback
│   ├── controllers/        # Auth, Presentation, Video, Analysis, WeakSection, Practice, History
│   ├── middleware/         # JWT Auth, Multer upload validator
│   ├── models/             # Mongoose schemas + Repository adapter
│   ├── routes/             # REST endpoints
│   ├── services/           # Python Bridge, AI Feedback Generator, Comparison Engine
│   ├── server.js           # Server entrypoint (Port 5000)
│   └── package.json
├── ai_engine/              # Python Computer Vision & Speech Intelligence Pipeline
│   ├── visual/             # Eye contact, Facial expression, Head position, Posture, Hands, Body
│   ├── audio/              # Voice energy, Pause detector, Speech transcription, Filler words
│   ├── scoring/            # Confidence scorer, Timestamped weak section detector
│   ├── analyze_presentation.py # CLI analyzer with real-time JSON progress streaming
│   └── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (Tested on v24)
- **Python**: 3.10+ (Tested on 3.14)
- **Git**

### Installation

1. **Clone repository & install Python dependencies:**
   ```bash
   pip install -r ai_engine/requirements.txt
   ```

2. **Install Backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You can start both backend and frontend concurrently:

```bash
# In project root:
npm start
```

Or run them individually in two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

Open your browser at: **`http://localhost:3000`**

---

## 📡 API Endpoints Reference

### Authentication
- `POST /api/auth/register` — Register new user account.
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET  /api/auth/me` — Retrieve current authenticated profile.

### Presentations & Video Uploads
- `POST /api/presentations` — Create presentation session from live recording or upload.
- `GET  /api/presentations` — List all presentations for current user.
- `GET  /api/presentations/:id` — Retrieve full presentation analysis, metrics, and weak sections.
- `DELETE /api/presentations/:id` — Delete presentation and associated artifacts.
- `POST /api/videos/upload` — Multipart video file upload (MP4, MOV, WEBM, AVI).

### Analysis & Real-Time Tracking
- `POST /api/analysis/start` — Trigger Python multi-modal analysis.
- `GET  /api/analysis/:id` — Get analysis result object.
- `GET  /api/analysis/:id/status` — Real-time progress percentage and step query.

### Weak Sections & Targeted Practice
- `GET  /api/presentations/:id/weak-sections` — List detected weak sections with start/end timestamps.
- `GET  /api/weak-sections/:id` — Get single weak section with diagnosis and repair instruction.
- `POST /api/practice/start` — Initialize practice session.
- `POST /api/practice/:id/analyze` — Re-analyze practice attempt video and generate Before vs After diff.
- `GET  /api/practice/:id/comparison` — Retrieve comparison table and improvement evaluation.

### History & Progression
- `GET  /api/history` — Chronological history with weak-section repair counts.
- `GET  /api/history/comparison` — Score progression curves across sessions.

---

## 🔒 Observability & Ethical Disclaimer

> [!NOTE]
> All confidence and delivery scores generated by this system represent **Observable Presentation Performance Behaviors** (e.g. eye contact percentage, speech rate in WPM, posture stability, and filler words frequency). The system does **not** scientifically measure or diagnose psychological traits, mental anxiety, medical conditions, or cognitive abilities.

---

## 🏆 Hackathon & SIH Highlights

- **Zero Artificial Recording Limit**: Full support for realistic, multi-minute presentations.
- **Resilient Fallback Storage**: Runs anywhere without requiring a running MongoDB daemon.
- **Instant Webcam Practice Studio**: Embedded recording studio specifically for 30-second weak section repair.
- **WebSocket Streaming**: Live visual feedback steps during video analysis.
- **Side-by-Side Progression**: Proves that coaching and targeted rehearsal actually work.
#   A i _ C o n f i d e n c e _ A n a l y z e r  
 