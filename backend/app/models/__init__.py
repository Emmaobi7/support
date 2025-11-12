from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    id: Optional[str] = None
    role: MessageRole
    content: str
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    conversation_id: str
    should_request_screen_share: bool = False
    confidence_score: Optional[float] = None

class ConversationHistory(BaseModel):
    conversation_id: str
    user_id: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: datetime
    updated_at: datetime

class AIProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    # Add more providers as needed

class AgentConfig(BaseModel):
    provider: AIProvider
    model: str
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    system_prompt: Optional[str] = None

class AgoraTokenRequest(BaseModel):
    channel_name: str
    uid: int = 0
    role: int = 1  # 1 for publisher, 2 for subscriber
    privilege_expired_ts: Optional[int] = None

class AgoraTokenResponse(BaseModel):
    token: str
    channel_name: str
    uid: int
    expires_at: datetime