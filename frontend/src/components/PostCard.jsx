

export default function PostCard({ data }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
          LI
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 leading-tight">
            {data.title || 'LinkedIn User'}
          </p>
          <p className="text-xs text-gray-400">LinkedIn Post</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
          {data.content || 'No content found.'}
        </p>
      </div>

      {/* Image */}
      {data.imageUrl && (
        <div className="border-t border-gray-100">
          <img
            src={data.imageUrl}
            alt="Post media"
            className="w-full object-cover max-h-72"
            onError={(e) => (e.target.style.display = 'none')}
          />
        </div>
      )}

      {/* Links */}
      {data.links?.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Links in post</p>
          <div className="flex flex-col gap-1">
            {data.links.map((link, i) => (
              <a                                      
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-400">Scraped from LinkedIn</span>
        <a                                           
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          View original →
        </a>
      </div>
    </div>
  )
}
