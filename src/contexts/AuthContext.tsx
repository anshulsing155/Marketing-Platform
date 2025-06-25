import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { profileAPI, Profile } from '../lib/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user ID:', userId);
      
      let profileData = null;
      let retryCount = 0;
      const maxRetries = 2;
      
      // Retry logic for getting or creating profile
      while (retryCount <= maxRetries) {
        try {
          // First try to get the existing profile
          profileData = await profileAPI.getById(userId);
          console.log('Profile fetch response:', profileData);
          
          if (profileData) {
            console.log('Profile found:', profileData);
            setProfile(profileData);
            setLoading(false);
            return;
          }
        } catch (fetchError: any) {
          console.log(`Attempt ${retryCount + 1}: Profile not found or error fetching profile:`, fetchError.message);
          // Only redirect on explicit 404 error, not on other errors or null profile
          if (fetchError.message.includes('404')) {
            console.warn('Profile not found (404) - clearing session and redirecting to login');
            localStorage.clear();
            window.location.href = '/login';
            return;
          }
        }

        
        // If we reach here and we've exhausted retries, create a profile
        if (retryCount === maxRetries || !profileData) {
          console.log(`Creating profile after ${retryCount} fetch attempts`);
          break;
        }
        
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
      }
      
      // If we reach here, we need to create a profile
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user data from Supabase:', userError);
        toast.error('Failed to retrieve user information');
        setLoading(false);
        return;
      }
      
      if (userData?.user) {
        console.log('Creating new profile with data:', {
          id: userData.user.id,
          email: userData.user.email,
          metadata: userData.user.user_metadata
        });
        
        try {
          // Create a new profile using the Supabase user data
          const newProfile = await profileAPI.create({
            id: userData.user.id,
            email: userData.user.email!,
            full_name: userData.user.user_metadata?.full_name || '',
            role: 'USER',
          });
          
          console.log('Created new profile successfully:', newProfile);
          
          // Double-check that the profile was actually created
          const verifyProfile = await profileAPI.getById(userData.user.id);
          if (verifyProfile) {
            console.log('Successfully verified profile creation:', verifyProfile);
            setProfile(verifyProfile);
            toast.success('Profile created successfully!');
          } else {
            throw new Error('Profile creation verified failed');
          }
        } catch (createError: any) {
          console.error('Error creating profile:', createError);
          toast.error(`Failed to create user profile: ${createError.message}`);
        }
      } else {
        console.error('No user data available to create profile');
        toast.error('Could not create user profile - missing user data');
      }
    } catch (error: any) {
      console.error('Error in profile handling process:', error);
      toast.error(`Profile error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }


  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast.success('Signed in successfully!')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error

      if (data.user) {
        // Create profile using API
        await profileAPI.create({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'USER',
        })
      }

      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully!')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
