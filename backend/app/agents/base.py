from abc import ABC, abstractmethod
from typing import List, Optional
from app.models import ChatMessage, ChatResponse, AgentConfig

class AIAgent(ABC):
    """
    Abstract base class for AI agents.
    This allows easy swapping between different AI providers (OpenAI, Anthropic, etc.)
    """
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.system_prompt = config.system_prompt or self._get_default_system_prompt()
    
    @abstractmethod
    async def generate_response(
        self, 
        messages: List[ChatMessage], 
        user_message: str
    ) -> ChatResponse:
        """
        Generate a response to the user's message given the conversation history.
        
        Args:
            messages: List of previous messages in the conversation
            user_message: The current user message to respond to
            
        Returns:
            ChatResponse containing the AI's response and metadata
        """
        pass
    
    @abstractmethod
    async def analyze_confusion_level(self, message: str) -> float:
        """
        Analyze the user's message to determine if they need visual assistance.
        
        Args:
            message: The user's message to analyze
            
        Returns:
            Float between 0.0 and 1.0 indicating confusion level (1.0 = needs screen share)
        """
        pass
    
    def _get_default_system_prompt(self) -> str:
        """Default system prompt for the support assistant."""
        return """You are a helpful AI support assistant. Your role is to:

1. Provide clear, helpful responses to user questions
2. Detect when users are confused or stuck and need visual guidance
3. Ask for screen sharing when you detect the user needs visual help
4. Guide users step by step through their issues

When you detect confusion, frustration, or technical problems that would benefit from visual guidance, respond with a message asking the user to share their screen so you can provide better assistance.

Be friendly, professional, and focused on solving the user's problems efficiently."""

    def should_request_screen_share(self, confusion_level: float, threshold: float = 0.6) -> bool:
        """
        Determine if screen sharing should be requested based on confusion level.
        
        Args:
            confusion_level: Float between 0.0 and 1.0
            threshold: Threshold above which screen sharing is requested
            
        Returns:
            Boolean indicating if screen sharing should be requested
        """
        return confusion_level >= threshold