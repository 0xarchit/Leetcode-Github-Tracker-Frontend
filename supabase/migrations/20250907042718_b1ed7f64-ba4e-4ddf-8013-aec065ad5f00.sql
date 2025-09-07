-- Create admin_profiles table for managing admin users
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable Row Level Security
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin management
CREATE POLICY "Admins can view all admin profiles" 
ON public.admin_profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap 
    WHERE ap.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can insert admin profiles" 
ON public.admin_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap 
    WHERE ap.user_id = auth.uid() AND ap.is_super_admin = true
  )
);

CREATE POLICY "Super admins can update admin profiles" 
ON public.admin_profiles 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap 
    WHERE ap.user_id = auth.uid() AND ap.is_super_admin = true
  )
);

CREATE POLICY "Super admins can delete admin profiles" 
ON public.admin_profiles 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap 
    WHERE ap.user_id = auth.uid() AND ap.is_super_admin = true
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup and admin creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (user_id, email, display_name, is_super_admin)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    -- First user becomes super admin
    NOT EXISTS (SELECT 1 FROM public.admin_profiles)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();