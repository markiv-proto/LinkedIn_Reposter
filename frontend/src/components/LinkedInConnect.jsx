export default function LinkedInConnect({ user, onLogout }) {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/api/auth/linkedin'
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
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium transition-colors"
    >
      Connect LinkedIn
    </button>
  )
}