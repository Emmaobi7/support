# 🔑 AI API Keys Setup Guide

## 📋 **What You Need**

Your AI Support Assistant uses these services:
1. **OpenAI** (for ChatGPT/GPT models) - PAID
2. **Anthropic** (for Claude models) - PAID  
3. **Agora** (for screen sharing) - FREE TIER + PAID

## 💰 **Cost Breakdown**

### OpenAI Pricing (November 2025)
| Model | Input Cost | Output Cost | ~Cost per 1000 messages |
|-------|------------|-------------|-------------------------|
| GPT-3.5 Turbo | $3/1M tokens | $6/1M tokens | $0.30-0.60 |
| GPT-4 Turbo | $10/1M tokens | $30/1M tokens | $2-4 |
| GPT-4 | $30/1M tokens | $60/1M tokens | $6-12 |

### Anthropic Pricing
| Model | Input Cost | Output Cost | ~Cost per 1000 messages |
|-------|------------|-------------|-------------------------|
| Claude-3 Haiku | $0.25/1M tokens | $1.25/1M tokens | $0.08-0.38 |
| Claude-3 Sonnet | $3/1M tokens | $15/1M tokens | $0.90-1.80 |
| Claude-3 Opus | $15/1M tokens | $75/1M tokens | $4.50-22.50 |

### Agora Pricing
- **FREE**: 10,000 minutes per month
- **PAID**: $0.99 per 1,000 minutes after free tier

## 🚀 **Getting Started Options**

### Option 1: **Full Setup** (Recommended for Production)
Get all API keys for complete functionality

### Option 2: **Cost-Effective** (Recommended for Development)  
Start with GPT-3.5 Turbo only + Agora free tier

### Option 3: **Demo Mode** (Free)
The app works without API keys using fallback responses

## 📝 **Step-by-Step Setup**

### 1. **OpenAI Setup** 🤖

**Step 1:** Go to https://platform.openai.com/
**Step 2:** Create account or log in
**Step 3:** Add payment method (required for API access)
**Step 4:** Go to https://platform.openai.com/api-keys
**Step 5:** Click "Create new secret key"
**Step 6:** Copy the key (starts with `sk-...`)

**Add to .env:**
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

**💡 Money-saving tip:** Start with gpt-3.5-turbo, upgrade to gpt-4 later

### 2. **Anthropic Setup** 🧠

**Step 1:** Go to https://console.anthropic.com/
**Step 2:** Create account or log in
**Step 3:** Go to https://console.anthropic.com/account/keys
**Step 4:** Click "Create Key"
**Step 5:** Copy the key (starts with `sk-ant-...`)

**Add to .env:**
```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

**💡 Money-saving tip:** Use claude-3-haiku for cost-effective responses

### 3. **Agora Setup** 📺

**Step 1:** Go to https://www.agora.io/
**Step 2:** Sign up for free account
**Step 3:** Create a new project
**Step 4:** Go to project settings
**Step 5:** Copy App ID and App Certificate

**Add to .env:**
```env
AGORA_APP_ID=your-app-id-here
AGORA_APP_CERTIFICATE=your-certificate-here
```

**💡 Free tier:** 10,000 minutes/month is plenty for development

## 💸 **Cost Management Tips**

### 1. **Start Cheap**
```env
DEFAULT_OPENAI_MODEL=gpt-3.5-turbo
DEFAULT_ANTHROPIC_MODEL=claude-3-haiku
AI_MAX_TOKENS=500
```

### 2. **Monitor Usage**
- Check OpenAI dashboard: https://platform.openai.com/usage
- Check Anthropic dashboard: https://console.anthropic.com/account/billing
- Set spending limits in both platforms

### 3. **Development vs Production**
```env
# Development (cheap)
DEFAULT_OPENAI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=500

# Production (better quality)  
DEFAULT_OPENAI_MODEL=gpt-4-turbo
AI_MAX_TOKENS=1000
```

## 🆓 **Free Development Options**

### Option 1: **No API Keys**
- App works with simulated responses
- Perfect for UI development
- No costs involved

### Option 2: **OpenAI Free Credits**
- New accounts get $5 in free credits
- Enough for ~1000-5000 messages
- Good for initial testing

### Option 3: **Anthropic Free Usage**
- New accounts get some free usage
- Good for comparing AI providers

## ⚠️ **Important Security Notes**

### Never commit real API keys to git!
```bash
# Add to .gitignore (already done)
.env
*.key
```

### Use different keys for development/production
```env
# Development
OPENAI_API_KEY=sk-dev-key...

# Production  
OPENAI_API_KEY=sk-prod-key...
```

## 🧪 **Testing Your Setup**

### Test without API keys:
```bash
# 1. Leave API keys as placeholders
# 2. Start the app
# 3. You'll see "Offline Mode" - this is normal!
# 4. Chat still works with fallback responses
```

### Test with OpenAI only:
```bash
# 1. Add only OPENAI_API_KEY
# 2. Start app
# 3. Should show "Online • openai"
# 4. Chat with real AI responses!
```

### Test provider switching:
```bash
# 1. Add both OPENAI_API_KEY and ANTHROPIC_API_KEY  
# 2. Test switching: curl -X POST "http://localhost:8000/api/v1/agent/switch?provider=anthropic"
```

## 💡 **Recommended Development Flow**

### Phase 1: **UI Development** (Free)
- No API keys needed
- Focus on frontend/UI
- Use fallback responses

### Phase 2: **Basic AI** ($5-10/month)
- Add OpenAI key with gpt-3.5-turbo
- Test real AI conversations
- Monitor usage

### Phase 3: **Full Features** ($10-30/month)
- Add Anthropic key
- Add Agora credentials
- Test all features

### Phase 4: **Production** ($50+/month)
- Upgrade to better models
- Increase token limits  
- Monitor and optimize

## 🔧 **Quick Setup Commands**

```bash
# 1. Copy your keys to .env
nano backend/.env

# 2. Restart backend to load new keys
cd backend
source venv/bin/activate  
python -m uvicorn app.main:app --reload

# 3. Test the connection
curl http://localhost:8000/api/v1/health

# 4. Check current provider
curl http://localhost:8000/api/v1/agent/current
```

## 🆘 **Troubleshooting**

### "Offline Mode" in UI
- Check if backend is running
- Verify API keys are correctly formatted
- Check backend logs for errors

### "Invalid API Key" errors
- Verify key format (OpenAI: sk-..., Anthropic: sk-ant-...)
- Check if payment method is added
- Ensure keys have sufficient credits

### High costs
- Switch to cheaper models
- Reduce AI_MAX_TOKENS
- Monitor usage dashboards
- Set spending limits

---

## 🎯 **Quick Start for Impatient Developers**

Want to test immediately? Start without API keys:
1. Keep placeholder values in .env
2. Start the app
3. Chat works with fallback responses
4. Add real keys when ready to test AI features

Your app is designed to work gracefully with or without API keys! 🚀