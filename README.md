# 🤖 AI Support Assistant - Complete Full-Stack Application

A modern, production-ready AI-powered customer support system with real-time screen sharing capabilities. Built with React, FastAPI, and pluggable AI architecture.

## 🌟 Features

### 🎯 **Core Functionality**
- **Real-time AI Chat**: Intelligent conversations with context awareness
- **Smart Screen Sharing**: AI detects when visual guidance is needed
- **Dual-Panel Interface**: Chat + screen sharing in one seamless experience
- **Offline Mode**: Graceful fallback when backend is unavailable

### 🤖 **Pluggable AI Architecture**
# AI Support Assistant

This repository contains a compact prototype of an AI-powered support assistant with realtime chat, screen sharing, screenshot OCR, and a retrieval-augmented-document (RAG) ingestion flow.

This README is the single source of truth for running and understanding the local dev setup.

## What this project does (short)
- Frontend: React + Vite UI with Chat and Screen Share panels. A dedicated "Upload Docs" page lets you paste large documents for RAG ingestion.
- Backend: FastAPI app exposing chat, agent management, Agora token generation, screenshot OCR, and a docs ingestion endpoint that inserts text + embeddings into a vector store (Supabase Postgres or local Postgres fallback).
- Embeddings: Prefers Voyage AI (when `VOYAGE_API_KEY` is set), falls back to OpenAI embeddings. Be mindful of embedding dimensionality (Voyage = 1024 dims; OpenAI text-embedding-3 = 1536 dims).
- OCR: Server-side Tesseract (pytesseract) with preprocessing (upscaling, contrast/sharpness) to improve extraction. Frontend captures high-DPI screenshots to improve OCR accuracy.

## Quick start (local dev)

Prerequisites
- Node.js 18+ and npm
- Python 3.11+ and pip
- **Tesseract OCR** (system-level binary) — required for screenshot text extraction
  - **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
  - **macOS**: `brew install tesseract`
  - **Windows**: Download installer from https://github.com/UB-Mannheim/tesseract/wiki
- Optional: Supabase project with pgvector (if you want a hosted vector DB) or a Postgres 13+ with pgvector locally

1. Install and configure backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit backend/.env with your keys (SUPABASE_URL, SUPABASE_KEY, VOYAGE_API_KEY, OPENAI_API_KEY, AGORA_*)
```

Important: This project expects `backend/.env`. The backend code will load `backend/.env` automatically at startup (see `backend/app/main.py`).

2. Install frontend

```bash
cd frontend
npm install
cp .env.example .env
# Helpful front-end env vars you can set in frontend/.env:
# VITE_BACKEND_URL=http://localhost:8000
# VITE_API_BASE_URL=http://localhost:8000  # used by some components
# VITE_AGORA_APP_ID=your_agora_app_id
```

3. Start servers

Backend (from repo root or backend/):

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

Open the UI: http://localhost:3000 — or the API docs at http://localhost:8000/docs

## Key developer flows

1) Ingest a document (UI)
- Click `Upload Docs` in the top-right of the Home page to open the dedicated ingestion page.
- Paste a title (optional) and the document body (very large textarea), then click `Ingest Document`.
- The frontend posts to `POST /api/v1/docs`. The backend computes an embedding and inserts the document into the vector store.

2) Screenshot OCR
- While screen-sharing, click `Send Screenshot`. The frontend captures a high-resolution canvas (considers devicePixelRatio), uploads to `POST /api/v1/screenshots` and the backend runs pytesseract with preprocessing (upscale + contrast/sharpness + PSM config).
- The OCR text (if any) is included in the chat message sent to the assistant.

3) Retrieval / RAG
- The Anthropic (or chosen) agent calls `retrieve_similar_context()` before generating a response. That function queries the vector store and returns the top-k similar document chunks to prepend to the system prompt.

## Important endpoints

- POST /api/v1/chat — send chat messages
- POST /api/v1/docs — ingest document text for embeddings
- POST /api/v1/screenshots — upload screenshot, returns OCR text
- POST /api/v1/agent/switch — switch AI provider
- POST /api/v1/agora/token — get Agora token for screen sharing
- GET /api/v1/health — health & provider info

## Embeddings & Vector DB notes

- Embedding providers: code prefers `VOYAGE_API_KEY` (Voyage AI) and falls back to OpenAI. Voyage returns 1024-dim vectors; OpenAI embeddings are 1536-dim. If you change provider, ensure your Supabase table's `vector` column matches the embedding dimension.
- Supabase: a SQL script exists in `scripts/setup_supabase_embeddings_voyage.sql` (for a 1024-dim vector column). If you previously created an embeddings table for OpenAI (1536), create a separate table for Voyage or alter accordingly.
- Local Postgres fallback: the code can insert into a local Postgres if `POSTGRES_DSN` is set (requires pgvector extension and compatible Postgres version).

## OCR & Screenshot tips

- Use a larger window or full-screen capture to improve OCR. The frontend captures canvas width/height from the video element; small previews produce smaller images and worse OCR results.
- High-DPI displays: the frontend respects `devicePixelRatio` and captures higher-resolution images when available.
- If OCR fails, backend logs include `[OCR]` messages showing whether the server upscaled the image and how many characters were extracted.

## Debugging & useful scripts

- `scripts/test_supabase_context.py` — quick script that loads `backend/.env`, ingests a test document via `context_store.ingest_text()` and runs `retrieve_similar_context()` to verify ingestion and retrieval.
- Logs: the backend prints useful debug messages during embedding and ingestion (e.g. `Voyage embedding successful, vector length: 1024`, `Supabase not configured; skipping ingest`).

## Where the important code lives

- Frontend
  - `frontend/src/pages/Home.jsx` — main layout + ChatWindow + ScreenShare
  - `frontend/src/pages/DocUpload.jsx` — dedicated document ingestion page (very large textarea)
  - `frontend/src/components/ScreenShare.jsx` — capture & screenshot upload flow
  - `frontend/src/components/ChatWindow.jsx` — chat UI + listens for `ai-message` events

- Backend
  - `backend/app/main.py` — app entry, loads `.env` on startup
  - `backend/app/api/endpoints.py` — all API routes (chat, screenshots, docs, agora, health)
  - `backend/app/services/context_store.py` — embeddings, ingest, retrieval logic
  - `backend/app/agents/` — pluggable agent implementations (Anthropic/OpenAI)

## Troubleshooting checklist

- No embeddings on HTTP requests but tests work? Ensure the process that runs uvicorn sees `backend/.env`. This project loads `backend/.env` early in `app.main`, but if you start uvicorn from a different working directory without envs exported you may see missing keys.
- OCR poor results? Capture a larger area (full window) or make sure the browser preview is large. The backend upscales small images but starting from a larger capture helps.
- Embedding dimension mismatch? Confirm the vector column definition in Supabase (vector(1024) vs vector(1536)). Use the SQL in `scripts/` if needed.

