# Fixing the RLS Issue in Your Application

The "new row violates row-level security policy" error occurs because:

1. We've enabled Row Level Security (RLS) on all tables in Supabase
2. The profiles table requires authenticated users to match their own ID
3. When a new user signs up, you need to create their profile entry

## Option 1: Use Supabase Triggers (Recommended)

The updated `supabase-migration.sql` file includes a trigger that automatically creates a profile entry when a new user signs up. This is the recommended approach.

1. Run the updated `supabase-migration.sql` in the SQL editor
2. Make sure you're properly signing up/logging in users with Supabase Auth

## Option 2: Initial Setup with Admin Access

For initial setup or admin operations, you can use the `initial-setup.sql` file:

1. Go to Supabase Dashboard > Authentication > Users
2. Find your user's UUID
3. Update the `initial-setup.sql` with your user's UUID
4. Run this script to give yourself temporary access

## Option 3: Update the AuthContext to handle profile creation

Modify your `AuthContext.tsx` to handle profile creation after signup:

```tsx
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    
    // 1. Sign up the user with Supabase Auth
    const { data: { user, session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      setIsLoading(false);
      throw error;
    }

    // The trigger we created in supabase-migration.sql will handle
    // creating the profile automatically, so we don't need to do it manually here.
    
    setSession(session);
    setUser(user);
    setIsLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { data: { session, user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      setIsLoading(false);
      throw error;
    }

    setSession(session);
    setUser(user);
    setIsLoading(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Debugging RLS Issues

If you still encounter RLS issues:

1. Check if you're properly authenticated with Supabase Auth
2. Ensure the user ID in your request matches the profile ID
3. Temporarily disable RLS on specific tables for testing
4. Use the Supabase dashboard to monitor requests and errors

Remember to re-enable all RLS policies in production for security!
