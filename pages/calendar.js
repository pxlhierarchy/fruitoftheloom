import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <CalendarContent />
    </ProtectedRoute>
  );
}

function CalendarContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get year and month from URL or use current date
  const year = parseInt(router.query.year) || currentDate.getFullYear();
  const month = parseInt(router.query.month) || currentDate.getMonth() + 1;
  
  useEffect(() => {
    if (router.isReady) {
      fetchImages();
    }
  }, [router.isReady, year, month]);
  
  const fetchImages = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const response = await fetch(
        `/api/images?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch images');
      }
      
      // Group images by day
      const groupedImages = {};
      data.data.images.forEach(image => {
        const day = new Date(image.timestamp).getDate();
        if (!groupedImages[day]) {
          groupedImages[day] = [];
        }
        groupedImages[day].push(image);
      });
      
      setImages(groupedImages);
    } catch (err) {
      setError(err.message || 'Error fetching images');
    } finally {
      setLoading(false);
    }
  };
  
  const navigateMonth = (direction) => {
    const newDate = new Date(year, month - 1 + direction, 1);
    router.push({
      pathname: router.pathname,
      query: {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1
      }
    });
  };
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayImages = images[day] || [];
      
      days.push(
        <div key={day} className="h-32 border p-2 overflow-hidden">
          <div className="font-semibold mb-1">{day}</div>
          {dayImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-1">
              {dayImages.slice(0, 4).map((image, index) => (
                <div key={image._id} className="relative">
                  <img
                    src={image.blobUrl}
                    alt={image.filename}
                    className="w-full h-12 object-cover rounded"
                  />
                </div>
              ))}
              {dayImages.length > 4 && (
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  +{dayImages.length - 4} more
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-xs">No images</div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Image Calendar</h1>
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
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Previous Month
          </button>
          <h2 className="text-2xl font-bold">
            {monthNames[month - 1]} {year}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next Month
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold py-2">
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
} 