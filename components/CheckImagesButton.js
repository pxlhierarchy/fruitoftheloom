import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function CheckImagesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleCheckImages = async () => {
    if (!token) {
      setError('You must be logged in to check images');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/check-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check images');
      }

      setResult(data.data);
    } catch (err) {
      console.error('Error checking images:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleCheckImages}
        disabled={loading}
        className={`px-4 py-2 rounded-md text-white ${
          loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Checking...' : 'Check Image Status'}
      </button>

      {error && (
        <div className="mt-2 text-red-500">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-2">
          <p>Total images checked: {result.total}</p>
          <p>Found in storage: {result.found}</p>
          <p>Missing from storage: {result.missing}</p>
          
          {result.missingImages.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold">Missing Images:</h3>
              <ul className="mt-2 space-y-2">
                {result.missingImages.map((image, index) => (
                  <li key={index} className="text-sm">
                    ID: {image.id} - URL: {image.url}
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