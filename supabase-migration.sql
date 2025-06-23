-- Create tables for email and whatsapp application

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_groups table
CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Create subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  status TEXT CHECK (status IN ('active', 'unsubscribed', 'bounced')) NOT NULL DEFAULT 'active',
  whatsapp_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create group_subscribers table (junction table)
CREATE TABLE IF NOT EXISTS public.group_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.user_groups(id) NOT NULL,
  subscriber_id UUID REFERENCES public.subscribers(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (group_id, subscriber_id)
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  template_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'whatsapp')) NOT NULL,
  subject TEXT,
  template_id UUID NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')) NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Create campaign_groups table (junction table)
CREATE TABLE IF NOT EXISTS public.campaign_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  group_id UUID REFERENCES public.user_groups(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, group_id)
);

-- Make sure we have the uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the profiles table if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create policies for the profiles table
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for other tables (based on user's ownership)
-- User Groups
DROP POLICY IF EXISTS "Users can view their own user groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users can insert their own user groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users can update their own user groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users can delete their own user groups" ON public.user_groups;

CREATE POLICY "Users can view their own user groups" 
  ON public.user_groups 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own user groups" 
  ON public.user_groups 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own user groups" 
  ON public.user_groups 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own user groups" 
  ON public.user_groups 
  FOR DELETE 
  USING (created_by = auth.uid());

-- Group Subscribers
DROP POLICY IF EXISTS "Users can view subscribers in their groups" ON public.group_subscribers;
DROP POLICY IF EXISTS "Users can add subscribers to their groups" ON public.group_subscribers;
DROP POLICY IF EXISTS "Users can remove subscribers from their groups" ON public.group_subscribers;

CREATE POLICY "Users can view subscribers in their groups" 
  ON public.group_subscribers 
  FOR SELECT 
  USING (
    group_id IN (
      SELECT id FROM public.user_groups 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can add subscribers to their groups" 
  ON public.group_subscribers 
  FOR INSERT 
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.user_groups 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can remove subscribers from their groups" 
  ON public.group_subscribers 
  FOR DELETE 
  USING (
    group_id IN (
      SELECT id FROM public.user_groups 
      WHERE created_by = auth.uid()
    )
  );

-- Subscribers
DROP POLICY IF EXISTS "Users can view all subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can add subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update subscribers" ON public.subscribers;

CREATE POLICY "Users can view all subscribers" 
  ON public.subscribers 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can add subscribers" 
  ON public.subscribers 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update subscribers" 
  ON public.subscribers 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Email Templates
DROP POLICY IF EXISTS "Users can view their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can insert their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can update their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can delete their own email templates" ON public.email_templates;

CREATE POLICY "Users can view their own email templates" 
  ON public.email_templates 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own email templates" 
  ON public.email_templates 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own email templates" 
  ON public.email_templates 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own email templates" 
  ON public.email_templates 
  FOR DELETE 
  USING (created_by = auth.uid());

-- WhatsApp Templates
DROP POLICY IF EXISTS "Users can view their own whatsapp templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can insert their own whatsapp templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can update their own whatsapp templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can delete their own whatsapp templates" ON public.whatsapp_templates;

CREATE POLICY "Users can view their own whatsapp templates" 
  ON public.whatsapp_templates 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own whatsapp templates" 
  ON public.whatsapp_templates 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own whatsapp templates" 
  ON public.whatsapp_templates 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own whatsapp templates" 
  ON public.whatsapp_templates 
  FOR DELETE 
  USING (created_by = auth.uid());

-- Campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;

CREATE POLICY "Users can view their own campaigns" 
  ON public.campaigns 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own campaigns" 
  ON public.campaigns 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own campaigns" 
  ON public.campaigns 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own campaigns" 
  ON public.campaigns 
  FOR DELETE 
  USING (created_by = auth.uid());

-- Campaign Groups
DROP POLICY IF EXISTS "Users can view their campaign groups" ON public.campaign_groups;
DROP POLICY IF EXISTS "Users can insert their campaign groups" ON public.campaign_groups;
DROP POLICY IF EXISTS "Users can delete their campaign groups" ON public.campaign_groups;

CREATE POLICY "Users can view their campaign groups" 
  ON public.campaign_groups 
  FOR SELECT 
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert their campaign groups" 
  ON public.campaign_groups 
  FOR INSERT 
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their campaign groups" 
  ON public.campaign_groups 
  FOR DELETE 
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE created_by = auth.uid()
    )
  );

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a function to handle new user signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user', now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call this function after a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
