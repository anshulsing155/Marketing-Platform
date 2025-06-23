import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

export function AuthCheck() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if the session is valid
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(`Authentication error: ${sessionError.message}`);
          console.error('Session error:', sessionError);
          setIsChecking(false);
          return;
        }

        if (!data.session) {
          setError('Your session has expired. Please sign in again.');
          setIsChecking(false);
          return;
        }
        
        setIsChecking(false);
      } catch (err: any) {
        setError(`Authentication check failed: ${err.message}`);
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [user]);

  if (isChecking) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 flex flex-col items-center">
          <div className="bg-amber-100 p-3 rounded-full mb-4">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Authentication Issue</h3>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
