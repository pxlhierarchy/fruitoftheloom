import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}

export default MyApp; 