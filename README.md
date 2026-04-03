# ExitPrep AI Coach

**AI-powered study planning** for Ethiopian university exit exam preparation.

This document covers the **AI Coach** feature: behavior, usage, architecture, configuration, and troubleshooting.

---

## Table of contents

| Section | Description |
|--------|-------------|
| [Features](#features) | What the AI Coach does |
| [Using AI Coach](#using-ai-coach) | Where to find it in the app |
| [Architecture](#architecture) | Frontend, backend, and fallback behavior |
| [API reference](#api-reference) | Endpoints and payloads |
| [Environment variables](#environment-variables) | Backend and frontend configuration |
| [Local setup](#local-setup) | Run client and server locally |
| [Troubleshooting](#troubleshooting) | Common issues |
| [Repository layout](#repository-layout) | Project links |

---

## Features

| Capability | Details |
|------------|---------|
| **Personalized plans** | Builds a weekly-style study plan from student performance data |
| **Weak-area focus** | Detects weak subjects/topics and prioritizes them |
| **Data-driven** | Uses real attempt history and course/topic accuracy |
| **Regeneration** | Students can refresh recommendations after new practice |
| **Resilient** | Deterministic fallback when external AI is unavailable |

---

## Using AI Coach

### In the web app

1. Sign in as a **student**.
2. Open **Workspace → Insights**.
3. Locate the **AI Coach** section.
4. Click **Generate Plan**.

### What you see

| Output | Description |
|--------|-------------|
| Recommendation text | Personalized study guidance |
| Weak-subject chips | Subjects flagged for extra focus |
| Timestamp | When the plan was generated |

---

## Architecture

### Frontend

- Dashboard UI sends the AI recommendation request.
- Request includes `subjectScores` derived from topic accuracy.
- UI renders the returned recommendation and weak subjects.

### Backend

| Step | Behavior |
|------|----------|
| Route | `POST /api/ai/dashboard` |
| Controller | Computes subject scores and weak subjects |
| Service | Calls Hugging Face when configured |
| Persistence | Stores response in the analytics collection and returns it to the client |

### Fallback behavior

If `HUGGING_FACE_API_KEY` is missing or the model call fails, the backend returns a **local, deterministic** recommendation so students still receive actionable AI Coach output without depending on an external API.

---

## API reference

All AI endpoints require **JWT authentication**.

### `POST /api/ai/dashboard`

Generates a personalized recommendation for the current student (or an admin-selected student).

**Request body (example)**

```json
{
  "subjectScores": {
    "Object Oriented Programming": 2.8,
    "Database Systems": 3.6
  }
}
```

**Response (example)**

```json
{
  "studentId": "...",
  "weakSubjects": ["Object Oriented Programming"],
  "subjectScores": {
    "Object Oriented Programming": 2.8,
    "Database Systems": 3.6
  },
  "recommendation": "Focus this week on Object Oriented Programming...",
  "analyticsId": "..."
}
```

### `POST /api/ai/activity`

Appends student activity for AI and analytics pipelines.

---

## Environment variables

### Backend

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | Yes | Database connection |
| `JWT_SECRET` | Yes | Signing key for tokens |
| `HUGGING_FACE_API_KEY` | No | Enables Hugging Face model calls |
| `HUGGING_FACE_MODEL` | No | Default: `google/flan-t5-small` |

### Frontend

| Variable | Example | Notes |
|----------|---------|--------|
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL for API requests |

---

## Local setup

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Verify AI Coach

1. Log in.
2. Open **Insights**.
3. In **AI Coach**, click **Generate Plan**.

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| **AI Coach not visible** | Use **Workspace → Insights**; refresh the client after pull or build changes. |
| **Request fails** | Confirm `VITE_API_URL` points at the backend; ensure JWT/session is valid; inspect backend logs for `/api/ai/dashboard` errors. |
| **Generic recommendation** | Expected when `HUGGING_FACE_API_KEY` is unset. Set the key for model-generated text. |

---

## Repository layout

| Resource | Path |
|----------|------|
| Frontend (Vite + React) | [`client/`](client) |
| Backend (Express API) | [`server/`](server) |
| Deployment blueprint | [`render.yaml`](render.yaml) |
