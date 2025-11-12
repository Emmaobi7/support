from typing import Dict, Type
from app.agents.base import AIAgent
from app.agents.openai_agent import OpenAIAgent
from app.agents.anthropic_agent import AnthropicAgent
from app.models import AIProvider, AgentConfig

class AgentFactory:
    """Factory class for creating AI agents based on provider."""
    
    _agents: Dict[AIProvider, Type[AIAgent]] = {
        AIProvider.OPENAI: OpenAIAgent,
        AIProvider.ANTHROPIC: AnthropicAgent,
    }
    
    @classmethod
    def create_agent(
        self, 
        provider: AIProvider, 
        config: AgentConfig, 
        api_key: str
    ) -> AIAgent:
        """
        Create an AI agent instance based on the provider.
        
        Args:
            provider: The AI provider to use
            config: Configuration for the agent
            api_key: API key for the provider
            
        Returns:
            Configured AI agent instance
            
        Raises:
            ValueError: If provider is not supported
        """
        if provider not in self._agents:
            raise ValueError(f"Unsupported AI provider: {provider}")
        
        agent_class = self._agents[provider]
        return agent_class(config, api_key)
    
    @classmethod
    def get_supported_providers(self) -> list[AIProvider]:
        """Get list of supported AI providers."""
        return list(self._agents.keys())
    
    @classmethod
    def register_agent(self, provider: AIProvider, agent_class: Type[AIAgent]):
        """
        Register a new AI agent type.
        
        Args:
            provider: The AI provider enum
            agent_class: The agent class to register
        """
        self._agents[provider] = agent_class