import { useState } from 'react'

export default function URLInput({ onScrape, loading }) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) onScrape(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.linkedin.com/posts/..."
        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Scraping...' : 'Scrape'}
      </button>
    </form>
  )
}