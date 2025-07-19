/*
  # Fix RLS Policy for Responses Table

  1. Changes
    - Drop existing "Public can submit responses" policy
    - Create new policy with corrected WITH CHECK condition
    - Use scalar subquery instead of EXISTS for better RLS evaluation

  2. Security
    - Maintains security by only allowing responses to active forms
    - Fixes RLS violation for anonymous users submitting responses
*/

-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Public can submit responses" ON responses;

-- Create new policy with corrected WITH CHECK condition
CREATE POLICY "Public can submit responses"
  ON responses
  FOR INSERT
  TO anon
  WITH CHECK (
    (SELECT is_active FROM forms WHERE forms.id = responses.form_id) = true
  );