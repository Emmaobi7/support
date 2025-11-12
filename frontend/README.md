# AI Support Assistant - Frontend

A React + Vite frontend application for the AI Support Assistant with screen sharing capabilities.

## Features

- **Chat Interface**: Real-time chat with AI assistant
- **Screen Sharing**: Browser-based screen sharing with visual indicators
- **Responsive Design**: Mobile-first design with dual-panel desktop layout
- **Smart AI Detection**: AI detects user confusion and requests screen sharing
- **Modern UI**: Clean, professional interface built with Tailwind CSS

## Tech Stack

- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons
- **Agora Web SDK**: Real-time communication (ready for integration)

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Project Structure

```
src/
├── components/
│   ├── ChatWindow.jsx    # Chat interface with AI assistant
│   └── ScreenShare.jsx   # Screen sharing component
├── pages/
│   └── Home.jsx          # Main application layout
├── App.jsx               # Root component
├── main.jsx             # Application entry point
└── index.css            # Global styles with Tailwind
```

## Component Overview

### ChatWindow
- Real-time chat interface
- Message history display
- AI response simulation
- Trigger words detection for screen sharing
- Typing indicators and timestamps

### ScreenShare
- Screen sharing request UI
- Browser-native screen capture
- Live video preview
- Status indicators (requested, active)
- Human agent escalation button

### Home
- Main application layout
- Mobile/desktop responsive design
- Tab navigation for mobile
- Dual-panel layout for desktop
- Status indicators and live updates

## Features Demo

1. **Start chatting** with the AI assistant
2. **Type keywords** like "help", "stuck", "error", "problem" to trigger screen sharing request
3. **Click "Share My Screen"** when prompted
4. **Grant browser permissions** for screen sharing
5. **See live preview** of your shared screen
6. **Continue chatting** while screen is shared

## Development

- Hot reload enabled for rapid development
- ESLint configured for code quality
- Tailwind CSS with custom scrollbar styles
- Responsive breakpoints configured

## Next Steps

- Integrate with FastAPI backend
- Connect OpenAI API for real AI responses
- Implement Agora SDK for production screen sharing
- Add authentication and user management
- Implement human agent escalation

## Browser Support

- Chrome/Edge: Full screen sharing support
- Firefox: Full screen sharing support
- Safari: Limited screen sharing (requires user permission)