-- IMPORTANT: Only use this script temporarily during development
-- Disable RLS for initial data setup
-- Run this before inserting any initial data

-- Temporarily disable RLS on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Insert your initial user/admin
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES 
  ('your-auth-user-id', 'your-email@example.com', 'Admin User', 'admin', now(), now());

-- Re-enable RLS after inserting initial data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Replace 'your-auth-user-id' with the actual UUID of your authenticated user
-- You can get this from the Supabase dashboard in the Authentication section
-- after creating a user via email/password or other auth method
