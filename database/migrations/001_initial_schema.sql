-- ============================================
-- Rustest Database Schema
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  legal_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their own classes"
  ON classes
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own classes"
  ON classes
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classes"
  ON classes
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own classes"
  ON classes
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- ============================================
-- 3. CLASS_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS class_members (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

-- Enable RLS
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view members of their classes"
  ON class_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can add members to their classes"
  ON class_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can remove members from their classes"
  ON class_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own memberships"
  ON class_members
  FOR SELECT
  USING (auth.uid() = student_id);

-- Add this policy AFTER class_members table exists
CREATE POLICY "Students can view classes they are members of"
  ON classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = classes.id 
      AND class_members.student_id = auth.uid()
    )
  );

-- ============================================
-- 4. TESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  grading_scale JSONB NOT NULL DEFAULT '{"5": 90, "4": 75, "3": 50, "2": 0}'::jsonb,
  settings JSONB DEFAULT '{"time_limit": null, "shuffle_questions": false, "show_results_immediately": true}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their own tests"
  ON tests
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own tests"
  ON tests
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own tests"
  ON tests
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own tests"
  ON tests
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Students can view published tests for their classes
CREATE POLICY "Students can view published tests in their classes"
  ON tests
  FOR SELECT
  USING (
    is_published = TRUE AND
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = tests.class_id 
      AND class_members.student_id = auth.uid()
    )
  );

-- ============================================
-- 5. QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('choice', 'multi', 'text', 'info_block')),
  content TEXT NOT NULL,
  options JSONB, -- For choice/multi questions: array of options
  correct_answer JSONB, -- Correct answer(s)
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view questions for their tests"
  ON questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create questions for their tests"
  ON questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update questions for their tests"
  ON questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete questions for their tests"
  ON questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.teacher_id = auth.uid()
    )
  );

-- Students can view questions for published tests in their classes
CREATE POLICY "Students can view questions for published tests"
  ON questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests 
      JOIN class_members ON class_members.class_id = tests.class_id
      WHERE tests.id = questions.test_id 
      AND tests.is_published = TRUE
      AND class_members.student_id = auth.uid()
    )
  );

-- ============================================
-- 6. RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  raw_score INTEGER NOT NULL DEFAULT 0,
  total_possible INTEGER NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  final_grade TEXT,
  answers JSONB, -- Student's answers
  focus_loss_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE(test_id, student_id)
);

-- Enable RLS
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view results for their tests"
  ON results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = results.test_id 
      AND tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own results"
  ON results
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own results"
  ON results
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own results"
  ON results
  FOR UPDATE
  USING (auth.uid() = student_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_invite_code ON classes(invite_code);
CREATE INDEX idx_class_members_class_id ON class_members(class_id);
CREATE INDEX idx_class_members_student_id ON class_members(student_id);
CREATE INDEX idx_tests_teacher_id ON tests(teacher_id);
CREATE INDEX idx_tests_class_id ON tests(class_id);
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_results_test_id ON results(test_id);
CREATE INDEX idx_results_student_id ON results(student_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE profiles IS 'User profiles with role and legal acceptance';
COMMENT ON TABLE classes IS 'Educational classes managed by teachers';
COMMENT ON TABLE class_members IS 'Many-to-many relationship between classes and students';
COMMENT ON TABLE tests IS 'Tests created by teachers';
COMMENT ON TABLE questions IS 'Questions within tests';
COMMENT ON TABLE results IS 'Test results submitted by students';
