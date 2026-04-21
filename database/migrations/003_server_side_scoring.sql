-- ============================================
-- MIGRATION 003: Server-side score calculation
-- ============================================
-- Prevents client-side manipulation of scores.
-- The trigger calculates raw_score, total_possible, percentage, and final_grade
-- from the answers JSON on the server side.

CREATE OR REPLACE FUNCTION calculate_result_score()
RETURNS TRIGGER AS $$
DECLARE
  q RECORD;
  v_total_possible INTEGER := 0;
  v_raw_score INTEGER := 0;
  v_answer TEXT;
  v_correct TEXT;
  v_threshold_5 NUMERIC;
  v_threshold_4 NUMERIC;
  v_threshold_3 NUMERIC;
BEGIN
  -- Only calculate when finished
  IF NEW.finished_at IS NULL OR NEW.answers IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get grading scale thresholds
  SELECT
    (grading_scale ->> '5')::numeric,
    (grading_scale ->> '4')::numeric,
    (grading_scale ->> '3')::numeric
  INTO v_threshold_5, v_threshold_4, v_threshold_3
  FROM tests WHERE id = NEW.test_id;

  -- Defaults if no scale
  IF v_threshold_5 IS NULL THEN v_threshold_5 := 90; END IF;
  IF v_threshold_4 IS NULL THEN v_threshold_4 := 75; END IF;
  IF v_threshold_3 IS NULL THEN v_threshold_3 := 50; END IF;

  -- Iterate over questions
  FOR q IN
    SELECT id, type, correct_answer, points
    FROM questions
    WHERE test_id = NEW.test_id
    ORDER BY order_index
  LOOP
    IF q.type = 'info_block' THEN
      CONTINUE;
    END IF;

    v_total_possible := v_total_possible + q.points;

    -- Extract answer as text
    v_answer := NEW.answers ->> q.id;

    IF v_answer IS NULL OR v_answer = '' THEN
      CONTINUE;
    END IF;

    v_correct := q.correct_answer::text;

    -- Score by type
    IF q.type = 'choice' THEN
      IF v_answer = v_correct THEN
        v_raw_score := v_raw_score + q.points;
      END IF;

    ELSIF q.type = 'multi' THEN
      -- Compare arrays (order-independent)
      IF v_correct IS NOT NULL AND v_correct != 'null' THEN
        -- Normalize: sort and compare
        IF (
          SELECT array_agg(elem ORDER BY elem)
          FROM jsonb_array_elements_text(NEW.answers -> q.id) AS elem
        ) IS NOT DISTINCT FROM (
          SELECT array_agg(elem ORDER BY elem)
          FROM jsonb_array_elements_text(q.correct_answer) AS elem
        ) THEN
          v_raw_score := v_raw_score + q.points;
        END IF;
      END IF;

    ELSIF q.type = 'text' THEN
      IF v_correct IS NOT NULL AND v_correct != 'null' THEN
        IF lower(trim(v_answer)) = lower(trim(v_correct)) THEN
          v_raw_score := v_raw_score + q.points;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Set calculated values — override anything the client sent
  NEW.raw_score := v_raw_score;
  NEW.total_possible := v_total_possible;
  NEW.percentage := CASE
    WHEN v_total_possible > 0
    THEN round((v_raw_score::numeric / v_total_possible::numeric) * 100, 2)
    ELSE 0
  END;

  -- Grade
  IF NEW.percentage >= v_threshold_5 THEN
    NEW.final_grade := '5';
  ELSIF NEW.percentage >= v_threshold_4 THEN
    NEW.final_grade := '4';
  ELSIF NEW.percentage >= v_threshold_3 THEN
    NEW.final_grade := '3';
  ELSE
    NEW.final_grade := '2';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trg_calculate_result_score ON results;

CREATE TRIGGER trg_calculate_result_score
  BEFORE INSERT OR UPDATE OF answers, finished_at ON results
  FOR EACH ROW
  WHEN (NEW.finished_at IS NOT NULL AND NEW.answers IS NOT NULL)
  EXECUTE FUNCTION calculate_result_score();

-- ============================================
-- Restrict results INSERT — only for assigned students
-- ============================================

DROP POLICY IF EXISTS "Students can create their own results" ON results;

CREATE POLICY "Students can create their own results"
  ON results
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM tests t
      JOIN class_members cm ON cm.class_id = t.class_id
      WHERE t.id = results.test_id
        AND t.is_published = true
        AND cm.student_id = auth.uid()
    )
  );
