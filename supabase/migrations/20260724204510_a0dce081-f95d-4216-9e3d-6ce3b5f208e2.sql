
-- Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
