import { useState, useEffect } from 'react'
import URLInput from './components/URLInput'
import PostCard from './components/PostCard'
import RegenControls from './components/RegenControls'
import RegenCard from './components/RegenCard'
import LinkedInConnect from './components/LinkedInConnect'
import PublishPanel from './components/PublishPanel'
import { API_URL } from './api'

export default function App() {
  const [postData, setPostData] = useState(null)
  const [regenData, setRegenData] = useState(null)
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {

    fetch(`${API_URL}/health`).catch(() => { })

    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.user !== null && data.id) setUser(data) })
      .catch(() => { })

    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/')
      fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => { if (data.id) setUser(data) })
        .catch(() => { })
    }
  }, [])


  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }

  const handleScrape = async (url) => {
    setScrapeLoading(true)
    setError(null)
    setPostData(null)
    setRegenData(null)
    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPostData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setScrapeLoading(false)
    }
  }

  const handleRegen = async (overrideContent = null) => {
    setRegenLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/regen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: overrideContent || postData.content,
          tone,
          length,
          regenerateImage: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRegenData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setRegenLoading(false)
    }
  }

  const handleRegenImage = async () => {
    if (!regenData) return
    setRegenLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/regen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: regenData.content,
          tone,
          length,
          regenerateImage: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRegenData((prev) => ({ ...prev, imageUrl: data.imageUrl }))
    } catch (err) {
      setError(err.message)
    } finally {
      setRegenLoading(false)
    }
  }

  return (
    <div className="max-w-full md:h-dvh flex flex-col bg-blue-200 py-6 px-6 m-5 rounded-2xl overflow-hidden ">

      {/* Header — static, never scrolls */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          LinkedIn Post Reposter
        </h1>
        <p className="text-sm text-gray-500">
          Paste a LinkedIn post URL to scrape, rewrite and repost it.
        </p>
      </div>

      {/* LinkedIn connect — static */}
      <div className="mb-3 shrink-0">
        <LinkedInConnect user={user} onLogout={handleLogout} />
      </div>

      {/* URL Input — static */}
      <div className="mb-3 shrink-0">
        <URLInput onScrape={handleScrape} loading={scrapeLoading} />
      </div>

      {/* Error — static */}
      {error && (
        <div className="mb-3 shrink-0 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main grid — fills remaining height */}
      <div className='flex-1 min-h-0 overflow-hidden'>
        <div
          className={` h-full grid gap-5 ${postData ? ' flex flex-col md:grid-cols-2' : 'grid-cols-1'
            }`}
        >
          {/* Left col — scraped post, scrollable */}
          <div className=" min-h-0 max-h-full overflow-y-auto scrollbar-thin">
            {postData && <PostCard data={postData} />}
          </div>

          {/* Right col — regen controls + result + publish, scrollable */}
          {postData && (
            <div className="min-h-0 max-h-full overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-4">
              <div>
                <RegenControls
                  tone={tone}
                  length={length}
                  onToneChange={setTone}
                  onLengthChange={setLength}
                  onRegen={() => handleRegen()}
                  loading={regenLoading}
                />
              </div>

              <div className="shrink-0">
                {regenData && (
                  <RegenCard
                    data={regenData}
                    onRegenContent={handleRegen}
                    onRegenImage={handleRegenImage}
                    loading={regenLoading}
                  />
                )}
              </div>

              {/* Publish panel — appears after regen */}
              <div className="shrink-0">
                {regenData && (
                  <PublishPanel regenData={regenData} user={user} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}