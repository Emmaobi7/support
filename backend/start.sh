#!/bin/bash

# AI Support Assistant Backend Startup Script

echo "🚀 Starting AI Support Assistant Backend..."

# Activate virtual environment
source venv/bin/activate

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before running in production"
fi

# Start the server
echo "🌟 Starting FastAPI server on http://localhost:8000"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000