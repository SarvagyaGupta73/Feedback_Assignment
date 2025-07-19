/*
  # Fix RLS Policy for Anonymous Response Submissions

  1. Problem
    - Anonymous users cannot submit responses due to RLS policy violation
    - Current policy WITH CHECK condition is not working properly for anon users

  2. Solution
    - Drop existing problematic policy
    - Create new policy with simplified condition that works for anonymous users
    - Ensure anonymous users can only submit to active forms

  3. Security
    - Maintains security by only allowing responses to active forms
    - Anonymous users can insert responses but cannot read/update/delete
*/

-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Public can submit responses" ON responses;

-- Create new policy with simplified condition for anonymous users
CREATE POLICY "Anonymous users can submit responses to active forms"
  ON responses
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = form_id 
      AND forms.is_active = true
    )
  );

-- Also ensure the answers policy works for anonymous users
DROP POLICY IF EXISTS "Public can submit answers" ON answers;

CREATE POLICY "Anonymous users can submit answers"
  ON answers
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON f.id = r.form_id
      WHERE r.id = response_id 
      AND f.is_active = true
    )
  );