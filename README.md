# ExitPrep Ethiopia

Web platform for Ethiopian university students to prepare for exit exams.

ExitPrep centralizes study resources, assessment practice, progress analytics, and AI-powered support in one platform designed for both students and administrators.

## Description

ExitPrep Ethiopia helps students prepare for Ethiopian University Exit Exams through:

- Centralized study materials and downloadable resources
- Practice questions grouped by category and department
- Course-based performance tracking and weak-topic detection
- Role-based admin controls for managing content and users
- AI-assisted learning support for summaries and recommendations

Primary goals:

1. Improve access to quality exam preparation content
2. Provide measurable progress and readiness insights
3. Enable scalable content management for institutions/admin teams

## Key Features

### Student Experience

- Public homepage with modern landing page
- Sign up/sign in with protected routes
- Study notes page
- Practice questions with category-based modes:
  - EUEE Simulation
  - Official Exams (Past Exam)
  - Custom Department Questions
- Dashboard/Insights page with dynamic performance metrics
- Profile page with account and preference controls
- Light and dark theme support
- Responsive mobile and desktop layout

### Admin Experience

- Role-based admin panel
- Upload resources (PDF workflow)
- JSON-based question import with category selection dropdown
- Category filtering and structured question management
- User management (roles, suspension, activity snapshot)
- Analytics overview and moderation scaffolding

### AI Support

- AI summary and recommendation integration
- Weak-topic recommendation pipeline
- Activity tracking support for personalized insights

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT
- AI: Hugging Face or OpenAI-compatible integration
- File Handling: Multer, Cloudinary pipeline
- Deployment: Render blueprint with [render.yaml](render.yaml)

## Project Structure

- [client](client): Frontend application (student and admin interfaces)
- [server](server): Backend APIs, auth, resources, questions, insights, AI routes
- [render.yaml](render.yaml): Deployment blueprint for Render services

## Screenshots / Demo

### Home

Add homepage screenshot here:

![Home Placeholder](https://via.placeholder.com/1280x720?text=ExitPrep+Home+Preview)

### Optional Additional Screens

- Student Dashboard
- Questions Category Selection
- Admin Upload Panel

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or cloud)

### Backend Setup

1. Open terminal in [server](server)
2. Create environment file based on your template
3. Install dependencies
4. Start development server

Commands:

    npm install
    npm run dev

### Frontend Setup

1. Open terminal in [client](client)
2. Create environment file for frontend variables
3. Install dependencies
4. Start development server

Commands:

    npm install
    npm run dev

## Environment Variables

### Backend (server)

- MONGODB_URI
- JWT_SECRET
- HUGGING_FACE_API_KEY (or equivalent AI key)
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

### Frontend (client)

- VITE_API_URL

Example value:

    http://localhost:5000/api

## API Overview

### Authentication

- POST /api/auth/register
- POST /api/auth/login

### Questions

- GET /api/questions
- POST /api/questions (admin)
- POST /api/questions/bulk (admin, JSON import)

Filtering supports category-based queries:

- category=simulation
- category=past
- category=custom

### Resources

- GET /api/resources
- POST /api/resources (admin)

### Exams

- GET /api/exams
- POST /api/exams (admin)

### Insights and Attempts

- GET /api/attempts/courses
- GET /api/attempts/insights
- POST /api/attempts
- POST /api/attempts/bulk

### AI

- POST /api/ai/dashboard
- POST /api/ai/activity

## JSON Question Upload Format

Upload as a JSON array of question objects.

Required fields per question:

- category: simulation, past, or custom
- courseName
- questionText
- options (exactly 4 values)
- correctAnswer
- explanation

Optional fields:

- examYear
- difficulty

Example:

    [
      {
        "category": "simulation",
        "courseName": "Database Systems",
        "questionText": "What is a primary key?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "A primary key uniquely identifies each row."
      }
    ]

## Deployment

Recommended deployment target: Render.

1. Push repository to GitHub
2. Create new Render Blueprint
3. Connect repository
4. Render reads [render.yaml](render.yaml) and provisions services
5. Set backend and frontend environment variables
6. Redeploy frontend after VITE_API_URL is configured

## Roadmap

- Department-level exam blueprints
- Adaptive quiz generation based on weak topics
- Time-based test simulation mode
- Better analytics visualizations and longitudinal trends
- Institution dashboards for cohort-level monitoring

## Contribution

Contributions are welcome.

Recommended process:

1. Create feature branch
2. Commit focused changes
3. Open pull request with clear summary and screenshots

## License

Add your preferred license here (for example MIT).
