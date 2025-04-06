import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function FixImagesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleFixImages = async () => {
    if (!token) {
      setError('You must be logged in to fix images');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/fix-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fix images');
      }

      setResult(data.data);
    } catch (err) {
      console.error('Error fixing images:', err);
      setError(err.message || 'An error occurred while fixing images');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Fix Image URLs</h3>
      <p className="text-sm text-gray-600 mb-4">
        This will fix the URLs of existing images that contain "undefined" in their paths.
      </p>
      
      <button
        onClick={handleFixImages}
        disabled={isLoading}
        className={`px-4 py-2 rounded ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isLoading ? 'Fixing...' : 'Fix Image URLs'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
          <p>Fixed {result.fixed} images</p>
          <p>Skipped {result.skipped} images</p>
          <p>Total: {result.total} images</p>
        </div>
      )}
    </div>
  );
} 