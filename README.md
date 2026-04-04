# ExitPrep AI Coach

**AI-powered study planning** for Ethiopian university exit exam preparation.

This document covers the **AI Coach** feature: behavior, usage, architecture, configuration, and troubleshooting.

---



## Table of contents

| Section | Description |
|--------|-------------|
| [Features](#features) | What the AI Coach does |
| [AI Implementation Plan](#ai-implementation-plan-exitprep-ethiopia) | Step-by-step build plan for AI features |
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
| **Uploaded-PDF AI Pack** | AI Hub can generate summary, quiz, and weekly plan from selected uploaded note content |

---

## AI Implementation Plan (ExitPrep Ethiopia)

Goal: make AI features easy for students, predictable for developers, and safe to run in production.

### 1. Define one AI service layer in backend


Backend:

1. Create one provider abstraction in server services, for example aiProvider.js.
2. Add two adapters: OpenAI adapter and Ollama adapter.
3. Select provider via env variable AI_PROVIDER with values openai or ollama.
4. Keep one common function callAI(taskType, prompt, context) so controllers do not depend on vendor APIs.

Frontend:

1. No provider-specific logic in client.
2. Client only calls your app APIs like /api/ai/summarize or /api/ai/quiz.

Why this matters:

- You can switch between Ollama and OpenAI without rewriting features.

### 2. Add AI endpoints by student task

Backend endpoints:

1. POST /api/ai/summarize for PDF and note summarization.
2. POST /api/ai/quiz for AI-generated quiz questions.
3. POST /api/ai/explain for answer explanations.
4. POST /api/ai/recommend for weak-topic recommendations.
5. POST /api/ai/study-plan for weekly plan generation.

Frontend pages:

1. Notes page calls summarize.
2. Practice Questions page calls quiz and explain.
3. Insights page calls recommend and study-plan.

### 3. Implement PDF and notes summarization

Backend:

1. Extract text from uploaded PDF or note body.
2. Chunk large text and summarize each chunk.
3. Merge chunk summaries into final concise summary.
4. Store summary with userId, subject, source file, and createdAt.

Frontend:

1. Add Summarize with AI button in Study Notes.
2. Show result in three tabs: Short Summary, Key Points, and Exam Tips.
3. Add Copy Summary button for quick reuse.

### 4. Implement AI-generated quiz questions

Backend:

1. Input: subject, topic, difficulty, number of questions.
2. Ask AI to return strict JSON with 4 options and one correctAnswer.
3. Validate shape before saving or returning.
4. Optionally save generated questions as category custom.

Frontend:

1. In Practice Questions add Generate AI Quiz panel.
2. Let students set topic and difficulty.
3. Display generated quiz in the same question UI used by existing questions.

### 5. Implement answer explanations for students

Backend:

1. Endpoint receives question, selectedAnswer, correctAnswer, and topic.
2. AI returns: why selected answer is wrong or right, why correct answer is correct, and one memory tip.
3. Keep responses short and supportive.

Frontend:

1. After each answer, show Explain with AI button.
2. Render explanation in simple card: Your choice, Correct answer, Why, Tip.

### 6. Implement weak-topic detection and recommendations

Backend:

1. Aggregate attempts by course and topic.
2. Compute accuracy and trend over recent attempts.
3. Mark weak topics where accuracy is below threshold, for example below 60 percent.
4. Send weak topics plus AI-generated actions: what to review first and practice count per topic.

Frontend:

1. In Insights keep Weak Areas list.
2. Add Recommended Actions list beside weak areas.
3. Add Start Practice button per weak topic to deep-link into quiz page.

### 7. Implement study plan generator

Backend:

1. Inputs: available hours per week, exam date, weak topics, preferred study time.
2. AI returns a 7-day plan with daily tasks and estimated duration.
3. Save plan history so students can compare old and new plans.

Frontend:

1. In Insights AI Coach add fields: hours per week and exam date.
2. Show weekly plan as day-by-day cards.
3. Add Regenerate Plan after new attempts.

### 8. Wire backend and frontend interaction clearly

Flow per feature:

1. Student action in UI triggers one API call.
2. Backend validates input, builds prompt, calls provider, validates output.
3. Backend stores useful AI results for history and analytics.
4. Frontend shows loading, success, and error states in plain language.

Standard response shape:

```json
{
  "ok": true,
  "feature": "study-plan",
  "data": {},
  "meta": {
    "provider": "ollama",
    "model": "llama3.1",
    "createdAt": "2026-04-04T08:30:00.000Z"
  }
}
```

### 9. End-to-end student user flow

1. Student uploads a PDF in Notes and taps Summarize with AI.
2. Student reviews summary and key points.
3. Student taps Generate AI Quiz from the same topic.
4. Student answers quiz and taps Explain with AI on incorrect answers.
5. Insights updates weak topics and recommendations.
6. Student generates a weekly Study Plan from AI Coach.
7. Student returns after new attempts and regenerates plan.

### 10. Add simple prompt and output templates

PDF/notes summarization prompt example:

Text prompt:

Summarize this study text for Ethiopian exit exam students. Return short summary, 5 key points, and 3 exam tips. Keep simple language.

Example output:

- Short summary: Encapsulation combines data and methods in one class and protects internal state.
- Key points: Access modifiers, data hiding, getters and setters, cohesion, maintainability.
- Exam tips: Focus on private fields and method exposure patterns.

AI-generated quiz prompt example:

Text prompt:

Create 5 multiple-choice questions for Object Oriented Programming on encapsulation at medium level. Return strict JSON. Each question must have 4 options and one correctAnswer.

Example output:

```json
{
  "questions": [
    {
      "questionText": "Which access modifier best supports encapsulation?",
      "options": ["public", "private", "protected", "static"],
      "correctAnswer": "private",
      "explanation": "private hides internal data from external classes."
    }
  ]
}
```

Answer explanation prompt example:

Text prompt:

Student selected B. Correct answer is D. Explain in 3 short points why D is correct, why B is wrong, and give one memory tip.

Example output:

1. D matches runtime polymorphism because method resolution happens at runtime.
2. B describes compile-time behavior, not runtime override behavior.
3. Memory tip: Override means object decides at runtime.

Weak-topic recommendation prompt example:

Text prompt:

Using these weak topics and scores, create a priority list and a practical action for each topic with recommended practice question counts.

Example output:

1. OOP inheritance, 48 percent: review class hierarchy basics and do 20 questions.
2. Database normalization, 52 percent: revise 1NF to 3NF and do 15 questions.

Study plan generator prompt example:

Text prompt:

Create a 7-day study plan for a student with 10 hours per week, exam in 30 days, weak topics in OOP and DB, and evening study preference.

Example output:

1. Monday, 90 min: OOP inheritance review plus 12 practice questions.
2. Tuesday, 75 min: Database normalization summary and 10 questions.
3. Wednesday, 90 min: Timed mixed quiz and answer review.

### 11. Delivery order for your team

1. Build provider abstraction and basic ai health test endpoint.
2. Launch summarize and explain first for quick student value.
3. Launch quiz generator with strict JSON validation.
4. Launch weak-topic recommendations using existing attempts data.
5. Launch study-plan generator in Insights AI Coach.
6. Add analytics and logging after all features are stable.

### 12. Done criteria

1. Student can use all five AI features without leaving core pages.
2. Every feature has loading, error, and retry UI states.
3. AI outputs are validated before display.
4. Ollama or OpenAI can be switched by env config only.
5. Insights dashboard shows recommendations and plan history.

---

## Using AI Coach

### In the web app

1. Sign in as a **student**.
2. Open **Guidance → AI Assistant** for all AI tools.
3. Or open **Workspace → Insights** for AI Coach only.
4. Click **Generate Plan** (Insights) or use any feature panel (AI Assistant).

### What you see

| Output | Description |
|--------|-------------|
| Recommendation text | Personalized study guidance |
| Weak-subject chips | Subjects flagged for extra focus |
| Timestamp | When the plan was generated |

### AI Hub source workflow

1. Open AI Hub.
2. Select one uploaded note source from the source selector.
3. Click **Use Source In Forms** to auto-fill subject/topic/plan fields.
4. Click **Generate AI Pack** to run summary + quiz + weekly plan from that selected uploaded content.

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

### `POST /api/ai/summarize`

Summarizes notes or PDF text and returns short summary, key points, and exam tips.

### `POST /api/ai/quiz`

Generates AI multiple-choice questions with 4 options, correct answer, and explanation.

### `POST /api/ai/explain`

Explains a student answer with why-correct, why-wrong, and memory tip.

### `POST /api/ai/recommend`

Creates prioritized weak-topic actions from topic performance input.

### `POST /api/ai/study-plan`

Creates a 7-day study plan from weekly hours, exam date, weak topics, and study-time preference.

---

## Environment variables

### Backend

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | Yes | Database connection |
| `JWT_SECRET` | Yes | Signing key for tokens |
| `AI_PROVIDER` | No | `ollama` (default) or `openai` |
| `OLLAMA_BASE_URL` | No | Default: `http://localhost:11434` |
| `OLLAMA_MODEL` | No | Default: `llama3.1` |
| `OPENAI_API_KEY` | No | Required when `AI_PROVIDER=openai` |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `OPENAI_BASE_URL` | No | Default: `https://api.openai.com` |
| `HUGGING_FACE_API_KEY` | No | Optional for legacy dashboard recommendation flow |
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
2. Open **Guidance → AI Assistant**.
3. Test summarize, quiz, explain, recommend, and study-plan panels.
4. Open **Insights** and click **Generate Plan** in AI Coach.

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
