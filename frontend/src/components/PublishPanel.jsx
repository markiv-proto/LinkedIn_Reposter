import { useState, useEffect } from 'react';
import { API_URL } from '../api';

export default function PublishPanel({ regenData, user }) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('personal');

  useEffect(() => {
    async function loadOrgs() {
      if (!user || !user.accessToken) return;
      setOrgsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/organizations?accessToken=${user.accessToken}`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load LinkedIn organizations', err);
        setOrganizations([]);
      } finally {
        setOrgsLoading(false);
      }
    }
    loadOrgs();
  }, [user]);

  if (!user) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-700">
        Connect your LinkedIn account above to publish or schedule this post.
      </div>
    );
  }

  const handlePostNow = async () => {

    console.log('Posting as:', selectedOrg)  // ← add this
    console.log('organizationId:', selectedOrg !== 'personal' ? selectedOrg : null)

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/publish/now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: regenData.content,
          imageUrl: regenData.imageUrl,
          imageBase64: regenData.imageBase64 || null,
          imageMimeType: regenData.imageMimeType || null,
          userId: user.id,
          accessToken: user.accessToken,
          organizationId: selectedOrg !== 'personal' ? selectedOrg : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ type: 'posted', postId: data.postId });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/publish/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: regenData.content,
          imageUrl: regenData.imageUrl || null,
          imageBase64: regenData.imageBase64 || null,
          imageMimeType: regenData.imageMimeType || null,
          userId: user.id,
          accessToken: user.accessToken,
          organizationId: selectedOrg !== 'personal' ? selectedOrg : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ type: 'scheduled', scheduledAt: data.scheduledAt });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const postUrl = result.type === 'posted'
      ? `https://www.linkedin.com/feed/update/${result.postId}`
      : null;

    return (
      <div className={`p-4 rounded-xl border text-sm ${result.type === 'posted'
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
        {result.type === 'posted' ? (
          <div>
            <p>Post published successfully!</p>

            <a href={postUrl}
              target="_blank"
              rel="noreferrer"
              className="w-fit text-sm font-medium text-blue-600 underline hover:text-blue-800 block mt-1"
            >
              Open post on LinkedIn
            </a>
          </div>
        ) : (
          <p>Post scheduled for {new Date(result.scheduledAt).toLocaleString('en-IN', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
          })}</p>
        )}
        <button
          onClick={() => setResult(null)}
          className="mt-2 text-xs underline opacity-70 hover:opacity-100"
        >
          Post another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-700 mb-4">Publish to LinkedIn</p>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Post as — always visible */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-2">Post as</p>

        {orgsLoading ? (
          <p className="text-xs text-gray-400 animate-pulse">Loading pages...</p>
        ) : (
          <div className="flex flex-col gap-2">

            {/* Personal profile */}
            <label className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedOrg === 'personal'
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
              }`}>
              <input
                type="radio"
                name="postAs"
                value="personal"
                checked={selectedOrg === 'personal'}
                onChange={() => setSelectedOrg('personal')}
                className="accent-blue-600"
              />
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                    {user.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400">Personal profile</p>
                </div>
              </div>
            </label>

            {/* Company pages */}
            {organizations.map((org) => (
              <label
                key={org.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedOrg === org.id
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="radio"
                  name="postAs"
                  value={org.id}
                  checked={selectedOrg === org.id}
                  onChange={() => setSelectedOrg(org.id)}
                  className="accent-blue-600"
                />
                <div className="flex items-center gap-2">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium">
                      {org.name?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-400">Company page</p>
                  </div>
                </div>
              </label>
            ))}

            {/* No company pages */}
            {organizations.length === 0 && (
              <div className="p-2.5 rounded-lg border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">No company pages found.</p>
              </div>
            )}

          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 mb-4" />

      <button
        onClick={handlePostNow}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium disabled:opacity-50 transition-colors mb-3"
      >
        {loading ? 'Publishing...' : selectedOrg !== 'personal' ? 'Post now (as company)' : 'Post now'}
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
        {loading ? 'Scheduling...' : selectedOrg !== 'personal' ? 'Schedule (as company)' : 'Schedule post'}
      </button>
    </div>
  );
}