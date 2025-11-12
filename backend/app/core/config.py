from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path
from app.models import AIProvider

# Explicitly load .env from backend directory
try:
    from dotenv import load_dotenv
    backend_dir = Path(__file__).resolve().parents[2]  # app/core/config.py -> backend/
    env_file = backend_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)
except Exception as e:
    print(f'Warning: Could not load .env with dotenv: {e}')

class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Agora settings
    agora_app_id: Optional[str] = None
    agora_app_certificate: Optional[str] = None
    
    # AI Agent settings
    default_ai_provider: AIProvider = AIProvider.OPENAI
    default_openai_model: str = "gpt-4"
    default_anthropic_model: str = "claude-3-sonnet-20240229"
    ai_temperature: float = 0.7
    ai_max_tokens: int = 1000
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    
    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Pydantic v2 configuration: read .env and ignore extra env vars
    model_config = {
        "env_file": None,  # env vars already loaded via load_dotenv above
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

# Global settings instance
settings = Settings()