# ExitPrep AI Coach

AI-powered study planning for Ethiopian university exit exam preparation.

This README is focused on the AI feature: what it does, how to use it, how it is wired, and how to configure it.

## What The AI Feature Does

- Generates a personalized weekly study plan from student performance data
- Detects weak subjects/topics and prioritizes them in recommendations
- Works from real attempt history and course/topic accuracy
- Supports regeneration so students can refresh advice after new practice
- Falls back to deterministic recommendations when external AI is unavailable

## Where To Access It

In the web app:

1. Sign in as a student
2. Go to Workspace -> Insights
3. Find AI Coach section
4. Click Generate Plan

The UI returns:

- Recommendation text
- Weak-subject chips
- Generation timestamp

## AI Architecture

Frontend:

- Dashboard UI triggers AI recommendation request
- Sends subjectScores derived from topic accuracy
- Renders returned recommendation and weak subjects

Backend:

- Route: POST /api/ai/dashboard
- Controller computes subject scores and weak subjects
- Service calls Hugging Face model (if configured)
- Response is persisted in analytics collection and returned to UI

Fallback behavior:

- If HUGGING_FACE_API_KEY is missing or model call fails, backend returns a useful local recommendation
- Students still get actionable AI Coach output without external API dependency

## AI API Reference

### POST /api/ai/dashboard

Purpose:

- Generate personalized recommendation for current student (or admin-selected student)

Auth:

- Required (JWT)

Request body (typical):

```json
{
  "subjectScores": {
    "Object Oriented Programming": 2.8,
    "Database Systems": 3.6
  }
}
```

Response (typical):

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

### POST /api/ai/activity

Purpose:

- Append student activity used by AI and analytics pipelines

Auth:

- Required (JWT)

## Environment Variables (AI)

Backend variables:

- MONGODB_URI
- JWT_SECRET
- HUGGING_FACE_API_KEY (optional)
- HUGGING_FACE_MODEL (optional, default: google/flan-t5-small)

Frontend variables:

- VITE_API_URL (example: http://localhost:5000/api)

## Local Setup (AI-Focused)

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

After startup:

1. Log in
2. Open Insights
3. Click Generate Plan in AI Coach

## AI Troubleshooting

AI Coach not visible:

- Open Workspace -> Insights
- Refresh client after pull/build changes

Recommendation request fails:

- Verify VITE_API_URL points to backend
- Verify JWT auth/session is valid
- Check backend logs for /api/ai/dashboard errors

Generic recommendation returned:

- Expected when HUGGING_FACE_API_KEY is not set
- Set API key to enable model-generated output

## Minimal Project Links

- Frontend app: [client](client)
- Backend API: [server](server)
- Deployment blueprint: [render.yaml](render.yaml)
