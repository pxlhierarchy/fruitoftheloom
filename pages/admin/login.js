import Head from 'next/head';
import AdminLoginForm from '../../components/AdminLoginForm';
import Link from 'next/link';

export default function AdminLoginPage() {
  return (
    <>
      <Head>
        <title>Admin Login | Fruit of the Loom</title>
        <meta name="description" content="Admin login for calendar view" />
      </Head>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Access</h1>
            <p className="text-gray-600 mt-2">
              Login to access the admin calendar view
            </p>
          </div>
          
          <AdminLoginForm />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Regular user? <Link href="/login" className="text-blue-600 hover:text-blue-800">User Login</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 