export default function RegenControls({ tone, length, onToneChange, onLengthChange, onRegen, loading }) {
  const tones = ['professional', 'casual', 'inspirational', 'educational']
  const lengths = ['short', 'medium', 'long']

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 ">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Regeneration settings</h2>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Tone</p>
        <div className="flex gap-2 flex-wrap">
          {tones.map((t) => (
            <button
              key={t}
              onClick={() => onToneChange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                tone === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-2">Length</p>
        <div className="flex flex-wrap gap-2">
          {lengths.map((l) => (
            <button
              key={l}
              onClick={() => onLengthChange(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                length === l
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onRegen}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Rewriting...' : 'Regenerate with AI'}
      </button>
    </div>
  )
}