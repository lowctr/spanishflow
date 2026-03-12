import axios from 'axios'

// Get API URL dynamically - in production, use window.location.origin + /api for current domain
// or read from environment variable
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // In production on Render, construct the backend URL from frontend domain
  if (window.location.hostname.includes('onrender.com')) {
    // spanishflow-frontend.onrender.com → spanishflow-backend.onrender.com/api
    const backendUrl = window.location.hostname.replace('frontend', 'backend')
    return `https://${backendUrl}/api`
  }
  return '/api'
}

const BASE_URL = getBaseUrl()

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Attach Telegram initData as Bearer token
apiClient.interceptors.request.use((config) => {
  const initData = window?.Telegram?.WebApp?.initData || 'dev_mode'
  config.headers['Authorization'] = `Bearer ${initData}`
  return config
})

// Response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.detail || error.message || 'Network error'
    console.error('[API Error]', message, error?.response?.status)
    return Promise.reject(error)
  }
)

export const api = {
  // Auth
  authenticate: (initData, dailyGoal) =>
    apiClient.post('/auth/telegram', { init_data: initData, daily_goal: dailyGoal }),

  // Session
  getDailySession: (extra = 0) => apiClient.get(`/session/daily${extra > 0 ? `?extra=${extra}` : ''}`),
  getReviewSession: () => apiClient.get('/session/review'),

  submitAnswer: (wordId, exerciseType, isCorrect, stage) =>
    apiClient.post('/session/answer', {
      word_id: wordId,
      exercise_type: exerciseType,
      is_correct: isCorrect,
      stage: stage,
    }),

  getArenaWords: () => apiClient.get('/session/arena'),

  // Settings
  updateSettings: (dailyGoal) => apiClient.patch('/auth/settings', { daily_goal: dailyGoal }),

  // Stats
  getStats: () => apiClient.get('/stats'),
}

export default apiClient
