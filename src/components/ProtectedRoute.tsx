import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useDbCheck } from '../hooks/useDbCheck'
import { DatabaseCheck } from './DatabaseCheck'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  // Set a maximum waiting time with a timeout
  const [timeoutExceeded, setTimeoutExceeded] = useState(false);
  const { loading: dbLoading, error: dbError, checkDatabase } = useDbCheck();

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setTimeoutExceeded(true);
        console.warn("Authentication check timeout exceeded");
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, [authLoading]);

  if (timeoutExceeded) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded shadow-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication timeout</h3>
          <p className="mb-4 text-gray-700">
            The authentication check is taking longer than expected. This might be due to network issues or Supabase connection problems.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload page
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 mt-4">Checking authentication...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 mt-4">Checking database connection...</p>
      </div>
    )
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <DatabaseCheck 
            loading={false} 
            error={dbError} 
            onRetry={checkDatabase} 
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}