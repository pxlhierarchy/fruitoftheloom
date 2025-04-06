import Head from 'next/head';
import ImageCalendarGrid from '../../components/ImageCalendarGrid';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminCalendarPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminCalendarContent />
    </ProtectedRoute>
  );
}

function AdminCalendarContent() {
  const { user, logout } = useAuth();
  
  return (
    <>
      <Head>
        <title>Admin Calendar | Fruit of the Loom</title>
        <meta name="description" content="Admin calendar view for uploaded images" />
      </Head>
      
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Admin Calendar View</h1>
              <p className="text-gray-600 mt-2">
                Browse all uploaded images in calendar format
              </p>
            </div>
            
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
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <ImageCalendarGrid />
          </div>
        </div>
      </div>
    </>
  );
} 