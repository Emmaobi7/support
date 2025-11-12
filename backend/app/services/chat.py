from typing import Dict, List, Optional
import uuid
from datetime import datetime

from app.models import (
    ChatMessage, ChatResponse, ConversationHistory, 
    AgentConfig, AIProvider, MessageRole
)
from app.agents import AgentFactory
from app.agents.base import AIAgent
from app.core.config import settings

class ChatService:
    """Service for managing chat conversations and AI agents."""
    
    def __init__(self):
        self.conversations: Dict[str, ConversationHistory] = {}
        self.current_agent: Optional[AIAgent] = None
        self.current_provider: AIProvider = settings.default_ai_provider
        self._initialize_default_agent()
    
    def _initialize_default_agent(self):
        """Initialize the default AI agent."""
        try:
            config = AgentConfig(
                provider=self.current_provider,
                model=self._get_default_model(self.current_provider),
                max_tokens=settings.ai_max_tokens,
                temperature=settings.ai_temperature
            )
            
            api_key = self._get_api_key(self.current_provider)
            if api_key:
                self.current_agent = AgentFactory.create_agent(
                    self.current_provider, 
                    config, 
                    api_key
                )
        except Exception as e:
            print(f"Warning: Could not initialize default agent: {e}")
            self.current_agent = None
    
    def _get_default_model(self, provider: AIProvider) -> str:
        """Get the default model for a provider."""
        if provider == AIProvider.OPENAI:
            return settings.default_openai_model
        elif provider == AIProvider.ANTHROPIC:
            return settings.default_anthropic_model
        else:
            return "gpt-4"  # fallback
    
    def _get_api_key(self, provider: AIProvider) -> Optional[str]:
        """Get API key for a provider."""
        if provider == AIProvider.OPENAI:
            return settings.openai_api_key
        elif provider == AIProvider.ANTHROPIC:
            return settings.anthropic_api_key
        else:
            return None
    
    async def send_message(
        self, 
        message: str, 
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> ChatResponse:
        """
        Send a message and get AI response.
        
        Args:
            message: User's message
            conversation_id: Optional conversation ID
            user_id: Optional user ID
            
        Returns:
            ChatResponse with AI's reply
        """
        # Create or get conversation
        if conversation_id is None or conversation_id not in self.conversations:
            conversation_id = str(uuid.uuid4())
            self.conversations[conversation_id] = ConversationHistory(
                conversation_id=conversation_id,
                user_id=user_id,
                messages=[],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        
        conversation = self.conversations[conversation_id]
        
        # Create user message
        user_message = ChatMessage(
            id=str(uuid.uuid4()),
            role=MessageRole.USER,
            content=message,
            timestamp=datetime.utcnow()
        )
        
        # Add user message to conversation
        conversation.messages.append(user_message)
        conversation.updated_at = datetime.utcnow()
        
        # Generate AI response
        if self.current_agent:
            try:
                response = await self.current_agent.generate_response(
                    conversation.messages[:-1],  # Previous messages
                    message  # Current message
                )
                response.conversation_id = conversation_id
                
                # Add AI message to conversation
                conversation.messages.append(response.message)
                conversation.updated_at = datetime.utcnow()
                
                return response
                
            except Exception as e:
                # Fallback response
                fallback_message = ChatMessage(
                    id=str(uuid.uuid4()),
                    role=MessageRole.ASSISTANT,
                    content=f"I'm sorry, I encountered an error: {str(e)}. Please try again or contact support.",
                    timestamp=datetime.utcnow(),
                    metadata={"error": str(e), "fallback": True}
                )
                
                conversation.messages.append(fallback_message)
                conversation.updated_at = datetime.utcnow()
                
                return ChatResponse(
                    message=fallback_message,
                    conversation_id=conversation_id,
                    should_request_screen_share=False
                )
        else:
            # No agent configured
            no_agent_message = ChatMessage(
                id=str(uuid.uuid4()),
                role=MessageRole.ASSISTANT,
                content="I'm sorry, the AI service is not configured properly. Please check the server configuration.",
                timestamp=datetime.utcnow(),
                metadata={"error": "No AI agent configured"}
            )
            
            conversation.messages.append(no_agent_message)
            conversation.updated_at = datetime.utcnow()
            
            return ChatResponse(
                message=no_agent_message,
                conversation_id=conversation_id,
                should_request_screen_share=False
            )
    
    def get_conversation(self, conversation_id: str) -> Optional[ConversationHistory]:
        """Get conversation by ID."""
        return self.conversations.get(conversation_id)
    
    def get_conversation_messages(self, conversation_id: str) -> List[ChatMessage]:
        """Get messages from a conversation."""
        conversation = self.conversations.get(conversation_id)
        return conversation.messages if conversation else []
    
    async def switch_agent(self, provider: AIProvider) -> bool:
        """
        Switch to a different AI provider.
        
        Args:
            provider: The new AI provider to use
            
        Returns:
            True if switch was successful, False otherwise
        """
        try:
            config = AgentConfig(
                provider=provider,
                model=self._get_default_model(provider),
                max_tokens=settings.ai_max_tokens,
                temperature=settings.ai_temperature
            )
            
            api_key = self._get_api_key(provider)
            if not api_key:
                return False
            
            new_agent = AgentFactory.create_agent(provider, config, api_key)
            self.current_agent = new_agent
            self.current_provider = provider
            
            return True
            
        except Exception as e:
            print(f"Error switching agent: {e}")
            return False
    
    def get_current_provider(self) -> AIProvider:
        """Get the currently active AI provider."""
        return self.current_provider
    
    def get_supported_providers(self) -> List[AIProvider]:
        """Get list of supported AI providers."""
        return AgentFactory.get_supported_providers()

# Global chat service instance
chat_service = ChatService()