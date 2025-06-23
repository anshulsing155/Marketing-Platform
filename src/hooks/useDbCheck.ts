import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDbCheck() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSetupNeeded, setIsSetupNeeded] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to query the profiles table
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact', head: true });

      if (profilesError) {
        if (profilesError.code === '42P01' || profilesError.message?.includes('relation "profiles" does not exist')) {
          setError("The database tables don't exist. Please run the setup script.");
          setIsSetupNeeded(true);
        } else {
          setError(`Database error: ${profilesError.message}`);
        }
        return false;
      }
      
      return true;
    } catch (err: any) {
      setError(`Failed to connect to database: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  return { loading, error, isSetupNeeded, checkDatabase };
}
