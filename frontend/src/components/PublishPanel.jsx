import { useState } from 'react'

export default function PublishPanel({ regenData, user }) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  if (!user) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-700">
        Connect your LinkedIn account above to publish or schedule this post.
      </div>
    )
  }

  const handlePostNow = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('http://localhost:3001/api/publish/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: regenData.content,
          imageUrl: regenData.imageUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ type: 'posted', postId: data.postId })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduledAt) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('http://localhost:3001/api/publish/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: regenData.content,
          imageUrl: regenData.imageUrl,
          scheduledAt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ type: 'scheduled', scheduledAt: data.scheduledAt })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) {

    const postUrl = result.type === "posted" ? `https://www.linkedin.com/feed/update/${result.postId}`
      : null;

    console.log('Post URL:', postUrl)

    return (
      <div className={` p-4 rounded-xl border text-sm ${result.type === 'posted'
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
        {result.type === 'posted' ? (
          <div>
            <p>Post published successfully! ID: <span className="font-mono text-xs">{result.postId}</span></p>

            <a
              href={postUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-blue-600 underline hover:text-blue-800 block mt-1"
            >
              Open post on LinkedIn
            </a>
          </div>
        ) : (
          <p>Post scheduled for {new Date(result.scheduledAt).toLocaleString()}</p>
        )}
        <button
          onClick={() => setResult(null)}
          className="mt-2 text-xs underline opacity-70 hover:opacity-100"
        >
          Post another
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-700 mb-4">Publish to LinkedIn</p>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handlePostNow}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium disabled:opacity-50 transition-colors mb-3"
      >
        {loading ? 'Publishing...' : 'Post now'}
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or schedule</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        min={new Date().toISOString().slice(0, 16)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleSchedule}
        disabled={loading || !scheduledAt}
        className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Scheduling...' : 'Schedule post'}
      </button>
    </div>
  )
}