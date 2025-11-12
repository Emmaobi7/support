from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
import asyncio

from app.services import context_store

from app.models import (
    ChatRequest, ChatResponse, ConversationHistory, 
    AIProvider, AgoraTokenRequest, AgoraTokenResponse
)
from app.services.chat import chat_service
from app.services.agora import agora_service
from pathlib import Path
import os
from fastapi import File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import io
import uuid
try:
    import pytesseract
    _HAS_TESSERACT = True
except Exception:
    _HAS_TESSERACT = False

router = APIRouter()


class DocIngestRequest(BaseModel):
    title: Optional[str] = None
    content: str

@router.post("/chat", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Send a message to the AI assistant."""
    try:
        response = await chat_service.send_message(
            message=request.message,
            conversation_id=request.conversation_id,
            user_id=request.user_id
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{conversation_id}", response_model=ConversationHistory)
async def get_conversation(conversation_id: str):
    """Get conversation history by ID."""
    conversation = chat_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.post("/agent/switch")
async def switch_ai_agent(provider: AIProvider):
    """Switch to a different AI provider."""
    success = await chat_service.switch_agent(provider)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to switch to {provider.value} - check API key configuration"
        )
    return {"message": f"Successfully switched to {provider.value}", "provider": provider}

@router.get("/agent/current")
async def get_current_agent():
    """Get the currently active AI provider."""
    return {
        "provider": chat_service.get_current_provider(),
        "supported_providers": chat_service.get_supported_providers()
    }

@router.post("/agora/token", response_model=AgoraTokenResponse)
async def generate_agora_token(request: AgoraTokenRequest):
    """Generate Agora token for screen sharing."""
    try:
        # Validate channel name
        if not agora_service.validate_channel_name(request.channel_name):
            raise HTTPException(
                status_code=400, 
                detail="Invalid channel name. Must be 1-64 characters, alphanumeric, underscore, or hyphen only."
            )
        
        token_response = agora_service.generate_token(
            channel_name=request.channel_name,
            uid=request.uid,
            role=request.role,
            privilege_expired_ts=request.privilege_expired_ts
        )
        return token_response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate token: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ai_provider": chat_service.get_current_provider(),
        "agora_configured": bool(agora_service.app_id and agora_service.app_certificate)
    }


@router.post('/screenshots')
async def upload_screenshot(file: UploadFile = File(...)):
    """Receive a screenshot upload, save it, run OCR if available, and return a URL + extracted text."""
    try:
        # Compute uploads dir relative to the backend root (this file is at backend/app/api/endpoints.py)
        backend_root = Path(__file__).resolve().parents[2]
        uploads_dir = backend_root / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename).suffix or '.png'
        filename = f"screenshot_{uuid.uuid4().hex}{ext}"
        file_path = uploads_dir / filename

        contents = await file.read()
        file_path.write_bytes(contents)

        ocr_text = None
        if _HAS_TESSERACT:
            try:
                image = Image.open(io.BytesIO(contents))
                # Preprocess image for better OCR
                # 1. Convert to RGB if needed
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                # 2. Upscale if small (tesseract works better on larger images)
                width, height = image.size
                if width < 800 or height < 600:
                    scale_factor = max(2, min(int(800 / width), int(600 / height)))
                    new_size = (width * scale_factor, height * scale_factor)
                    image = image.resize(new_size, Image.Resampling.LANCZOS)
                    print(f'[OCR] Upscaled image from {(width, height)} to {image.size}')
                # 3. Enhance contrast
                from PIL import ImageEnhance
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(1.5)
                enhancer = ImageEnhance.Sharpness(image)
                image = enhancer.enhance(2.0)
                # 4. Run OCR with optimized settings
                # PSM modes: 3=auto, 6=assume single uniform block of text, 11=sparse text
                config = r'--psm 3 --oem 3'  # PSM 3 (auto layout), OEM 3 (both neural and classic)
                ocr_text = pytesseract.image_to_string(image, config=config)
                if ocr_text:
                    ocr_text = ocr_text.strip()
                print(f'[OCR] Extracted {len(ocr_text)} characters')
            except Exception as e:
                print(f'[OCR] Failed: {e}')
                ocr_text = None

        # Build a simple URL to the saved file (served from /uploads)
        file_url = f"/uploads/{filename}"

        # Return the actual filesystem path for debugging (so we can tell where it went)
        return JSONResponse({"success": True, "url": file_url, "ocr_text": ocr_text, "path": str(file_path)})

    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post('/docs')
async def ingest_doc(payload: DocIngestRequest):
    """Ingest an application/document text into the vector store for retrieval.

    Body: { title?: string, content: string }
    Returns: { success: bool }
    """
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail='content is required')

    full_text = payload.content if not payload.title else f"{payload.title}\n\n{payload.content}"

    try:
        # context_store.ingest_text is synchronous — run in a thread
        ok = await asyncio.to_thread(context_store.ingest_text, full_text)
        return JSONResponse({"success": bool(ok)})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)