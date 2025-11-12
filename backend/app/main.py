# Load environment variables FIRST before any other imports
from pathlib import Path
try:
    from dotenv import load_dotenv
    backend_dir = Path(__file__).resolve().parents[1]
    env_file = backend_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)
except Exception as e:
    print(f'Warning: Could not load .env: {e}')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.endpoints import router
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="AI Support Assistant API",
    description="Backend API for AI-powered customer support with screen sharing",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")

from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Serve uploaded screenshots (use path relative to package to avoid cwd issues)
backend_root = Path(__file__).resolve().parents[1]
uploads_path = backend_root / 'uploads'
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Support Assistant API",
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else "Documentation disabled in production"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )