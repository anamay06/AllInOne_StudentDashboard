-- =========================================================================================
-- AIM SUPABASE SCHEMA (PRODUCTION READY)
-- =========================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Mirrors auth.users to allow public querying safely if needed)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. USER SETTINGS 
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cgpa NUMERIC(4,2) DEFAULT 0.00,
  cgpa_trend TEXT DEFAULT 'up' CHECK (cgpa_trend IN ('up', 'down', 'neutral')),
  budget_limit NUMERIC(10,2) DEFAULT 1000.00,
  global_rank INTEGER DEFAULT NULL,
  leetcode_rank INTEGER DEFAULT NULL,
  cf_rank INTEGER DEFAULT NULL,
  cc_rank INTEGER DEFAULT NULL,
  leetcode_solved INTEGER DEFAULT 0,
  cf_rating INTEGER DEFAULT 0,
  cc_rating INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  preferred_domain TEXT DEFAULT 'all',
  sgpa1 NUMERIC(4,2) DEFAULT 0.00,
  sgpa2 NUMERIC(4,2) DEFAULT 0.00,
  sgpa3 NUMERIC(4,2) DEFAULT 0.00,
  sgpa4 NUMERIC(4,2) DEFAULT 0.00,
  sgpa5 NUMERIC(4,2) DEFAULT 0.00,
  sgpa6 NUMERIC(4,2) DEFAULT 0.00,
  sgpa7 NUMERIC(4,2) DEFAULT 0.00,
  sgpa8 NUMERIC(4,2) DEFAULT 0.00,
  lc_username TEXT DEFAULT NULL,
  cf_username TEXT DEFAULT NULL,
  cc_username TEXT DEFAULT NULL,
  github_username TEXT DEFAULT NULL,
  linkedin_username TEXT DEFAULT NULL,
  twitter_username TEXT DEFAULT NULL,
  instagram_username TEXT DEFAULT NULL,
  facebook_username TEXT DEFAULT NULL,
  google_access_token TEXT DEFAULT NULL,
  google_refresh_token TEXT DEFAULT NULL,
  google_token_expiry BIGINT DEFAULT NULL,
  google_calendar_email TEXT DEFAULT NULL,
  visible_widgets TEXT[] DEFAULT ARRAY['cgpa', 'budget', 'habits', 'calendar', 'contests', 'todos'],
  cached_stats_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. HABITS
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. TODOS
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false NOT NULL,
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'In Progress',
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  github_url TEXT,
  demo_url TEXT,
  category TEXT DEFAULT 'Self Made',
  hours_logged NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. TIME LOGS
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_hours NUMERIC(10,2)
);

-- 8. INTERNSHIP APPLICATIONS
CREATE TABLE IF NOT EXISTS public.internship_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  status TEXT DEFAULT 'applied' NOT NULL CHECK (status IN ('applied', 'selected', 'completed', 'dropped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  selected_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dropped_at TIMESTAMP WITH TIME ZONE
);

-- 9. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  task TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  due_date TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =========================================================================
-- AUTOMATED USER ONBOARDING TRIGGER
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Auto-initialize user settings
  INSERT INTO public.user_settings (user_id, cgpa, budget_limit, preferred_domain)
  VALUES (new.id, 0.00, 1000.00, 'all');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLATING DATA PER USER
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can fully manage their own user record" ON public.users;
CREATE POLICY "Users can fully manage their own user record" ON public.users FOR ALL USING (auth.uid() = id);

-- Create generic macro for tables with `user_id`
CREATE OR REPLACE FUNCTION create_user_id_policy(table_name text) RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "User isolation" ON public.%I;', table_name);
  EXECUTE format('CREATE POLICY "User isolation" ON public.%I FOR ALL USING (auth.uid() = user_id);', table_name);
END;
$$ LANGUAGE plpgsql;

SELECT create_user_id_policy('user_settings');
SELECT create_user_id_policy('habits');
SELECT create_user_id_policy('todos');
SELECT create_user_id_policy('transactions');
SELECT create_user_id_policy('projects');
SELECT create_user_id_policy('time_logs');
SELECT create_user_id_policy('internship_applications');
SELECT create_user_id_policy('assignments');

-- =========================================================================
-- STORAGE BUCKETS
-- =========================================================================

-- 10. STORAGE BUCKET: academic_resources (For Weekly Timetables, Calendars, Syllabus PDFs)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic_resources', 'academic_resources', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for academic_resources
CREATE POLICY "Anyone can read academic resources" ON storage.objects FOR SELECT TO public USING (bucket_id = 'academic_resources');
CREATE POLICY "Users can upload their own resources" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'academic_resources' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own resources" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'academic_resources' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own resources" ON storage.objects FOR DELETE TO public USING (bucket_id = 'academic_resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 11. CALENDAR EVENTS TABLE (For Local Events)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User isolation" ON public.calendar_events;
CREATE POLICY "User isolation" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
