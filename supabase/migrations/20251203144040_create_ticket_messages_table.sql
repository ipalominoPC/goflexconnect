/*
  # Create ticket messages table for support conversation threads

  1. New Tables
    - `ticket_messages`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key to support_tickets)
      - `sender_type` (text: 'customer' or 'admin')
      - `sender_id` (uuid, nullable - user_id if admin)
      - `sender_name` (text)
      - `sender_email` (text)
      - `message` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on `ticket_messages` table
    - Admins can view and insert all messages
    - Customers can view messages for their own tickets
    
  3. Changes
    - Add `last_reply_at` to support_tickets for sorting
    - Add `unread_by_admin` flag to support_tickets
*/

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at DESC);

-- Add columns to support_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'last_reply_at'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN last_reply_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'unread_by_admin'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN unread_by_admin boolean DEFAULT true;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Admin can see all messages
CREATE POLICY "Admins can view all ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'ipalomino@gmail.com',
        'isaac@goflexconnect.com',
        'dev@goflexconnect.com'
      )
    )
  );

-- Admin can insert messages
CREATE POLICY "Admins can insert ticket messages"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'ipalomino@gmail.com',
        'isaac@goflexconnect.com',
        'dev@goflexconnect.com'
      )
    )
  );

-- Customers can view messages for their own tickets
CREATE POLICY "Customers can view their own ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );