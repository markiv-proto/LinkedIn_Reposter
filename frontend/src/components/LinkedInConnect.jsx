import { API_URL } from "../api"
import { useState } from "react"

export default function LinkedInConnect({ user, onLogout }) {

  const [checking, setChecking] = useState(false)

  const handleLogin = async () => {
    setChecking(true)
    try {
      // Keep pinging until backend is awake
      let awake = false
      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) })
          if (res.ok) { awake = true; break }
        } catch {
          // still sleeping, wait and retry
        }
        await new Promise((r) => setTimeout(r, 3000))
      }

      if (!awake) {
        alert('Backend is taking too long to start. Please try again in 30 seconds.')
        return
      }

      window.location.href = `${API_URL}/api/auth/linkedin`
    } finally {
      setChecking(false)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
        {user.picture && (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-green-600">Connected to LinkedIn</p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleLogin}
      disabled={checking}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium transition-colors"
    >
      {checking ? 'Connecting — waking up server...' : 'Connect LinkedIn'}
    </button>
  )
}