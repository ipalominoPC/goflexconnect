/*
  # Create support_tickets table for hybrid support system

  1. New Tables
    - `support_tickets`
      - `id` (uuid, primary key) - Unique ticket identifier
      - `user_id` (uuid, nullable, foreign key) - References auth.users
      - `name` (text, required) - Name of person submitting ticket
      - `email` (text, required) - Contact email
      - `phone` (text, nullable) - Optional phone number
      - `category` (text, required) - Type: technical, account, billing, feature_request, feedback
      - `subject` (text, nullable) - Optional subject line
      - `message` (text, required) - Support request message
      - `status` (text, required, default 'open') - open, in_progress, resolved, closed
      - `priority` (text, nullable) - normal, high, or NULL
      - `source` (text, required, default 'app') - Where ticket originated
      - `created_at` (timestamptz) - Ticket creation time
      - `updated_at` (timestamptz) - Last update time
      - `last_admin_view` (timestamptz, nullable) - When admin last viewed
      - `last_admin_note` (text, nullable) - Admin notes on ticket

  2. Security
    - Enable RLS on `support_tickets` table
    - Users can INSERT their own tickets
    - Users can SELECT only their own tickets
    - Admins can SELECT/UPDATE all tickets (enforced via admin RPC and RLS)

  3. Indexes
    - Index on user_id for user ticket queries
    - Index on status for filtering
    - Index on created_at for sorting
    - Index on category for filtering
*/

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  category text NOT NULL CHECK (category IN ('technical', 'account', 'billing', 'feature_request', 'feedback')),
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text CHECK (priority IN ('normal', 'high')),
  source text NOT NULL DEFAULT 'app',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_admin_view timestamptz,
  last_admin_note text
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own tickets
CREATE POLICY "support_tickets_user_insert"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can select only their own tickets
CREATE POLICY "support_tickets_user_select"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can select all tickets
CREATE POLICY "support_tickets_admin_select"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

-- Policy: Admins can update all tickets
CREATE POLICY "support_tickets_admin_update"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );
