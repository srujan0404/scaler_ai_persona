# AI Persona — Srujan Reddy Dharma

An AI representative that can answer questions about my background, skills, and projects via **voice call** and **chat**, with real-time **Google Calendar booking**.

Built for the Scaler Screening Assignment.

## Live Links

| What | URL |
|------|-----|
| Chat Interface | [scaler-ai-persona.vercel.app](https://scaler-ai-persona.vercel.app) |
| Backend API | [scaler-ai-persona.onrender.com](https://scaler-ai-persona.onrender.com) |
| Phone Number | +1 (948) 637 9287 |

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                           │
│                                                                  │
│   Phone Call (Vapi)              Chat (Next.js on Vercel)        │
│        │                                │                        │
│        ▼                                ▼                        │
│   ┌──────────┐                   ┌─────────────┐                │
│   │   Vapi   │                   │  Next.js    │                │
│   │ STT(Deepgram)                │  Frontend   │                │
│   │ LLM(Groq)│                   │             │                │
│   │ TTS(11Labs)                  └──────┬──────┘                │
│   └────┬─────┘                          │                        │
│        │                                │                        │
└────────┼────────────────────────────────┼────────────────────────┘
         │                                │
         │ Vapi Tools (HTTP POST)         │ POST /api/chat
         │                                │
         ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js on Render)                 │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Vapi Tool APIs  │  │  Chat API    │  │  Booking Service   │  │
│  │ /api/tools/*    │  │  /api/chat   │  │  /api/bookings/*   │  │
│  └────────┬────────┘  └──────┬───────┘  └─────────┬──────────┘  │
│           │                  │                     │              │
│           └──────────┬───────┘                     │              │
│                      ▼                             │              │
│           ┌──────────────────┐                     │              │
│           │   RAG Service    │                     │              │
│           │  (Text Search +  │                     │              │
│           │   Keyword Match  │                     ▼              │
│           │   + Priority)    │          ┌──────────────────┐     │
│           └────────┬─────────┘          │ Google Calendar  │     │
│                    │                    │  API (Events +   │     │
│                    ▼                    │  Meet Links)     │     │
│           ┌──────────────────┐          └──────────────────┘     │
│           │  MongoDB Atlas   │                                    │
│           │                  │                                    │
│           │ • rag_chunks     │  ← 200+ chunks from resume +      │
│           │ • knowledge_base │    130+ GitHub repos (real READMEs)│
│           │ • bookings       │                                    │
│           │ • availability   │                                    │
│           │ • google_tokens  │                                    │
│           └──────────────────┘                                    │
└───────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- Both voice and chat share the **same backend, RAG pipeline, and booking system** — consistent responses across channels
- Voice agent is **RAG-grounded** via `get_background_info` tool — no hardcoded answers in the system prompt
- Featured priority chunks ensure the best projects surface first, not random repos
- Google Calendar integration creates real events with Google Meet links

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Voice Agent | Vapi + ElevenLabs TTS + Deepgram Nova-2 STT |
| Voice LLM | Groq (`llama-3.3-70b-versatile`) |
| Chat LLM | Groq (`openai/gpt-oss-120b`) |
| Chat Frontend | Next.js + Tailwind CSS + react-markdown |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| RAG | Text search + keyword matching + priority ranking |
| Calendar | Google Calendar API (events + Meet links) |
| Deployment | Vercel (frontend) + Render (backend) |

## RAG Pipeline

The persona is **not hardcoded** — it uses a retrieval-augmented generation pipeline:

1. **Ingestion**: Resume sections + 130+ GitHub repos (actual READMEs fetched via GitHub API) are chunked and stored in MongoDB `rag_chunks` collection
2. **Featured Chunks**: Curated high-priority summaries (priority: 95-100) for common topics ensure the best content surfaces first
3. **Retrieval**: Each query triggers a multi-step search:
   - Featured chunks for the detected category (always first)
   - Resume chunks for the category
   - MongoDB full-text search across all chunks
   - Keyword regex fallback
4. **Generation**: Only retrieved chunks are injected into the LLM prompt. The system prompt explicitly forbids using information not in the context.

```
User Question → classifyQuery() → Retrieve Featured Chunks
                                 → Retrieve Resume Chunks
                                 → MongoDB Text Search
                                 → Keyword Fallback
                                 → Top 8 Chunks → LLM → Response
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Groq API key
- Google Cloud project with Calendar API enabled
- Vapi account

### 1. Clone and Install

```bash
git clone https://github.com/srujan0404/scaler_ai_persona.git
cd scaler_ai_persona

cd backend && npm install

cd ../frontend && npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
MONGODB_URI=your_mongodb_uri
PORT=3001
FRONTEND_URL=*
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

Create `frontend/.env.local`:
```env
BACKEND_URL=http://localhost:3001
```

### 3. Seed Database

```bash
cd backend

npm run seed

GITHUB_TOKEN=your_token npm run fetch-github
```

### 4. Connect Google Calendar

```bash
cd backend && npm start
# Visit http://localhost:3001/auth/google
# Authorize with Google — bookings will now create Calendar events
```

### 5. Run Locally

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Chat with AI persona (RAG-grounded) |
| `/api/tools/get-background-info` | POST | RAG retrieval for Vapi voice tool |
| `/api/tools/get-available-slots` | POST | Available slots for Vapi voice tool |
| `/api/tools/book-meeting` | POST | Book meeting for Vapi voice tool |
| `/api/bookings/slots` | GET | Get available meeting slots |
| `/api/bookings/book` | POST | Book a meeting slot |
| `/auth/google` | GET | Start Google Calendar OAuth |
| `/auth/google/status` | GET | Check Google Calendar connection |

## Project Structure

```
scaler_ai_persona/
├── backend/
│   ├── src/
│   │   ├── index.js                    
│   │   ├── config/env.js               
│   │   ├── routes/
│   │   │   ├── chat.routes.js          
│   │   │   ├── vapi.routes.js          
│   │   │   ├── tools.routes.js         
│   │   │   ├── auth.routes.js          
│   │   │   └── booking.routes.js       
│   │   ├── services/
│   │   │   ├── rag.service.js          
│   │   │   ├── groq.service.js         
│   │   │   ├── booking.service.js      
│   │   │   ├── google-calendar.service.js
│   │   │   ├── calendly.service.js     
│   │   │   └── db.service.js           
│   │   └── data/
│   │       ├── seed.js                
│   │       ├── fetch-github.js        
│   │       ├── seed-featured.js       
│   │       └── seed-featured-inline.js
│   └── package.json
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx
│   │   ├── api/chat/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── package.json
└── README.md
```
