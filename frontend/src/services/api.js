import axios from 'axios'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error)
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      throw new APIError(
        data.detail || data.message || 'Server error occurred',
        status,
        data
      )
    } else if (error.request) {
      // Network error
      throw new APIError(
        'Unable to connect to server. Please check your connection.',
        0,
        null
      )
    } else {
      // Other error
      throw new APIError(
        error.message || 'An unexpected error occurred',
        0,
        null
      )
    }
  }
)

// Custom API Error class
export class APIError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

export default apiClient