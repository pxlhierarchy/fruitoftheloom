import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ReuploadImagesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleReuploadImages = async () => {
    if (!token) {
      setError('You must be logged in to re-upload images');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/reupload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to re-upload images');
      }

      setResult(data.data);
    } catch (err) {
      console.error('Error re-uploading images:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleReuploadImages}
        disabled={loading}
        className={`px-4 py-2 rounded-md text-white ${
          loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Re-uploading...' : 'Re-upload Missing Images'}
      </button>

      {error && (
        <div className="mt-2 text-red-500">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-2">
          <p>Total images checked: {result.total}</p>
          <p>Re-uploaded: {result.reuploaded}</p>
          <p>Skipped: {result.skipped}</p>
          <p>Failed: {result.failed}</p>
          
          {result.results.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold">Results:</h3>
              <ul className="mt-2 space-y-2">
                {result.results.map((item, index) => (
                  <li key={index} className="text-sm">
                    ID: {item.id} - Status: {item.status}
                    {item.reason && ` - Reason: ${item.reason}`}
                    {item.oldUrl && item.newUrl && (
                      <div className="ml-4">
                        <p>Old URL: {item.oldUrl}</p>
                        <p>New URL: {item.newUrl}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 