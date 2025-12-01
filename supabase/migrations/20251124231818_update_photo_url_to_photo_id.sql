/*
  # Update measurements table photo storage

  1. Changes
    - Rename photo_url column to photo_id
    - Change data type from text to uuid
    - Update to reference photo IDs instead of storing base64 data

  2. Notes
    - This fixes the localStorage quota exceeded error
    - Photos will now be stored separately in IndexedDB on client side
    - Server side will store photo IDs for future cloud storage integration
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE measurements RENAME COLUMN photo_url TO photo_id;
    ALTER TABLE measurements ALTER COLUMN photo_id TYPE uuid USING photo_id::uuid;
  END IF;
END $$;
