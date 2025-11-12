# 🤖 AI Support Assistant - Complete Full-Stack Application

A modern, production-ready AI-powered customer support system with real-time screen sharing capabilities. Built with React, FastAPI, and pluggable AI architecture.

## 🌟 Features

### 🎯 **Core Functionality**
- **Real-time AI Chat**: Intelligent conversations with context awareness
- **Smart Screen Sharing**: AI detects when visual guidance is needed
- **Dual-Panel Interface**: Chat + screen sharing in one seamless experience
- **Offline Mode**: Graceful fallback when backend is unavailable

### 🤖 **Pluggable AI Architecture**
- **Multiple Providers**: OpenAI GPT, Anthropic Claude, easily extensible
- **Runtime Switching**: Change AI providers without restart
- **Smart Detection**: Analyzes user confusion to trigger screen sharing
- **Token Tracking**: Monitor usage and costs across providers

### 📺 **Advanced Screen Sharing**
- **Agora Integration**: Professional-grade screen sharing
- **Secure Tokens**: Backend-generated authentication
- **Session Management**: Automatic cleanup and error handling
- **Browser Native**: Fallback to native screen capture

### 🚀 **Production Ready**
- **Responsive Design**: Mobile-first with desktop optimization
- **Error Handling**: Comprehensive error boundaries and fallbacks
- **Loading States**: Beautiful loading indicators and status updates
- **Health Monitoring**: Real-time connection status and provider info

## 📁 Project Structure

```
ai-support/
├── 🎨 frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # UI Components
│   │   │   ├── ChatWindow.jsx   # Real-time chat interface
│   │   │   └── ScreenShare.jsx  # Screen sharing component
│   │   ├── services/            # API Layer
│   │   │   ├── api.js           # Axios configuration
│   │   │   ├── chatService.js   # Chat API integration
│   │   │   └── agoraService.js  # Agora token management
│   │   ├── pages/               # Page Components
│   │   │   └── Home.jsx         # Main application layout
│   │   └── main.jsx             # Application entry point
│   ├── package.json             # Dependencies and scripts
│   ├── .env.example            # Environment template
│   └── README.md               # Frontend documentation
│
├── 🔧 backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── agents/              # 🤖 Pluggable AI Agents
│   │   │   ├── base.py         # Abstract agent interface
│   │   │   ├── openai_agent.py # OpenAI implementation
│   │   │   └── anthropic_agent.py # Anthropic implementation
│   │   ├── api/                 # RESTful API endpoints
│   │   ├── core/                # Configuration management
│   │   ├── models/              # Pydantic data models
│   │   ├── services/            # Business logic layer
│   │   └── main.py             # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example            # Environment template
│   ├── start.sh                # Startup script
│   └── README.md               # Backend documentation
│
└── 📖 task.md                   # Project requirements
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **API Keys**: OpenAI and/or Anthropic (optional for demo)
- **Agora Account**: For production screen sharing (optional)

### 1. Clone & Setup
```bash
git clone <your-repo>
cd ai-support
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys (optional for demo)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Default config works for local development
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎮 How to Use

### 1. **Start Chatting**
- Open http://localhost:3000
- Type a message to the AI assistant
- Notice the connection status indicator

### 2. **Trigger Screen Sharing**
- Type messages with keywords like:
  - "I'm stuck"
  - "I have a problem"
  - "This isn't working"
  - "I need help"
- AI will request screen sharing

### 3. **Share Your Screen**
- Click "Share My Screen" when prompted
- Grant browser permissions
- See live preview while chatting continues

### 4. **Monitor System Status**
- Connection indicator shows online/offline status
- Current AI provider displayed in chat header
- Token usage shown for API calls
- Error messages with graceful fallbacks

## 🔧 Configuration

### Frontend Environment (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Agora Configuration
VITE_AGORA_APP_ID=your_agora_app_id_here

# Development
VITE_DEBUG=true
```

### Backend Environment (.env)
```env
# AI API Keys (optional for demo)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Agora Configuration (optional for demo)
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here

# AI Configuration
DEFAULT_AI_PROVIDER=openai
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
```

## 🎯 Key Features Demonstrated

### Smart AI Detection
The system analyzes user messages for:
- **Confusion Keywords**: "stuck", "error", "problem"
- **Emotional Indicators**: Frustration, urgency
- **Technical Patterns**: Error codes, technical issues
- **Question Density**: Multiple questions indicate uncertainty

### Pluggable Architecture
Switch AI providers easily:
```bash
# Via API
curl -X POST "http://localhost:8000/api/v1/agent/switch?provider=anthropic"

