import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  
  const isActive = (path) => {
    return router.pathname === path;
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <nav className="bg-white shadow-md mb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Image Gallery
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Gallery
              </Link>
              
              {/* Only show Calendar link for admin users */}
              {isAdmin && (
                <Link
                  href="/calendar"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/calendar')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Calendar
                </Link>
              )}
              
              {/* Only show Calendar View link for admin users */}
              {isAdmin && (
                <Link
                  href="/calendar-view"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/calendar-view')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Calendar View
                </Link>
              )}
              
              {/* Only show Calendar Grid link for admin users */}
              {isAdmin && (
                <Link
                  href="/calendar-grid"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/calendar-grid')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Calendar Grid
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.email}
                </span>
                {isAdmin && (
                  <Link
                    href="/admin/calendar"
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                      isActive('/admin/calendar')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                    isActive('/login')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/admin/login"
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                    isActive('/admin/login')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/')
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Gallery
          </Link>
          
          {/* Only show Calendar link for admin users */}
          {isAdmin && (
            <Link
              href="/calendar"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/calendar')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Calendar
            </Link>
          )}
          
          {/* Only show Calendar View link for admin users */}
          {isAdmin && (
            <Link
              href="/calendar-view"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/calendar-view')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Calendar View
            </Link>
          )}
          
          {/* Only show Calendar Grid link for admin users */}
          {isAdmin && (
            <Link
              href="/calendar-grid"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/calendar-grid')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Calendar Grid
            </Link>
          )}
          
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/calendar"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/admin/calendar')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Admin Calendar
                </Link>
              )}
              <div className="pl-3 pr-4 py-2 border-l-4 border-transparent">
                <span className="text-sm text-gray-700">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/login')
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Login
              </Link>
              <Link
                href="/admin/login"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/admin/login')
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Admin Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 