import apiClient from './api'

export class AgoraService {
  /**
   * Generate Agora token for screen sharing
   * @param {string} channelName - Agora channel name
   * @param {number} uid - User ID (0 for auto-assignment)
   * @param {number} role - User role (1 for publisher, 2 for subscriber)
   * @returns {Promise<Object>} Agora token response
   */
  async generateToken(channelName, uid = 0, role = 1) {
    try {
      const response = await apiClient.post('/api/v1/agora/token', {
        channel_name: channelName,
        uid,
        role
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Failed to generate Agora token:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate a unique channel name for a session
   * @param {string} sessionId - Optional session ID
   * @returns {string} Unique channel name
   */
  generateChannelName(sessionId = null) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const session = sessionId || `session`
    return `support_${session}_${timestamp}_${random}`
  }

  /**
   * Validate channel name according to Agora requirements
   * @param {string} channelName - Channel name to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateChannelName(channelName) {
    // Agora channel name requirements:
    // - ASCII letters, numbers, underscore, hyphen
    // - 1-64 characters
    const pattern = /^[a-zA-Z0-9_-]{1,64}$/
    return pattern.test(channelName)
  }

  /**
   * Get Agora app configuration
   * @returns {Object} Agora configuration
   */
  getAgoraConfig() {
    return {
      // These would typically come from environment variables
      // For demo purposes, we'll use placeholder values
      appId: import.meta.env.VITE_AGORA_APP_ID || 'demo_app_id',
      // Note: Never put the app certificate in frontend code!
      // Tokens should always be generated on the backend
    }
  }
}

// Export a singleton instance
export const agoraService = new AgoraService()