'use client'

import { useEffect, useState } from 'react'
// import { Receipt, FileSpreadsheet, BookOpen, Plus, AlertCircle } from 'lucide-react'

// lucide-reactが見つからないため、一時的にプレースホルダーアイコンを使用
const Receipt = () => <span>🧾</span>
const FileSpreadsheet = () => <span>📊</span>
const BookOpen = () => <span>📖</span>
const Plus = () => <span>➕</span>
const AlertCircle = () => <span>⚠️</span>
// import Link from 'next/link'

// 現在のpackage.jsonに@frext/typesがないため、基本的な型定義を含める
interface Template {
  id: number
  name: string
  description: string
  category: string
  expectedFields: string[]
  usageCount: number
  isActive: boolean
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // TODO: frext-api経由でテンプレート一覧を取得
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/templates`)
      // const data = await response.json()
      
      // 仮のデータ（2秒待機後に設定）
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockTemplates: Template[] = [
        {
          id: 1,
          name: "レシート処理",
          description: "レシートから商品名、金額、店舗情報を抽出し、支出カテゴリに分類します",
          category: "家計管理",
          expectedFields: ["totalAmount", "tax", "date", "vendor", "items"],
          usageCount: 1250,
          isActive: true
        },
        {
          id: 2,
          name: "請求書処理",
          description: "請求書から金額、支払期限、項目を抽出し、会計データとして整理します",
          category: "ビジネス",
          expectedFields: ["totalAmount", "dueDate", "invoiceNumber", "vendor", "items"],
          usageCount: 890,
          isActive: true
        },
        {
          id: 3,
          name: "名刺処理",
          description: "名刺から氏名、会社名、連絡先を抽出し、連絡先リストに追加します",
          category: "ビジネス",
          expectedFields: ["name", "company", "title", "email", "phone", "address"],
          usageCount: 650,
          isActive: true
        }
      ]

      setTemplates(mockTemplates)
    } catch (error) {
      console.error('テンプレート取得エラー:', error)
      setError(error instanceof Error ? error.message : 'テンプレートの読み込み中にエラーが発生しました')
      
      // エラー時もフォールバック用のモックデータを設定
      setTemplates([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTemplate = (templateId: number) => {
    // テンプレート選択処理
    // アップロードページにリダイレクト（選択されたテンプレート情報付き）
    const searchParams = new URLSearchParams()
    searchParams.set('templateId', templateId.toString())
    window.location.href = `/upload?${searchParams.toString()}`
  }

  const getTemplateIcon = (templateName: string) => {
    const name = templateName.toLowerCase()
    if (name.includes('レシート') || name.includes('receipt')) return Receipt
    if (name.includes('請求書') || name.includes('invoice')) return FileSpreadsheet
    if (name.includes('名刺') || name.includes('card')) return BookOpen
    return FileSpreadsheet
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '家計管理': return 'bg-green-100 text-green-800'
      case 'ビジネス': return 'bg-blue-100 text-blue-800'
      case '医療': return 'bg-red-100 text-red-800'
      case '教育': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-3">テンプレートを読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">処理テンプレート</h1>
          <p className="text-gray-600">
            用途に応じたテンプレートを選択して、最適な結果を得ましょう
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle />
            <span className="text-sm text-red-600 flex-grow">{error}</span>
            <button 
              onClick={loadTemplates}
              className="ml-4 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 transition-colors"
            >
              再試行
            </button>
          </div>
        )}

        {/* テンプレート一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.filter(template => template.isActive).map((template) => {
            const IconComponent = getTemplateIcon(template.name)
            return (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-4">
                  <IconComponent />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>

                {/* 期待されるフィールド */}
                <div className="mb-4">
                  <span className="text-xs text-gray-500 block mb-1">抽出される情報:</span>
                  <div className="flex flex-wrap gap-1">
                    {template.expectedFields.slice(0, 3).map((field, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
                        {field}
                      </span>
                    ))}
                    {template.expectedFields.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
                        +{template.expectedFields.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* 利用統計 */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>利用回数</span>
                  <span>{template.usageCount.toLocaleString()}回</span>
                </div>
                
                <button 
                  onClick={() => handleSelectTemplate(template.id)}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  このテンプレートを使用
                </button>
              </div>
            )
          })}
        </div>

        {/* カスタムテンプレート作成 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-dashed p-12">
          <div className="text-center">
            <Plus />
            <h3 className="text-lg font-medium mb-2">カスタムテンプレート</h3>
            <p className="text-gray-600 mb-4">
              独自の処理ルールでカスタムテンプレートを作成できます
              <br />
              <span className="text-sm">管理者機能として提供予定</span>
            </p>
            <button 
              disabled
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
            >
              <Plus />
              カスタムテンプレート作成（TODO）
            </button>
          </div>
        </div>

        {/* テンプレート統計 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">テンプレート統計</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {templates.filter(t => t.isActive).length}
              </p>
              <p className="text-sm text-gray-600">利用可能テンプレート</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {templates.reduce((sum, t) => sum + t.usageCount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">総利用回数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(templates.map(t => t.category)).size}
              </p>
              <p className="text-sm text-gray-600">カテゴリ数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {templates.length > 0 ? Math.round(templates.reduce((sum, t) => sum + t.usageCount, 0) / templates.length) : 0}
              </p>
              <p className="text-sm text-gray-600">平均利用回数</p>
            </div>
          </div>
        </div>

        {/* フッター情報 */}
        <div className="text-center text-sm text-gray-500">
          <p>
            新しいテンプレートのリクエストや改善提案は、
            <a href="/contact" className="text-blue-600 hover:underline">
              お問い合わせ
            </a>
            からお送りください
          </p>
        </div>
      </div>
    </div>
  )
}