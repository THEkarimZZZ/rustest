-- FIX #2: Restrict students from modifying results after submission
-- Replace the old UPDATE policy with a restricted one

DROP POLICY IF EXISTS "Students can update their own results" ON results;

CREATE POLICY "Students can update their own results"
  ON results
  FOR UPDATE
  USING (auth.uid() = student_id AND finished_at IS NULL);

-- FIX #6: Add share_token column if not exists
ALTER TABLE tests ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex');

-- FIX: Add anti_fraud_settings column if not exists
ALTER TABLE tests ADD COLUMN IF NOT EXISTS anti_fraud_settings JSONB DEFAULT '{"max_focus_loss": 3, "min_answer_time": 2, "block_copy": true, "block_right_click": true, "detect_devtools": true, "auto_submit_on_violation": true}'::jsonb;

-- FIX: Add violations column to results
ALTER TABLE results ADD COLUMN IF NOT EXISTS violations JSONB DEFAULT '[]'::jsonb;

-- FIX: Disable RLS on classes and class_members for easier development
-- (Remove these in production after proper RLS policies are tested)
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_members DISABLE ROW LEVEL SECURITY;
