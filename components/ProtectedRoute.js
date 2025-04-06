import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    
    // If not loading, authenticated, but doesn't have the required role, redirect to home
    if (!loading && isAuthenticated && requiredRole && user.role !== requiredRole) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated or doesn't have the required role, don't render children
  if (!isAuthenticated || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  // Render children if authenticated and has the required role
  return children;
} 