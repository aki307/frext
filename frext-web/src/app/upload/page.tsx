'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

// lucide-reactが見つからないため、一時的にプレースホルダーアイコンを使用
const Upload = () => <span>📤</span>
const AlertCircle = () => <span>⚠️</span>
const CheckCircle2 = () => <span>✅</span>

// 現在のpackage.jsonに@frext/types, @frext/utilsがないため、基本的な型定義を含める
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

// TODO: @frext/typesパッケージが利用可能になったら置き換える
// import type { OCRResult } from '@frext/types'

export default function UploadPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'upload' | 'ocr' | 'gpt' | 'complete'>('upload')

  // TODO: テンプレート一覧をfrext-apiから取得
  const templates = [
    { id: '1', name: 'レシート処理', description: '食費や日用品の管理に' },
    { id: '2', name: '請求書処理', description: 'ビジネス支出の管理に' },
    { id: '3', name: '名刺処理', description: '連絡先の整理に' },
  ]

  // ファイルサイズをフォーマット（@frext/utilsがないため内部実装）
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // ファイルタイプ検証（@frext/utilsがないため内部実装）
  const validateFileType = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    return allowedTypes.includes(file.type)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        setError(`ファイルサイズは10MB以下にしてください（現在: ${formatFileSize(file.size)}）`)
        return
      }

      // ファイル形式チェック
      if (!validateFileType(file)) {
        setError('対応している画像ファイル（JPEG, PNG, WebP, HEIC）を選択してください')
        return
      }

      setSelectedFile(file)
      setError('')
    }
  }

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Step 1: OCR処理（frext-apiクライアントがないため、直接fetch使用）
      setStep('ocr')
      console.log('OCR処理を開始...', {
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size)
      })
      
      // TODO: 実際のfrext-api呼び出しに置き換える
      // const formData = new FormData()
      // formData.append('image', selectedFile)
      // if (selectedTemplate) formData.append('templateId', selectedTemplate)
      
      // const ocrResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/ocr/process`, {
      //   method: 'POST',
      //   body: formData
      // })
      
      // 仮のOCR処理（2秒待機）
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const ocrResult: OCRResult = {
        extractedText: `サンプルのOCR結果\n店舗名: ${selectedFile.name.split('.')[0]}\n金額: 1,500円\n日付: 2025年1月26日`,
        confidence: 0.95,
        processingTime: Date.now()
      }

      // Step 2: GPT処理
      setStep('gpt')
      console.log('GPT処理を開始...', {
        textLength: ocrResult.extractedText.length,
        confidence: ocrResult.confidence
      })
      
      // TODO: 実際のfrext-api呼び出しに置き換える
      // const gptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/gpt/process`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ocrResult, templateId: selectedTemplate })
      // })
      
      // 仮のGPT処理（3秒待機）
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const gptResult: GPTResult = {
        summary: 'レシートの内容を解析しました。日用品の購入記録です。',
        categories: ['日用品', '食費'],
        extractedData: {
          totalAmount: 1500,
          date: '2025-01-26',
          vendor: selectedFile.name.split('.')[0]
        },
        confidence: 0.92
      }

      // Step 3: 完了
      setStep('complete')
      
      // 結果をセッションストレージに保存
      const resultData = {
        ocrResult,
        gptResult,
        templateId: selectedTemplate,
        fileName: selectedFile.name,
        timestamp: new Date().toISOString()
      }
      
      sessionStorage.setItem('processingResult', JSON.stringify(resultData))
      
      // 結果ページにリダイレクト
      setTimeout(() => {
        router.push('/result')
      }, 1500)

    } catch (error) {
      console.error('処理エラー:', error)
      setError(error instanceof Error ? error.message : '処理中にエラーが発生しました')
      setStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepMessage = () => {
    switch (step) {
      case 'ocr': return '画像からテキストを抽出中...'
      case 'gpt': return 'AIが内容を分析・構造化中...'
      case 'complete': return '処理完了！結果ページに移動します...'
      default: return ''
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* ヘッダー */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">画像アップロード</h2>
            <p className="text-gray-600 mt-2">
              レシートや資料の画像をアップロードして、AI処理を開始します
            </p>
          </div>

          <div className="space-y-6">
            {/* ファイル選択 */}
            <div className="space-y-2">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                画像ファイルを選択
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    📄 {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    サイズ: {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}
            </div>

            {/* テンプレート選択 */}
            <div className="space-y-2">
              <label htmlFor="template-select" className="block text-sm font-medium text-gray-700">
                処理テンプレート（オプション）
              </label>
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">テンプレートを選択（汎用処理の場合は未選択）</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {/* 処理状況表示 */}
            {isProcessing && (
              <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle2 />
                <span className="text-sm text-blue-600">{getStepMessage()}</span>
              </div>
            )}

            {/* アップロードボタン */}
            <button
              onClick={handleProcess}
              disabled={!selectedFile || isProcessing}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  処理中...
                </>
              ) : (
                <>
                  <Upload />
                  AI処理を開始
                </>
              )}
            </button>

            {/* 処理の説明 */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• まず画像からテキストを抽出（OCR）</p>
              <p>• 次にAIが内容を分析・構造化（GPT）</p>
              <p>• 処理には30秒〜1分程度かかります</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}