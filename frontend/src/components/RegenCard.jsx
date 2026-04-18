import { useState, useEffect } from 'react'

export default function RegenCard({ data, onRegenContent, loading }) {
  const [editedContent, setEditedContent] = useState(data.content)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setEditedContent(data.content)
    setIsEditing(false)
  }, [data.content])


  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-xs font-medium text-blue-600">Text</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full text-sm text-gray-800 leading-relaxed resize-none border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={8}
          />
        ) : (
          <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
            {editedContent}
          </p>
        )}
        <button
          onClick={() => onRegenContent(editedContent)}
          disabled={loading}
          className="mt-3 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Rewriting...' : '↺ Rewrite again'}
        </button>
      </div>
    </div>
  )
}