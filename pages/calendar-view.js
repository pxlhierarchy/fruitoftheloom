import ImageCalendar from '../components/ImageCalendar';

export default function CalendarView() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Image Calendar View</h1>
      <p className="text-center text-gray-600 mb-8">
        Browse your uploaded images in a calendar format, starting from March 2025
      </p>
      
      <div className="max-w-6xl mx-auto">
        <ImageCalendar />
      </div>
    </div>
  );
} 