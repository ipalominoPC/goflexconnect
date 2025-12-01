/*
  # Create profiles table for user onboarding tracking

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `has_seen_onboarding` (boolean) - Track if user has seen onboarding
      - `onboarding_completed_at` (timestamptz) - When onboarding was completed
      - `created_at` (timestamptz) - Profile creation timestamp
      - `updated_at` (timestamptz) - Last profile update timestamp
      
  2. Security
    - Enable RLS on `profiles` table
    - Users can SELECT their own profile
    - Users can UPDATE their own profile
    - New user trigger creates profile automatically
    
  3. Indexes
    - Primary key on id (automatic)
    - Index on has_seen_onboarding for quick filtering
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_seen_onboarding boolean DEFAULT false,
  onboarding_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(has_seen_onboarding);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own profile
CREATE POLICY "profiles_user_select"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can UPDATE their own profile
CREATE POLICY "profiles_user_update"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can INSERT their own profile
CREATE POLICY "profiles_user_insert"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create profile automatically on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, has_seen_onboarding, onboarding_completed_at)
  VALUES (NEW.id, false, NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
