import apiClient from './api'

export class ChatService {
  /**
   * Send a message to the AI assistant
   * @param {string} message - User's message
   * @param {string} conversationId - Optional conversation ID
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Chat response from AI
   */
  async sendMessage(message, conversationId = null, userId = null) {
    try {
      const response = await apiClient.post('/api/v1/chat', {
        message,
        conversation_id: conversationId,
        user_id: userId
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse(message)
      }
    }
  }

  /**
   * Get conversation history
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation history
   */
  async getConversation(conversationId) {
    try {
      const response = await apiClient.get(`/api/v1/conversation/${conversationId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Failed to get conversation:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Switch AI provider
   * @param {string} provider - AI provider name (openai, anthropic)
   * @returns {Promise<Object>} Switch response
   */
  async switchAIProvider(provider) {
    try {
      const response = await apiClient.post(`/api/v1/agent/switch?provider=${provider}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Failed to switch AI provider:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get current AI provider
   * @returns {Promise<Object>} Current provider info
   */
  async getCurrentProvider() {
    try {
      const response = await apiClient.get('/api/v1/agent/current')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Failed to get current provider:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Check API health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await apiClient.get('/api/v1/health')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Fallback response when API is unavailable
   * @param {string} userMessage - User's original message
   * @returns {Object} Fallback response object
   */
  getFallbackResponse(userMessage) {
    const triggerWords = ['help', 'stuck', 'error', 'problem', 'issue', 'confused', 'not working']
    const needsScreenShare = triggerWords.some(word => 
      userMessage.toLowerCase().includes(word)
    )

    const fallbackResponses = [
      "I'm having trouble connecting to my AI service right now. Let me try to help you with a basic response.",
      "Sorry, I'm experiencing some technical difficulties. Could you please try again in a moment?",
      "I'm currently unable to access my full capabilities. Please describe your issue and I'll do my best to help."
    ]

    return {
      message: {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        timestamp: new Date().toISOString(),
        metadata: {
          fallback: true,
          offline: true
        }
      },
      conversation_id: `offline-${Date.now()}`,
      should_request_screen_share: needsScreenShare,
      confidence_score: needsScreenShare ? 0.8 : 0.2
    }
  }
}

// Export a singleton instance
export const chatService = new ChatService()