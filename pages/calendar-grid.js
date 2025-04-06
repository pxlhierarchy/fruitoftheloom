import ImageCalendarGrid from '../components/ImageCalendarGrid';
import Head from 'next/head';

export default function CalendarGridView() {
  return (
    <>
      <Head>
        <title>Image Calendar Grid | Fruit of the Loom</title>
        <meta name="description" content="Browse your uploaded images in a calendar grid format" />
      </Head>
      
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">Image Calendar Grid</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse your uploaded images in a calendar grid format, starting from March 2025. 
              Each day displays the images uploaded on that date.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <ImageCalendarGrid />
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Click on a day to view all images uploaded on that date.</p>
          </div>
        </div>
      </div>
    </>
  );
} 