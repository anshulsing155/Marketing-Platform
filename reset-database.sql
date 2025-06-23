-- CAUTION: This script will drop all tables and reset your database to a clean state
-- Only run this if you want to completely reset your database

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop all policies
-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- User Groups
DROP POLICY IF EXISTS "Users can view their own user groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users can insert their own user groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users can update their own user groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users can delete their own user groups" ON public.user_groups;

-- Group Subscribers
DROP POLICY IF EXISTS "Users can view subscribers in their groups" ON public.group_subscribers;
DROP POLICY IF EXISTS "Users can add subscribers to their groups" ON public.group_subscribers;
DROP POLICY IF EXISTS "Users can remove subscribers from their groups" ON public.group_subscribers;

-- Subscribers
DROP POLICY IF EXISTS "Users can view all subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can add subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update subscribers" ON public.subscribers;

-- Email Templates
DROP POLICY IF EXISTS "Users can view their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can insert their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can update their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can delete their own email templates" ON public.email_templates;

-- WhatsApp Templates
DROP POLICY IF EXISTS "Users can view their own whatsapp templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can insert their own whatsapp templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can update their own whatsapp templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can delete their own whatsapp templates" ON public.whatsapp_templates;

-- Campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;

-- Campaign Groups
DROP POLICY IF EXISTS "Users can view their campaign groups" ON public.campaign_groups;
DROP POLICY IF EXISTS "Users can insert their campaign groups" ON public.campaign_groups;
DROP POLICY IF EXISTS "Users can delete their campaign groups" ON public.campaign_groups;

-- Drop all tables (in correct order to avoid foreign key constraints)
DROP TABLE IF EXISTS public.campaign_groups;
DROP TABLE IF EXISTS public.group_subscribers;
DROP TABLE IF EXISTS public.campaigns;
DROP TABLE IF EXISTS public.email_templates;
DROP TABLE IF EXISTS public.whatsapp_templates;
DROP TABLE IF EXISTS public.subscribers;
DROP TABLE IF EXISTS public.user_groups;
DROP TABLE IF EXISTS public.profiles;

-- Now you can run the supabase-migration.sql script for a clean installation
