import React, { useState } from 'react'

const BACKEND_URL = (import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:8000'

const DocIngest = () => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const MAX_CHARS = 20000

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
        setStatus({ ok: true, msg: 'Ingested successfully' })
        setTitle('')
        setContent('')
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
    <div className="mt-6 bg-gradient-to-br from-white via-slate-50 to-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingest Application Document</h3>
      <p className="text-sm text-gray-500 mb-4">Paste your app documentation so the assistant can reference it when answering questions.</p>

      <form onSubmit={submit} className="space-y-3">
        <input
          aria-label="Document title"
          placeholder="Optional title"
          className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="sr-only">Content</label>
          <textarea
            aria-label="Document content"
            placeholder="Paste application documentation or notes here..."
            className="w-full min-h-[140px] max-h-60 px-3 py-2 border border-gray-200 rounded-md shadow-sm text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-400"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <div>Supports plain text. Keep it focused for best results.</div>
            <div>{content.length}/{MAX_CHARS}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm transition-colors ${loading ? 'bg-gray-400 cursor-wait' : 'bg-primary-600 hover:bg-primary-700'}`}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 5v14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span>{loading ? 'Ingesting...' : 'Ingest Document'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setTitle(''); setContent(''); setStatus(null) }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Reset
            </button>
          </div>

          {status && (
            <div className={`text-sm ${status.ok ? 'text-green-600' : 'text-red-600'}`}>
              {status.msg}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default DocIngest
