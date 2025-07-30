import { useState, useCallback, useEffect } from 'react'
import { processOCR, processGPT, getTemplates, getUserProfile } from '@/lib/api/client'

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

/**
 * API呼び出しの状態管理用の型
 */
interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * 汎用的なfrext-api呼び出しフック
 */
export function useFrextApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall()
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null
        })
        return response.data
      } else {
        throw new Error(response.error || 'frext-api呼び出しに失敗しました')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({
        data: null,
        loading: false,
        error: errorMessage
      })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

/**
 * OCR処理専用フック（frext-api連携）
 */
export function useOCRProcess() {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    progress: 'idle' | 'uploading' | 'processing' | 'complete'
    result: OCRResult | null
  }>({
    loading: false,
    error: null,
    progress: 'idle',
    result: null
  })

  const processImage = useCallback(async (
    file: File,
    templateId?: number,
    options?: {
      languageHints?: string[]
      documentType?: string
    },
    onProgress?: (stage: string) => void
  ): Promise<OCRResult | null> => {
    setState({ loading: true, error: null, progress: 'uploading', result: null })
    
    try {
      onProgress?.('frext-apiに画像をアップロード中...')
      
      setState(prev => ({ ...prev, progress: 'processing' }))
      onProgress?.('frext-api経由でOCR処理中...')
      
      const response = await processOCR({
        image: file,
        templateId,
        options
      })
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'OCR処理に失敗しました')
      }
      
      setState({
        loading: false,
        error: null,
        progress: 'complete',
        result: response.data
      })
      
      onProgress?.('OCR処理完了')
      return response.data
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OCR処理に失敗しました'
      setState({
        loading: false,
        error: errorMessage,
        progress: 'idle',
        result: null
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      progress: 'idle',
      result: null
    })
  }, [])

  return {
    ...state,
    processImage,
    reset
  }
}

/**
 * GPT処理専用フック（frext-api連携）
 */
export function useGPTProcess() {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    progress: 'idle' | 'analyzing' | 'complete'
    result: GPTResult | null
  }>({
    loading: false,
    error: null,
    progress: 'idle',
    result: null
  })

  const analyzeText = useCallback(async (
    ocrResult: OCRResult,
    templateId?: number,
    customPrompt?: string,
    onProgress?: (stage: string) => void
  ): Promise<GPTResult | null> => {
    setState({ loading: true, error: null, progress: 'analyzing', result: null })
    
    try {
      onProgress?.('frext-api経由でAI分析中...')
      
      const response = await processGPT({
        ocrResult,
        templateId,
        customPrompt
      })
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'GPT処理に失敗しました')
      }
      
      setState({
        loading: false,
        error: null,
        progress: 'complete',
        result: response.data
      })
      
      onProgress?.('AI分析完了')
      return response.data
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GPT処理に失敗しました'
      setState({
        loading: false,
        error: errorMessage,
        progress: 'idle',
        result: null
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      progress: 'idle',
      result: null
    })
  }, [])

  return {
    ...state,
    analyzeText,
    reset
  }
}

/**
 * 統合処理フック（OCR + GPT同時実行）
 */
export function useCompleteProcess() {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    progress: 'idle' | 'uploading' | 'ocr' | 'gpt' | 'complete'
    ocrResult: OCRResult | null
    gptResult: GPTResult | null
  }>({
    loading: false,
    error: null,
    progress: 'idle',
    ocrResult: null,
    gptResult: null
  })

  const processCompleteImage = useCallback(async (
    file: File,
    templateId?: number,
    options?: {
      languageHints?: string[]
      documentType?: string
    },
    onProgress?: (stage: string, progress: number) => void
  ): Promise<{ ocrResult: OCRResult; gptResult: GPTResult } | null> => {
    setState({ 
      loading: true, 
      error: null, 
      progress: 'uploading',
      ocrResult: null,
      gptResult: null 
    })
    
    try {
      onProgress?.('frext-apiに画像をアップロード中...', 10)
      
      // まずOCR処理
      setState(prev => ({ ...prev, progress: 'ocr' }))
      onProgress?.('OCR処理中...', 30)
      
      const ocrResponse = await processOCR({
        image: file,
        templateId,
        options
      })
      
      if (!ocrResponse.success || !ocrResponse.data) {
        throw new Error(ocrResponse.error || 'OCR処理に失敗しました')
      }
      
      setState(prev => ({ ...prev, ocrResult: ocrResponse.data || null, progress: 'gpt' }))
      onProgress?.('AI分析中...', 70)
      
      // 次にGPT処理
      const gptResponse = await processGPT({
        ocrResult: ocrResponse.data,
        templateId
      })
      
      if (!gptResponse.success || !gptResponse.data) {
        throw new Error(gptResponse.error || 'GPT処理に失敗しました')
      }
      
      const result = {
        ocrResult: ocrResponse.data,
        gptResult: gptResponse.data
      }
      
      setState({
        loading: false,
        error: null,
        progress: 'complete',
        ocrResult: ocrResponse.data,
        gptResult: gptResponse.data
      })
      
      onProgress?.('処理完了', 100)
      return result
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '処理に失敗しました'
      setState({
        loading: false,
        error: errorMessage,
        progress: 'idle',
        ocrResult: null,
        gptResult: null
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      progress: 'idle',
      ocrResult: null,
      gptResult: null
    })
  }, [])

  return {
    ...state,
    processComplete: processCompleteImage,
    reset
  }
}

/**
 * テンプレート取得フック（frext-api連携）
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getTemplates()
      
      if (response.success && response.data) {
        setTemplates(response.data)
      } else {
        throw new Error(response.error || 'テンプレートの取得に失敗しました')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'テンプレートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // 初回マウント時に自動取得
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    refetch: fetchTemplates
  }
}

/**
 * ユーザープロフィール取得フック（frext-api連携）
 */
export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getUserProfile()
      
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        throw new Error(response.error || 'ユーザー情報の取得に失敗しました')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    loading,
    error,
    fetchProfile,
    refetch: fetchProfile
  }
}

/**
 * フォーム状態管理フック
 */
export function useFormState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  const updateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value }))
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const setFieldError = useCallback(<K extends keyof T>(
    field: K,
    error: string
  ) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    setErrors({})
  }, [initialState])

  const hasErrors = Object.keys(errors).length > 0

  return {
    state,
    errors,
    hasErrors,
    updateField,
    setFieldError,
    clearErrors,
    reset,
    setState
  }
}

/**
 * ローカルストレージフック（frext-web用）
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(`frext_${key}`)
        return item ? JSON.parse(item) : initialValue
      }
      return initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "frext_${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`frext_${key}`, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "frext_${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`frext_${key}`)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "frext_${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * デバウンス付きの値更新フック
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * frext-api接続状態監視フック
 */
export function useApiConnection() {
  const [isConnected, setIsConnected] = useState<boolean>(true)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const checkConnection = useCallback(async () => {
    try {
      // frext-apiのヘルスチェックエンドポイントを呼び出し
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      
      const connected = response.ok
      setIsConnected(connected)
      setLastChecked(new Date())
      
      return connected
    } catch {
      setIsConnected(false)
      setLastChecked(new Date())
      return false
    }
  }, [])

  // 定期的な接続チェック（30秒間隔）
  useEffect(() => {
    const interval = setInterval(checkConnection, 30000)
    
    // 初回チェック
    checkConnection()
    
    return () => clearInterval(interval)
  }, [checkConnection])

  // ページがフォーカスされた時にもチェック
  useEffect(() => {
    const handleFocus = () => checkConnection()
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [checkConnection])

  return {
    isConnected,
    lastChecked,
    checkConnection
  }
}