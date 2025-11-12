# AI Support Assistant - Backend

A FastAPI-based backend for the AI Support Assistant with pluggable AI agents and Agora screen sharing integration.

## 🚀 Features

### 🤖 Pluggable AI Architecture
- **Easy Agent Switching**: Switch between OpenAI, Anthropic, and other providers seamlessly
- **Abstract Interface**: Add new AI providers by implementing the `AIAgent` interface
- **Smart Confusion Detection**: AI analyzes user messages to detect when screen sharing is needed
- **Configurable Models**: Support for different models (GPT-4, Claude-3, etc.)

### 💬 Advanced Chat System
- **Conversation Management**: Persistent conversation history
- **Message Metadata**: Token usage, confidence scores, and analytics
- **Fallback Handling**: Graceful error handling with fallback responses
- **Real-time Processing**: Async processing for better performance

### 📺 Screen Sharing Integration
- **Agora Token Generation**: Secure token creation for screen sharing sessions
- **Channel Validation**: Automatic validation of channel names and parameters
- **Flexible Configuration**: Easy setup with environment variables

### ⚙️ Production Ready
- **Environment Configuration**: Comprehensive settings management
- **CORS Support**: Pre-configured for frontend integration
- **Health Checks**: Monitor service status and configuration
- **API Documentation**: Interactive Swagger/OpenAPI docs

## 🏗️ Architecture

```
backend/
├── app/
│   ├── agents/                 # 🤖 Pluggable AI Agents
│   │   ├── base.py            # Abstract agent interface
│   │   ├── openai_agent.py    # OpenAI GPT implementation
│   │   ├── anthropic_agent.py # Anthropic Claude implementation
│   │   └── __init__.py        # Agent factory
│   ├── api/                   # 🌐 API Endpoints
│   │   ├── endpoints.py       # Chat, Agora, agent switching
│   │   └── __init__.py
│   ├── core/                  # ⚙️ Core Configuration
│   │   ├── config.py          # Settings and environment
│   │   └── __init__.py
│   ├── models/                # 📊 Data Models
│   │   └── __init__.py        # Pydantic models
│   ├── services/              # 🔧 Business Logic
│   │   ├── chat.py            # Chat service and conversation management
│   │   ├── agora.py           # Agora token generation
│   │   └── __init__.py
│   ├── main.py               # 🎯 FastAPI application
│   └── __init__.py
├── requirements.txt          # 📦 Python dependencies
├── .env.example             # 🔧 Environment template
├── start.sh                 # 🚀 Startup script
└── README.md               # 📖 This file
```

## 🛠️ Setup & Installation

### 1. Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 4. Start the Server
```bash
# Using the startup script
./start.sh

# Or manually
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔑 Environment Variables

```env
# 🤖 AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 📺 Agora Configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here

# ⚙️ AI Configuration
DEFAULT_AI_PROVIDER=openai
DEFAULT_OPENAI_MODEL=gpt-4
DEFAULT_ANTHROPIC_MODEL=claude-3-sonnet-20240229
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000

# 🌐 API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# 🔒 CORS Configuration
CORS_ORIGINS=["http://localhost:3000"]
```

## 📡 API Endpoints

### Chat Endpoints
- **POST** `/api/v1/chat` - Send message to AI assistant
- **GET** `/api/v1/conversation/{id}` - Get conversation history

### Agent Management
- **POST** `/api/v1/agent/switch` - Switch AI provider
- **GET** `/api/v1/agent/current` - Get current AI provider

### Screen Sharing
- **POST** `/api/v1/agora/token` - Generate Agora token

### System
- **GET** `/api/v1/health` - Health check
- **GET** `/docs` - API documentation (dev mode)

## 🤖 Adding New AI Providers

The system is designed for easy extension. To add a new AI provider:

### 1. Create Agent Implementation
```python
# app/agents/your_agent.py
from app.agents.base import AIAgent
from app.models import ChatMessage, ChatResponse, AgentConfig

class YourAgent(AIAgent):
    def __init__(self, config: AgentConfig, api_key: str):
        super().__init__(config)
        # Initialize your AI client
    
    async def generate_response(self, messages: List[ChatMessage], user_message: str) -> ChatResponse:
        # Implement your AI logic
        pass
    
    async def analyze_confusion_level(self, message: str) -> float:
        # Implement confusion detection
        pass
```

### 2. Register in Factory
```python
# app/agents/__init__.py
from app.models import AIProvider
from .your_agent import YourAgent

# Add to enum
class AIProvider(str, Enum):
    YOUR_PROVIDER = "your_provider"

# Register in factory
AgentFactory._agents[AIProvider.YOUR_PROVIDER] = YourAgent
```

### 3. Update Configuration
```python
# app/core/config.py
class Settings(BaseSettings):
    your_provider_api_key: Optional[str] = None
    default_your_provider_model: str = "your-default-model"
```

## 🔧 Testing

### Test Chat Endpoint
```bash
curl -X POST "http://localhost:8000/api/v1/chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "I need help with my computer",
    "conversation_id": null,
    "user_id": "test_user"
  }'
```

### Test Agent Switching
```bash
curl -X POST "http://localhost:8000/api/v1/agent/switch?provider=anthropic"
```

### Test Agora Token Generation
```bash
curl -X POST "http://localhost:8000/api/v1/agora/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel_name": "support_session_123",
    "uid": 0,
    "role": 1
  }'
```

## 🎯 Key Features in Detail

### Smart Confusion Detection
The system analyzes user messages using multiple factors:
- **Keyword Analysis**: Detects words like "stuck", "error", "problem"
- **Emotional Indicators**: Identifies frustration or confusion
- **Technical Patterns**: Recognizes error codes and technical issues
- **Question Density**: Counts question marks and uncertainty

### Pluggable Architecture Benefits
- **Easy Testing**: Switch providers during development
- **Cost Optimization**: Use different models based on complexity
- **Reliability**: Fallback to different providers if one fails
- **Feature Comparison**: A/B test different AI capabilities

### Agora Integration
- **Secure Tokens**: Generate time-limited tokens for screen sharing
- **Channel Management**: Automatic channel validation and management
- **Role-based Access**: Publisher/subscriber role assignment

## 🚀 Deployment

### Production Checklist
- [ ] Set `DEBUG=false` in environment
- [ ] Configure proper CORS origins
- [ ] Set secure `SECRET_KEY`
- [ ] Add real API keys
- [ ] Configure proper logging
- [ ] Set up monitoring

### Docker Deployment (Optional)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔄 Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **CORS Pre-configured**: Allow requests from `http://localhost:3000`
2. **Real-time Updates**: WebSocket support can be added easily
3. **Error Handling**: Consistent error responses for frontend consumption
4. **Type Safety**: Pydantic models ensure data consistency

## 📊 Monitoring & Analytics

The system provides rich metadata for monitoring:
- **Token Usage**: Track AI API usage and costs
- **Confusion Scores**: Monitor user satisfaction
- **Response Times**: API performance metrics
- **Error Rates**: System reliability tracking

## 🤝 Contributing

To contribute new AI providers or features:

1. Follow the abstract interface patterns
2. Add comprehensive error handling
3. Include type hints and documentation
4. Test with multiple scenarios
5. Update configuration examples

---

Built with ❤️ using FastAPI, OpenAI, Anthropic, and Agora for seamless AI-powered support experiences!