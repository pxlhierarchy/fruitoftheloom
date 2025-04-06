import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export default function ImageCalendarGrid() {
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
      days.push(
        <div key={`empty-${i}`} className="h-40 sm:h-48 md:h-56 bg-gray-50 rounded-lg border border-gray-100"></div>
      );
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayImages = images[day] || [];
      
      days.push(
        <div 
          key={day} 
          className="h-40 sm:h-48 md:h-56 border border-gray-200 overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 relative group"
        >
          {/* Date number in top-left corner */}
          <div className="absolute top-2 left-2 bg-white bg-opacity-80 px-2 py-1 rounded-full text-xs font-semibold z-10 shadow-sm">
            {day}
          </div>
          
          {dayImages.length > 0 ? (
            <div className="h-full w-full">
              {/* If there's only one image, show it full size */}
              {dayImages.length === 1 ? (
                <div className="h-full w-full relative">
                  <img
                    src={dayImages[0].url}
                    alt={dayImages[0].filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white text-xs p-2 truncate">
                    {dayImages[0].filename}
                  </div>
                </div>
              ) : (
                /* If there are multiple images, show a grid */
                <div className="grid grid-cols-2 grid-rows-2 h-full">
                  {dayImages.slice(0, 4).map((image, index) => (
                    <div key={image._id} className="relative overflow-hidden group/item">
                      <img
                        src={image.url}
                        alt={image.filename || 'Calendar image'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.png';
                          console.error('Failed to load image:', image.url);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-end">
                        <span className="text-white text-xs p-1 truncate w-full">{image.filename}</span>
                      </div>
                    </div>
                  ))}
                  {dayImages.length > 4 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                      +{dayImages.length - 4}
                    </div>
                  )}
                </div>
              )}
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
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Image Calendar</h2>
      
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="py-2 px-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
        >
          <span className="hidden sm:inline">Previous Month</span>
          <span className="sm:hidden">←</span>
        </button>
        
        <h3 className="text-xl font-bold text-gray-800">
          {monthNames[month - 1]} {year}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          className="py-2 px-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
        >
          <span className="hidden sm:inline">Next Month</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold py-2 text-gray-700 text-xs sm:text-sm">
              {day}
            </div>
          ))}
          
          {renderCalendarDays()}
        </div>
      )}
    </div>
  );
} 