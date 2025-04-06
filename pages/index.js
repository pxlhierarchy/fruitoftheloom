import { useState, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import FixImagesButton from '../components/FixImagesButton';
import CheckImagesButton from '../components/CheckImagesButton';
import ReuploadImagesButton from '../components/ReuploadImagesButton';

export default function Home() {
  return (
    <ProtectedRoute requireAdmin={false}>
      <HomeContent />
    </ProtectedRoute>
  );
}

function HomeContent() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user, token, logout } = useAuth();

  const fetchImages = async (pageNum = 0) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/images?skip=${pageNum * 20}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch images');
      }
      
      console.log('Fetched images:', data.data.images);
      
      if (pageNum === 0) {
        setImages(data.data.images);
      } else {
        setImages(prev => [...prev, ...data.data.images]);
      }
      
      setHasMore(data.data.pagination?.hasMore || false);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err.message || 'Error fetching images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchImages();
    }
  }, [token]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchImages(nextPage);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Image Upload Gallery</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Logged in as <span className="font-medium">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="mb-12">
        <ImageUploader />
      </div>
      
      <div className="mb-12">
        <FixImagesButton />
      </div>
      
      <div className="mb-12">
        <CheckImagesButton />
        <ReuploadImagesButton />
      </div>
      
      <h2 className="text-2xl font-bold mb-6">Uploaded Images</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading && images.length === 0 ? (
        <div className="text-center py-8">Loading images...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No images uploaded yet</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative w-full h-48">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.svg';
                      console.error('Failed to load image:', image.url);
                    }}
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold truncate">{image.filename}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(image.uploadedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded by {image.uploadedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className={`py-2 px-6 rounded ${
                  loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 