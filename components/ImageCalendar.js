import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ImageCalendar() {
  const router = useRouter();
  const { token } = useAuth();
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default to March 2025
  const [currentDate, setCurrentDate] = useState(new Date(2025, 2, 1)); // March 2025 (month is 0-indexed)
  
  // Get year and month from URL or use default
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
        `/api/images?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
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
      days.push(<div key={`empty-${i}`} className="h-40 bg-gray-50"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayImages = images[day] || [];
      
      days.push(
        <div key={day} className="h-40 border p-2 overflow-hidden bg-white rounded shadow-sm hover:shadow-md transition-shadow">
          <div className="font-semibold mb-1">{day}</div>
          {dayImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-1">
              {dayImages.slice(0, 4).map((image, index) => (
                <div key={image._id} className="relative group">
                  <img
                    src={image.url || '/placeholder.svg'}
                    alt={image.filename || 'Calendar image'}
                    className="w-full h-14 object-cover rounded"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.svg';
                      console.error('Failed to load image:', image.url);
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs truncate px-1">{image.filename}</span>
                  </div>
                  {index === 3 && dayImages.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs rounded">
                      +{dayImages.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-xs h-full flex items-center justify-center">
              No images
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Image Calendar</h2>
      
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Previous Month
        </button>
        
        <h3 className="text-xl font-bold">
          {monthNames[month - 1]} {year}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Next Month
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">Loading calendar...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold py-2 text-gray-700">
              {day}
            </div>
          ))}
          
          {renderCalendarDays()}
        </div>
      )}
    </div>
  );
} 