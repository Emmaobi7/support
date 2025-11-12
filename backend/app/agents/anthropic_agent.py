import anthropic
from typing import List
from datetime import datetime
import uuid
import re

from app.agents.base import AIAgent
from app.models import ChatMessage, ChatResponse, MessageRole, AgentConfig
from app.services.context_store import retrieve_similar_context


class AnthropicAgent(AIAgent):
    """Anthropic Claude-powered support agent implementation (updated for Messages API)."""

    def __init__(self, config: AgentConfig, api_key: str):
        super().__init__(config)
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = config.model

        # Define common confusion detection keywords
        self.confusion_keywords = [
            "help", "stuck", "error", "problem", "issue", "confused", "not working",
            "broken", "can't", "unable", "difficulty", "trouble", "struggling",
            "don't understand", "how do i", "where is", "can't find",
            "doesn't work", "failed", "wrong", "incorrect", "bug"
        ]

        self.screen_share_triggers = [
            "share your screen", "screen sharing", "show me your screen",
            "can you share", "let me see", "visual guidance"
        ]

    async def generate_response(
        self,
        messages: List[ChatMessage],
        user_message: str
    ) -> ChatResponse:
        """Generate response using Anthropic Claude (Messages API)."""

        # Analyze confusion level
        confusion_level = await self.analyze_confusion_level(user_message)
        should_share = self.should_request_screen_share(confusion_level)

        # Prepare system prompt
        system_prompt = self.system_prompt or ""
        # Attempt to retrieve relevant context (supabase) and prepend to system prompt
        try:
            context_docs = []
            # run retrieval in a thread because retrieve_similar_context is sync
            import asyncio
            context_docs = await asyncio.to_thread(retrieve_similar_context, user_message, 3)
            if context_docs:
                context_block = "\n\nRelevant Context:\n" + "\n---\n".join(context_docs)
                system_prompt = context_block + "\n\n" + system_prompt
        except Exception as e:
            # retrieval failure should not block response generation
            print('Context retrieval failed:', e)
        if should_share:
            system_prompt += (
                "\n\nThe user appears to be having difficulty. "
                "Please politely suggest that they share their screen for visual assistance."
            )

        # Convert chat history to Anthropic-style message format
        formatted_messages = []
        for msg in messages:
            role = "user" if msg.role == MessageRole.USER else "assistant"
            formatted_messages.append({"role": role, "content": msg.content})

        # Append the current user message
        formatted_messages.append({"role": "user", "content": user_message})

        try:
            # Use Claude Messages API (new standard for 3.0+ models)
            response = await self.client.messages.create(
                model=self.model,
                system=system_prompt,
                max_tokens=self.config.max_tokens or 1000,
                temperature=self.config.temperature or 0.7,
                messages=formatted_messages,
            )

            # Extract text from the response
            ai_message_content = ""
            if hasattr(response, "content") and len(response.content) > 0:
                ai_message_content = response.content[0].text

            ai_message = ChatMessage(
                id=str(uuid.uuid4()),
                role=MessageRole.ASSISTANT,
                content=ai_message_content,
                timestamp=datetime.utcnow(),
                metadata={
                    "model": self.model,
                    "confusion_level": confusion_level,
                    "stop_reason": getattr(response, "stop_reason", None),
                }
            )

            # Detect if the model itself suggests screen sharing
            contains_screen_share_request = any(
                trigger in ai_message_content.lower()
                for trigger in self.screen_share_triggers
            )

            return ChatResponse(
                message=ai_message,
                conversation_id=str(uuid.uuid4()),
                should_request_screen_share=should_share or contains_screen_share_request,
                confidence_score=confusion_level,
            )

        except Exception as e:
            # Fallback response in case of API failure
            fallback_message = ChatMessage(
                id=str(uuid.uuid4()),
                role=MessageRole.ASSISTANT,
                content=(
                    "I'm sorry, I'm having trouble connecting to my AI service right now. "
                    "Let me try to help you with a basic response. Could you please describe your issue in more detail?"
                ),
                timestamp=datetime.utcnow(),
                metadata={"error": str(e), "fallback": True},
            )

            return ChatResponse(
                message=fallback_message,
                conversation_id=str(uuid.uuid4()),
                should_request_screen_share=should_share,
                confidence_score=confusion_level,
            )

    async def analyze_confusion_level(self, message: str) -> float:
        """Analyze the user's message to determine confusion level."""
        message_lower = message.lower()
        confusion_score = 0.0

        # Check for confusion keywords
        keyword_matches = sum(1 for keyword in self.confusion_keywords if keyword in message_lower)
        confusion_score += min(keyword_matches * 0.2, 0.6)

        # Question marks
        confusion_score += min(message.count("?") * 0.1, 0.2)

        # Emotional indicators
        emotional_indicators = ["frustrated", "annoying", "hate", "terrible", "awful", "stupid"]
        if any(word in message_lower for word in emotional_indicators):
            confusion_score += 0.3

        # Error patterns
        error_patterns = [r"error\s+\d+", r"exception", r"failed", r"crash", r"freeze", r"hang"]
        for pattern in error_patterns:
            if re.search(pattern, message_lower):
                confusion_score += 0.25
                break

        # Negative words
        negative_words = ["can't", "cannot", "unable", "doesn't", "won't", "isn't", "aren't"]
        negative_count = sum(1 for word in negative_words if word in message_lower)
        confusion_score += min(negative_count * 0.15, 0.3)

        return min(max(confusion_score, 0.0), 1.0)
