'use client'

import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { FileText, Brain, ArrowLeft, Download, Save, AlertCircle } from 'lucide-react'

// lucide-reactが見つからないため、一時的にプレースホルダーアイコンを使用
const FileText = () => <span>📄</span>
const Brain = () => <span>🧠</span>
const ArrowLeft = () => <span>←</span>
const Download = () => <span>⬇️</span>
const Save = () => <span>💾</span>
const AlertCircle = () => <span>⚠️</span>
import Link from 'next/link'

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

interface ProcessingResult {
  ocrResult: OCRResult
  gptResult: GPTResult
  templateId?: string
  fileName: string
  timestamp: string
}

export default function ResultPage() {
  // const router = useRouter()
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // 相対時間取得（@frext/utilsがないため内部実装）
  const getRelativeTime = (dateString: string): string => {
    const now = new Date()
    const target = new Date(dateString)
    const diffMs = now.getTime() - target.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return 'たった今'
    if (diffMinutes < 60) return `${diffMinutes}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 30) return `${diffDays}日前`
    
    return target.toLocaleDateString('ja-JP')
  }

  useEffect(() => {
    // TODO: 実際の環境では、URLパラメータのIDからfrext-api経由で結果を取得
    // 現在はセッションストレージから取得（プロトタイプ用）
    try {
      const storedResult = sessionStorage.getItem('processingResult')
      if (storedResult) {
        const parsedResult: ProcessingResult = JSON.parse(storedResult)
        setResult(parsedResult)
      } else {
        setError('処理結果が見つかりません。再度アップロードしてください。')
      }
    } catch (error) {
      console.error('結果の読み込みエラー:', error)
      setError('結果の読み込み中にエラーが発生しました。')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSaveResult = async () => {
    if (!result) return

    setIsSaving(true)
    try {
      // TODO: frext-api経由で結果を保存
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/results/save`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ocrResult: result.ocrResult,
      //     gptResult: result.gptResult,
      //     templateId: result.templateId ? parseInt(result.templateId) : undefined
      //   })
      // })

      // 仮の保存処理（2秒待機）
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('結果を保存しました！（※実際のAPIが利用可能になったら正式保存されます）')
      
    } catch (error) {
      console.error('保存エラー:', error)
      alert(error instanceof Error ? error.message : '保存中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportResult = () => {
    if (!result) return

    const exportData = {
      fileName: result.fileName,
      processedAt: result.timestamp,
      template: result.templateId || 'generic',
      ocr: {
        extractedText: result.ocrResult.extractedText,
        confidence: result.ocrResult.confidence
      },
      analysis: {
        summary: result.gptResult.summary,
        categories: result.gptResult.categories,
        extractedData: result.gptResult.extractedData,
        confidence: result.gptResult.confidence
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frext-result-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTemplateDisplayName = (templateId?: string) => {
    switch (templateId) {
      case '1': return 'レシート処理'
      case '2': return '請求書処理'
      case '3': return '名刺処理'
      default: return '汎用処理'
    }
  }

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`
  }

  const getConfidenceBadgeClass = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-3">結果を読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle />
            <span className="text-sm text-red-600">{error}</span>
          </div>
          <div className="mt-6 text-center">
            <Link href="/upload">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <ArrowLeft />
                アップロードページに戻る
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 mb-6">表示する結果がありません</p>
          <Link href="/upload">
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              新しい処理を開始
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">処理結果</h1>
            <p className="text-gray-600 mt-1">
              {result.fileName} • {getTemplateDisplayName(result.templateId)} • 
              {getRelativeTime(result.timestamp)}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportResult}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download />
              エクスポート
            </button>
            <button 
              onClick={handleSaveResult}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Save />
              {isSaving ? '保存中...' : '保存'}
            </button>
            <Link href="/upload">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                <ArrowLeft />
                新しい処理
              </button>
            </Link>
          </div>
        </div>

        {/* OCR結果 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FileText />
            <h2 className="text-xl font-semibold">OCR抽出結果</h2>
          </div>
          <p className="text-gray-600 mb-4">画像から抽出されたテキスト情報</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">信頼度</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceBadgeClass(result.ocrResult.confidence)}`}>
                {formatConfidence(result.ocrResult.confidence)}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {result.ocrResult.extractedText}
              </p>
            </div>
          </div>
        </div>

        {/* GPT処理結果 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Brain />
            <h2 className="text-xl font-semibold">AI分析結果</h2>
          </div>
          <p className="text-gray-600 mb-4">AIによる要約・分類・構造化結果</p>
          
          <div className="space-y-6">
            {/* 要約 */}
            <div>
              <h3 className="font-medium mb-2">要約</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.gptResult.summary}
              </p>
            </div>

            {/* カテゴリ */}
            {result.gptResult.categories.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">カテゴリ</h3>
                <div className="flex flex-wrap gap-2">
                  {result.gptResult.categories.map((category, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 抽出データ */}
            <div>
              <h3 className="font-medium mb-2">構造化データ</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {Object.entries(result.gptResult.extractedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <span className="text-sm font-medium text-gray-600">
                      {key}:
                    </span>
                    <span className="text-sm text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 信頼度 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">AI分析信頼度</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceBadgeClass(result.gptResult.confidence)}`}>
                {formatConfidence(result.gptResult.confidence)}
              </span>
            </div>
          </div>
        </div>

        {/* アクションカード */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-dashed p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">次のアクション</h3>
            <p className="text-gray-600 mb-4">
              結果をさらに活用したり、新しい処理を開始できます
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/templates">
                <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  他のテンプレートを試す
                </button>
              </Link>
              <Link href="/upload">
                <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  新しい画像を処理
                </button>
              </Link>
              <button 
                disabled
                className="px-4 py-2 border border-gray-300 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
              >
                処理履歴を見る（TODO）
              </button>
            </div>
          </div>
        </div>

        {/* フィードバック */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                💡
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">結果の精度向上について</h4>
              <p className="text-sm text-blue-800 mt-1">
                より正確な結果を得るには、画像の品質を向上させるか、適切なテンプレートを選択してください。
                手書き文字が多い場合は、デジタル化された文書での再処理をお勧めします。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}