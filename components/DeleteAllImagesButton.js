import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DeleteAllImagesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleDeleteAllImages = async () => {
    if (!token) {
      setError('You must be logged in to delete images');
      return;
    }

    // Confirm before deleting
    if (!window.confirm('Are you sure you want to delete ALL images? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/delete-all-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete images');
      }

      setResult(data.data);
      
      // Reload the page after successful deletion
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error('Error deleting images:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleDeleteAllImages}
        disabled={loading}
        className={`px-4 py-2 rounded-md text-white ${
          loading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {loading ? 'Deleting...' : 'Delete All Images'}
      </button>

      {error && (
        <div className="mt-2 text-red-500">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-2">
          <p>Total images: {result.total}</p>
          <p>Deleted: {result.deleted}</p>
          <p>Failed: {result.failed}</p>
          
          {result.results.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold">Results:</h3>
              <ul className="mt-2 space-y-2">
                {result.results.map((item, index) => (
                  <li key={index} className="text-sm">
                    ID: {item.id} - Status: {item.status}
                    {item.reason && ` - Reason: ${item.reason}`}
                    {item.url && ` - URL: ${item.url}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
            Page will reload in a few seconds...
          </div>
        </div>
      )}
    </div>
  );
} 