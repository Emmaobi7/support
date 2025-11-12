import React, { useState } from 'react'
import { ArrowLeftIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'

const BACKEND_URL = (import.meta?.env?.VITE_BACKEND_URL) || 'http://localhost:8000'

const DocUpload = ({ onNavigateHome }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const MAX_CHARS = 100000

  const submit = async (e) => {
    e.preventDefault()
    setStatus(null)
    if (!content.trim()) {
      setStatus({ ok: false, msg: 'Content is required' })
      return
    }
    if (content.length > MAX_CHARS) {
      setStatus({ ok: false, msg: `Content too long (max ${MAX_CHARS} chars)` })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || undefined, content })
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.success) {
        setStatus({ ok: true, msg: 'Document ingested successfully!' })
        setTitle('')
        setContent('')
        // Auto-return to home after 2 seconds
        setTimeout(() => onNavigateHome(), 2000)
      } else {
        setStatus({ ok: false, msg: j.error || j.detail || j.message || 'Ingest failed' })
      }
    } catch (err) {
      setStatus({ ok: false, msg: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with back button */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={onNavigateHome}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to chat"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <DocumentPlusIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Document Ingestion</h1>
                  <p className="text-sm text-gray-500">Add your app documentation to the AI knowledge base</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <form onSubmit={submit} className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Document Title (Optional)
                </label>
                <input
                  aria-label="Document title"
                  placeholder="e.g., User Manual, FAQ, API Documentation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Content Textarea - VERY BIG */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Documentation Content
                </label>
                <textarea
                  aria-label="Document content"
                  placeholder="Paste your complete documentation here. Include user guides, troubleshooting tips, API documentation, FAQs, or any content you want the AI to reference when helping customers."
                  className="w-full min-h-96 max-h-[70vh] px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
                  <div>
                    <p>Paste text, markdown, code snippets, or structured notes.</p>
                    <p className="text-xs text-gray-500 mt-1">The AI will process and embed this for retrieval.</p>
                  </div>
                  <div className="text-right font-semibold">
                    {content.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {status && (
                <div
                  className={`p-4 rounded-lg border-2 ${
                    status.ok
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      status.ok ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {status.ok ? '✅' : '❌'} {status.msg}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('')
                    setContent('')
                    setStatus(null)
                  }}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                >
                  Clear
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Back to Chat
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold text-white shadow-lg transition-all ${
                      loading
                        ? 'bg-gray-400 cursor-wait'
                        : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        <span>Ingesting...</span>
                      </>
                    ) : (
                      <>
                        <DocumentPlusIcon className="w-5 h-5" />
                        <span className='text-gray-600'>Ingest Document</span>

                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Info Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 px-8 py-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Tips for best results:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <strong>Organize content:</strong> Structure your documentation with clear sections and headings.
              </li>
              <li>
                <strong>Be specific:</strong> Include exact error messages, troubleshooting steps, and solutions.
              </li>
              <li>
                <strong>Use formatting:</strong> Code blocks, lists, and emphasis help the AI understand structure.
              </li>
              <li>
                <strong>Multiple uploads:</strong> You can ingest multiple documents—each will be indexed separately.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DocUpload
