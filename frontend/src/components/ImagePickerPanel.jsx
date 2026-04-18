import { useState, useCallback, useEffect, useRef } from 'react'
import { API_URL } from '../api'

const TABS = ['AI generate', 'Unsplash', 'Pexels', 'Upload from device']
const COOLDOWN_SECS = 30

export default function ImagePickerPanel({ postContent, onImageChange }) {
  const [tab, setTab] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)          // seconds remaining
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)

  // countdown tick
  useEffect(() => {
    if (cooldown <= 0) return
    timerRef.current = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [cooldown])

  const generateAI = useCallback(async () => {
    setAiLoading(true)
    setAiResult(null)
    try {
      const res = await fetch(`${API_URL}/api/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt.trim() ? { prompt } : { postContent }),
      })
      const data = await res.json()
      if (!res.ok) {
        // start cooldown on rate-limit / generator failure
        throw new Error(data.error)
      }
      setAiResult(data)
      setCooldown(COOLDOWN_SECS)
      const img = { previewUrl: data.previewUrl, base64: data.base64, mimeType: data.mimeType, url: data.url, source: 'ai' }
      setSelected(img)
      onImageChange(img)
    } catch (err) {
      console.error('Image gen failed:', err.message)
    } finally {
      setAiLoading(false)
    }
  }, [prompt, postContent, onImageChange])

  const search = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    const source = tab === 1 ? 'unsplash' : 'pexels'
    try {
      const res = await fetch(`${API_URL}/api/image/search/${source}?query=${encodeURIComponent(query)}&per_page=12`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Search failed:', err.message)
    } finally {
      setSearching(false)
    }
  }, [query, tab])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const previewUrl = ev.target.result
      const base64 = previewUrl.split(',')[1]
      const img = { previewUrl, base64, mimeType: file.type, url: null, source: 'upload' }
      setSelected(img)
      onImageChange(img)
    }
    reader.readAsDataURL(file)
  }

  const selectStockImage = (img) => {
    const attached = { previewUrl: img.thumb, url: img.full, base64: null, mimeType: null, credit: img.credit, creditUrl: img.creditUrl, source: tab === 1 ? 'unsplash' : 'pexels' }
    setSelected(attached)
    onImageChange(attached)
  }

  const clearImage = () => {
    setSelected(null)
    setAiResult(null)
    onImageChange(null)
  }

  const switchTab = (i) => { setTab(i); setResults([]) }

  const btnDisabled = aiLoading || cooldown > 0
  const btnLabel = aiLoading
    ? 'Generating…'
    : cooldown > 0
      ? `Try again in ${cooldown}s`
      : aiResult
        ? `↺ Regenerate`
        : 'Generate image'

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className='flex items-center gap-2'>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs font-medium text-blue-600">Image</span>
          </div>
          <div>
            {selected && (
              <button onClick={clearImage} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Remove
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => switchTab(i)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === i ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {tab === 0 && (
          <div className="flex flex-col gap-3">
            <textarea
              rows={2}
              placeholder="Describe the image, or leave blank to auto-generate from post content…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generateAI}
              disabled={btnDisabled}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${cooldown > 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
            >
              {btnLabel}
            </button>
            {aiLoading && (
              <div className="h-36 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-400 animate-pulse">Generating image…</span>
              </div>
            )}
            {aiResult && !aiLoading && (
              <div className="relative rounded-lg overflow-hidden border border-gray-100">
                <img
                  src={aiResult.previewUrl}
                  alt="AI generated"
                  className="w-full object-cover max-h-48 opacity-0 transition-opacity duration-300"
                  onLoad={(e) => e.target.classList.remove('opacity-0')}
                />
                <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                  AI generated
                </span>
              </div>
            )}
          </div>
        )}

        {(tab === 1 || tab === 2) && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input type="text" placeholder={`Search ${TABS[tab]}…`} value={query}
                onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={search} disabled={searching || !query.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {searching ? '…' : 'Search'}
              </button>
            </div>
            {results.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto">
                  {results.map((img) => (
                    <div key={img.id} onClick={() => selectStockImage(img)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden aspect-video border-2 transition-all ${selected?.url === img.full ? 'border-blue-500 scale-[0.97]' : 'border-transparent hover:border-blue-300'
                        }`}>
                      <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {selected?.credit && (
                  <p className="text-xs text-gray-400">
                    Photo by <a href={selected.creditUrl} target="_blank" rel="noreferrer" className="underline">{selected.credit}</a>
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div
              onClick={() => fileInputRef.current.click()}
              className="h-36 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
              </svg>
              <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Click to upload image</p>
              <p className="text-xs text-gray-300">PNG, JPG, WEBP</p>
            </div>

            {selected?.source === 'upload' && (
              <div className="relative rounded-lg overflow-hidden border border-blue-200">
                <img src={selected.previewUrl} alt="Uploaded" className="w-full object-cover max-h-48" />
                <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                  Uploaded
                </span>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-2 right-2 text-xs bg-black/50 hover:bg-black/70 text-white px-2 py-0.5 rounded transition-colors"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        )}

        {selected && selected.source !== 'ai' && (
          <div className="mt-3 relative rounded-lg overflow-hidden border border-blue-200">
            <img src={selected.previewUrl} alt="Selected" className="w-full object-cover max-h-48" />
            <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded capitalize">
              {selected.source}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}