# Or through the UI (can be added)
```

### Error Handling
- **Network Issues**: Automatic fallback to offline mode
- **API Errors**: Graceful degradation with fallback responses
- **Token Limits**: Clear error messages and usage tracking
- **Screen Share Failures**: Detailed error messages and retry options

### Real-time Features
- **Connection Status**: Live monitoring of backend connectivity
- **Provider Info**: Current AI provider displayed
- **Token Usage**: Real-time API usage tracking
- **Session Management**: Automatic cleanup and error recovery

## 🔄 API Integration Flow

### Chat Flow
1. **User types message** → Frontend
2. **Message sent to backend** → ChatService
3. **AI processes message** → OpenAI/Anthropic Agent
4. **Confusion analysis** → Smart detection algorithm
5. **Response returned** → Frontend with screen share flag
6. **UI updates** → Show response + screen share request

### Screen Share Flow
1. **AI requests screen sharing** → Backend analysis
2. **Generate Agora token** → Backend AgoraService
3. **User clicks "Share Screen"** → Frontend
4. **Browser permission request** → Native API
5. **Stream established** → Live video feed
6. **Session info displayed** → Channel name, token expiry

## 🧪 Testing

### Test Chat API
```bash
curl -X POST "http://localhost:8000/api/v1/chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "I need help with my computer",
    "user_id": "test_user"
  }'
```

### Test Provider Switching
```bash
curl -X POST "http://localhost:8000/api/v1/agent/switch?provider=anthropic"
```

### Test Health Check
```bash
curl -X GET "http://localhost:8000/api/v1/health"
```

## 🚀 Production Deployment

### Backend
```bash
# Using Docker
docker build -t ai-support-backend backend/
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key ai-support-backend

# Or traditional deployment
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
npm run build
# Deploy dist/ folder to your static hosting service
```

### Environment Setup
- Set `DEBUG=false` for production
- Configure proper CORS origins
- Use secure secret keys
- Set up monitoring and logging

## 🎨 Customization

### Adding New AI Providers
1. **Create agent class** implementing `AIAgent` interface
2. **Register in factory** (`app/agents/__init__.py`)
3. **Add configuration** in settings
4. **Update frontend** if needed

### UI Customization
- **Tailwind Classes**: Easy styling modifications
- **Component Props**: Flexible component configuration
- **Theme Variables**: Consistent color and spacing
- **Responsive Design**: Built-in mobile optimization

## 🔍 Troubleshooting

### Common Issues

**Frontend shows "Offline Mode"**
- Check if backend is running on port 8000
- Verify CORS configuration in backend
- Check browser console for network errors

**AI responses are fallback messages**
- Verify API keys in backend .env file
- Check API key validity and quotas
- Monitor backend logs for detailed errors

**Screen sharing fails**
- Grant browser permissions for screen capture
- Check Agora configuration (optional for demo)
- Verify HTTPS in production (required for screen capture)

### Debug Mode
Enable detailed logging:
```env
# Frontend
VITE_DEBUG=true

# Backend  
DEBUG=true
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code standards** (ESLint, Black, etc.)
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit pull request**

## 📈 Monitoring & Analytics

The system provides comprehensive metrics:
- **API Response Times**: Monitor backend performance
- **Token Usage**: Track AI API costs
- **Confusion Scores**: User satisfaction indicators
- **Error Rates**: System reliability metrics
- **Connection Status**: Real-time health monitoring

## 🔐 Security

- **API Keys**: Never exposed in frontend
- **CORS**: Properly configured origins
- **Token Expiry**: Agora tokens automatically expire
- **Error Handling**: No sensitive data in error messages
- **Environment Variables**: Secure configuration management

---

## 🎉 Success! Your AI Support Assistant is Live!

### What You've Built:
✅ **Full-stack application** with React frontend and FastAPI backend  
✅ **Pluggable AI architecture** supporting multiple providers  
✅ **Real-time chat** with intelligent conversation management  
✅ **Smart screen sharing** with automatic triggers  
✅ **Production-ready features** with error handling and monitoring  
✅ **Beautiful, responsive UI** with loading states and status indicators  

### Test It Out:
1. 💬 **Chat with AI** - Try different message types
2. 🖥️ **Trigger screen sharing** - Type "I'm stuck"
3. 🔄 **See real-time updates** - Connection status, provider info
4. 🛠️ **Handle errors gracefully** - Stop backend, see offline mode

Built with ❤️ using React, FastAPI, OpenAI, Anthropic, and Agora for the ultimate AI support experience!# support
