# ExitPrep+ Website

This workspace now contains a full implementation of the ExitPrep+ web platform from your documentation.

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MongoDB
- AI: Hugging Face inference API (`/api/ai/dashboard`)
- File hosting: Cloudinary-ready upload pipeline

## Project Structure
- `client` - dashboard, study notes, practice questions, admin panel
- `server` - auth, resources, questions, exams, AI analytics APIs

## Backend Setup
1. Go to `server`.
2. Copy `.env.example` to `.env`.
3. Fill in MongoDB, JWT, Hugging Face, and Cloudinary values.
4. Install and run:
   - `npm install`
   - `npm run dev`

## Frontend Setup
1. Go to `client`.
2. Copy `.env.example` to `.env`.
3. Install and run:
   - `npm install`
   - `npm run dev`

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/resources`
- `POST /api/resources` (admin)
- `GET /api/questions`
- `POST /api/questions` (admin)
- `GET /api/exams`
- `POST /api/exams` (admin)
- `POST /api/ai/dashboard` (student/admin with token)
- `POST /api/ai/activity` (student/admin with token)

## Quick Start Flow
1. Register a student/admin through auth endpoints.
2. Login and copy JWT token.
3. Open frontend dashboard and paste token.
4. Generate AI recommendation using sample or real subject scores.
5. Use admin page to upload resources metadata.
