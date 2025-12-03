/*
  # Add ticket_number column to support_tickets

  1. Changes
    - Add `ticket_number` column to support_tickets table
    - Column stores human-friendly ticket IDs like GFC-20251202-000123
    - UNIQUE constraint to prevent duplicates
    - Create index for fast lookups by ticket number
  
  2. Notes
    - Uses IF NOT EXISTS to safely add column
    - Existing tickets will have NULL ticket_number (can be backfilled if needed)
    - New tickets will always have a ticket_number generated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'ticket_number'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN ticket_number TEXT UNIQUE;
  END IF;
END $$;

-- Create index for fast ticket number lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);
