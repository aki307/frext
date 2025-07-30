// 現在のpackage.jsonに@frext/typesがないため、基本的な型定義を含める
interface OCRResult {
  extractedText: string
  confidence: number
  processingTime: number
}

interface GPTResult {
  summary: string
  categories: string[]
  extractedData: Record<string, unknown>
  confidence: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface Template {
  id: number
  name: string
  description: string
  category: string
  expectedFields: string[]
  usageCount: number
  isActive: boolean
}

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

interface ProcessingHistory {
  id: string
  userId: string
  fileName: string
  templateId?: number
  templateName?: string
  ocrResult: OCRResult
  gptResult: GPTResult
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  processingDuration: number
}

/**
 * OCR処理リクエストの型
 */
interface OCRRequest {
  image: File
  templateId?: number
  options?: {
    languageHints?: string[]
    documentType?: string
  }
}

/**
 * GPT処理リクエストの型
 */
interface GPTRequest {
  ocrResult: OCRResult
  templateId?: number
  customPrompt?: string
}

/**
 * frext-api 設定
 */
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  apiPrefix: '/api/v1',
  timeout: 30000, // 30秒
  headers: {
    'Content-Type': 'application/json',
  }
}

/**
 * frext-api クライアントのベースクラス
 */
class FrextApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl + API_CONFIG.apiPrefix
    this.defaultHeaders = API_CONFIG.headers
  }

  /**
   * 認証トークンを設定
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  /**
   * 認証トークンを削除
   */
  clearAuthToken() {
    delete this.defaultHeaders['Authorization']
  }

  /**
   * 共通のfetch wrapper
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(API_CONFIG.timeout),
    }

    try {
      console.log(`[frext-api] ${options.method || 'GET'} ${endpoint}`)
      
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log(`[frext-api] Success: ${endpoint}`, data.success ? '✅' : '❌')
      
      return data

    } catch (error) {
      console.error(`[frext-api] Error: ${endpoint}`, error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'リクエストがタイムアウトしました。時間をおいて再試行してください。'
          }
        }
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          return {
            success: false,
            error: 'frext-apiサーバーに接続できません。ネットワーク接続を確認してください。'
          }
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * GET リクエスト
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST リクエスト
   */
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * FormData を使用した POST リクエスト
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const headers = { ...this.defaultHeaders }
    delete headers['Content-Type'] // FormDataの場合は自動設定させる

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    })
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<ApiResponse<{ status: string, version: string }>> {
    return this.get('/health')
  }
}

// シングルトンインスタンス
const frextApiClient = new FrextApiClient()

/**
 * OCR処理 - frext-api呼び出し
 */
export async function processOCR(request: OCRRequest): Promise<ApiResponse<OCRResult>> {
  const formData = new FormData()
  formData.append('image', request.image)
  
  if (request.templateId) {
    formData.append('templateId', request.templateId.toString())
  }
  
  if (request.options) {
    formData.append('options', JSON.stringify(request.options))
  }

  return frextApiClient.postFormData<OCRResult>('/ocr/process', formData)
}

/**
 * GPT処理 - frext-api呼び出し
 */
export async function processGPT(request: GPTRequest): Promise<ApiResponse<GPTResult>> {
  return frextApiClient.post<GPTResult>('/gpt/process', request)
}

/**
 * 統合処理（OCR + GPT） - frext-api呼び出し
 */
export async function processComplete(request: OCRRequest): Promise<ApiResponse<{
  ocrResult: OCRResult
  gptResult: GPTResult
}>> {
  const formData = new FormData()
  formData.append('image', request.image)
  
  if (request.templateId) {
    formData.append('templateId', request.templateId.toString())
  }
  
  if (request.options) {
    formData.append('options', JSON.stringify(request.options))
  }

  return frextApiClient.postFormData('/process/complete', formData)
}

/**
 * テンプレート一覧取得 - frext-api呼び出し
 */
export async function getTemplates(): Promise<ApiResponse<Template[]>> {
  return frextApiClient.get<Template[]>('/templates')
}

/**
 * テンプレート詳細取得 - frext-api呼び出し
 */
export async function getTemplate(id: number): Promise<ApiResponse<Template>> {
  return frextApiClient.get<Template>(`/templates/${id}`)
}

/**
 * 処理履歴取得 - frext-api呼び出し
 */
export async function getProcessingHistory(
  page: number = 1,
  limit: number = 20,
  filters?: {
    templateId?: number
    dateFrom?: string
    dateTo?: string
    status?: string
  }
): Promise<ApiResponse<{
  items: ProcessingHistory[]
  total: number
  page: number
  limit: number
  totalPages: number
}>> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    })
  }
  
  return frextApiClient.get(`/history?${searchParams.toString()}`)
}

/**
 * 処理結果の保存 - frext-api呼び出し
 */
export async function saveProcessingResult(data: {
  ocrResult: OCRResult
  gptResult: GPTResult
  templateId?: number
  metadata?: Record<string, unknown>
}): Promise<ApiResponse<{ id: string }>> {
  return frextApiClient.post<{ id: string }>('/results/save', data)
}

/**
 * 処理結果の取得 - frext-api呼び出し
 */
export async function getProcessingResult(id: string): Promise<ApiResponse<{
  id: string
  ocrResult: OCRResult
  gptResult: GPTResult
  templateId?: number
  createdAt: string
  metadata?: Record<string, unknown>
}>> {
  return frextApiClient.get(`/results/${id}`)
}

/**
 * ユーザー情報取得 - frext-api呼び出し
 */
export async function getUserProfile(): Promise<ApiResponse<User>> {
  return frextApiClient.get<User>('/user/profile')
}

/**
 * 使用統計取得 - frext-api呼び出し
 */
export async function getUsageStats(period: 'day' | 'week' | 'month' = 'month'): Promise<ApiResponse<{
  totalProcessed: number
  tokensUsed: number
  successRate: number
  averageConfidence: number
  topTemplates: Array<{ templateId: number, name: string, count: number }>
  dailyStats: Array<{ date: string, count: number, tokens: number }>
}>> {
  return frextApiClient.get(`/user/usage-stats?period=${period}`)
}

/**
 * 認証関連API
 */
export const authApi = {
  /**
   * ログイン - frext-api呼び出し
   */
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string, user: User }>> => {
    const response = await frextApiClient.post<{ token: string, user: User }>('/auth/login', {
      email,
      password
    })
    
    // ログイン成功時はトークンを設定
    if (response.success && response.data?.token) {
      frextApiClient.setAuthToken(response.data.token)
      // ローカルストレージにも保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('frext_auth_token', response.data.token)
      }
    }
    
    return response
  },

  /**
   * ログアウト - frext-api呼び出し
   */
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await frextApiClient.post<void>('/auth/logout')
    
    // トークンをクリア
    frextApiClient.clearAuthToken()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('frext_auth_token')
    }
    
    return response
  },

  /**
   * サインアップ - frext-api呼び出し
   */
  signup: async (userData: {
    email: string
    password: string
    name: string
  }): Promise<ApiResponse<{ token: string, user: User }>> => {
    return frextApiClient.post<{ token: string, user: User }>('/auth/signup', userData)
  },

  /**
   * トークンの検証 - frext-api呼び出し
   */
  verifyToken: async (token: string): Promise<ApiResponse<{ user: User }>> => {
    frextApiClient.setAuthToken(token)
    return frextApiClient.get<{ user: User }>('/auth/verify')
  },

  /**
   * 保存されたトークンでの自動ログイン
   */
  autoLogin: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    
    const savedToken = localStorage.getItem('frext_auth_token')
    if (!savedToken) return false
    
    try {
      const response = await authApi.verifyToken(savedToken)
      return response.success
    } catch {
      localStorage.removeItem('frext_auth_token')
      return false
    }
  }
}

/**
 * システム情報取得
 */
export async function getSystemInfo(): Promise<ApiResponse<{
  version: string
  status: string
  uptime: number
  features: string[]
}>> {
  return frextApiClient.get('/system/info')
}

/**
 * エラーハンドリング用のヘルパー関数
 */
export function handleApiError(response: ApiResponse<unknown>): never {
  throw new Error(response.error || 'frext-api request failed')
}

/**
 * frext-api クライアントインスタンスをエクスポート（カスタム用途）
 */
export { frextApiClient }

/**
 * 接続テスト
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await frextApiClient.healthCheck()
    return response.success
  } catch {
    return false
  }
}