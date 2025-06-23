# Supabase Setup Guide

This guide will help you set up your Supabase database with the necessary tables for your email and WhatsApp application.

## Prerequisites

- Supabase account with a new project created
- Environment variables set up in your `.env` file:
  - `VITE_SUPABASE_URL`: Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Steps to Set Up Tables

1. **Navigate to the SQL Editor**:
   - Log in to your Supabase dashboard
   - Go to your project
   - Click on "SQL Editor" in the left sidebar

2. **Create Tables**:
   - Copy the entire content of the `supabase-migration.sql` file
   - Paste it into the SQL editor
   - Click "Run" to execute the SQL commands

3. **Verify Table Creation**:
   - Go to "Table Editor" in the left sidebar
   - You should see all the tables created:
     - profiles
     - user_groups
     - subscribers
     - group_subscribers
     - email_templates
     - whatsapp_templates
     - campaigns
     - campaign_groups

## Setting up Authentication

If you want to use Supabase Auth:

1. Go to "Authentication" in your Supabase dashboard
2. Configure your preferred sign-in methods (Email, Social providers, etc.)
3. Set up any email templates for authentication emails

## Testing Your Setup

After creating the tables, your application should be able to connect and interact with the database. If you still encounter issues, check:

1. Your environment variables in the `.env` file are correctly set
2. Your application has the correct permissions to interact with the tables
3. Row-level security policies are properly configured (you may need to set up specific policies depending on your app's requirements)

## Common Issues

- **404 Not Found**: Indicates that the table you're trying to access doesn't exist in the database
- **401 Unauthorized**: Indicates an issue with your authentication credentials or permissions
- **403 Forbidden**: Indicates an issue with your RLS (Row Level Security) policies

## Next Steps

After setting up the tables, you may need to:

1. Create RLS policies appropriate for your application's security needs
2. Set up any database functions or triggers
3. Configure storage buckets if your application will be handling file uploads
