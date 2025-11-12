import openai
from typing import List
from datetime import datetime
import uuid
import re

from app.agents.base import AIAgent
from app.models import ChatMessage, ChatResponse, MessageRole, AgentConfig

class OpenAIAgent(AIAgent):
    """OpenAI GPT-powered support agent implementation."""
    
    def __init__(self, config: AgentConfig, api_key: str):
        super().__init__(config)
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = config.model
        
        # Keywords that indicate user confusion or need for visual help
        self.confusion_keywords = [
            'help', 'stuck', 'error', 'problem', 'issue', 'confused', 'not working',
            'broken', 'can\'t', 'unable', 'difficulty', 'trouble', 'struggling',
            'don\'t understand', 'how do i', 'where is', 'can\'t find',
            'doesn\'t work', 'failed', 'wrong', 'incorrect', 'bug'
        ]
        
        # Screen sharing trigger phrases
        self.screen_share_triggers = [
            'share your screen', 'screen sharing', 'show me your screen',
            'can you share', 'let me see', 'visual guidance'
        ]
    
    async def generate_response(
        self, 
        messages: List[ChatMessage], 
        user_message: str
    ) -> ChatResponse:
        """Generate response using OpenAI GPT."""
        
        # Analyze confusion level
        confusion_level = await self.analyze_confusion_level(user_message)
        should_share = self.should_request_screen_share(confusion_level)
        
        # Convert our messages to OpenAI format
        openai_messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add conversation history
        for msg in messages:
            openai_messages.append({
                "role": msg.role.value,
                "content": msg.content
            })
        
        # Add current user message
        openai_messages.append({
            "role": "user",
            "content": user_message
        })
        
        # If we should request screen sharing, modify the system prompt
        if should_share:
            screen_share_instruction = "\n\nThe user appears to be having difficulty. Please ask them to share their screen so you can provide visual guidance. Be polite and explain that screen sharing will help you understand their issue better."
            openai_messages[0]["content"] += screen_share_instruction
        
        try:
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=openai_messages,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            )
            
            ai_message_content = response.choices[0].message.content
            
            # Create response message
            ai_message = ChatMessage(
                id=str(uuid.uuid4()),
                role=MessageRole.ASSISTANT,
                content=ai_message_content,
                timestamp=datetime.utcnow(),
                metadata={
                    "model": self.model,
                    "confusion_level": confusion_level,
                    "token_usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
            )
            
            # Check if the response contains screen sharing request
            contains_screen_share_request = any(
                trigger in ai_message_content.lower() 
                for trigger in self.screen_share_triggers
            )
            
            return ChatResponse(
                message=ai_message,
                conversation_id=str(uuid.uuid4()),
                should_request_screen_share=should_share or contains_screen_share_request,
                confidence_score=confusion_level
            )
            
        except Exception as e:
            # Fallback response in case of API error
            fallback_message = ChatMessage(
                id=str(uuid.uuid4()),
                role=MessageRole.ASSISTANT,
                content="I'm sorry, I'm having trouble connecting to my AI service right now. Let me try to help you with a basic response. Could you please describe your issue in more detail?",
                timestamp=datetime.utcnow(),
                metadata={"error": str(e), "fallback": True}
            )
            
            return ChatResponse(
                message=fallback_message,
                conversation_id=str(uuid.uuid4()),
                should_request_screen_share=should_share,
                confidence_score=confusion_level
            )
    
    async def analyze_confusion_level(self, message: str) -> float:
        """
        Analyze user message to determine confusion level.
        Uses keyword matching and pattern recognition.
        """
        message_lower = message.lower()
        
        # Base confusion score
        confusion_score = 0.0
        
        # Check for confusion keywords
        keyword_matches = sum(1 for keyword in self.confusion_keywords if keyword in message_lower)
        confusion_score += min(keyword_matches * 0.2, 0.6)  # Max 0.6 from keywords
        
        # Check for question marks (indicates uncertainty)
        question_marks = message.count('?')
        confusion_score += min(question_marks * 0.1, 0.2)  # Max 0.2 from questions
        
        # Check for emotional indicators
        emotional_indicators = ['frustrated', 'annoying', 'hate', 'terrible', 'awful', 'stupid']
        if any(indicator in message_lower for indicator in emotional_indicators):
            confusion_score += 0.3
        
        # Check for technical error patterns
        error_patterns = [
            r'error\s+\d+',  # "error 404", "error 500", etc.
            r'exception',
            r'failed',
            r'crash',
            r'freeze',
            r'hang'
        ]
        
        for pattern in error_patterns:
            if re.search(pattern, message_lower):
                confusion_score += 0.25
                break
        
        # Check for negative words
        negative_words = ["can't", "cannot", "unable", "doesn't", "won't", "isn't", "aren't"]
        negative_count = sum(1 for word in negative_words if word in message_lower)
        confusion_score += min(negative_count * 0.15, 0.3)
        
        # Ensure score is between 0 and 1
        return min(max(confusion_score, 0.0), 1.0)