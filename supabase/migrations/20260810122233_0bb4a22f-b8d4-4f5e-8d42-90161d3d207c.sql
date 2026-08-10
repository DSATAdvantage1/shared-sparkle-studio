-- Roles enum and user_roles table (security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Tests table (admin-uploaded structured tests)
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('RW','MATH','MIXED')),
  month TEXT,
  year INT,
  source_pdf_path TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tests TO authenticated;
GRANT ALL ON public.tests TO service_role;

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published tests"
  ON public.tests FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tests"
  ON public.tests FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tests"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tests"
  ON public.tests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tests_updated_at
BEFORE UPDATE ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Admins read pdfs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'test-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload pdfs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'test-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete pdfs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'test-pdfs' AND public.has_role(auth.uid(), 'admin'));

-- Question bank
CREATE TABLE public.bank_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('RW','MATH')),
  domain text NOT NULL,
  skill text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  prompt text NOT NULL,
  passage text,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text,
  question_type text,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bank_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bank_questions TO authenticated;
GRANT ALL ON public.bank_questions TO service_role;

ALTER TABLE public.bank_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published bank questions"
  ON public.bank_questions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all bank questions"
  ON public.bank_questions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert bank questions"
  ON public.bank_questions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update bank questions"
  ON public.bank_questions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete bank questions"
  ON public.bank_questions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER bank_questions_touch_updated_at
  BEFORE UPDATE ON public.bank_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX bank_questions_section_idx ON public.bank_questions (section, domain, skill);
CREATE INDEX bank_questions_question_type_idx ON public.bank_questions (question_type);

-- Per-user DSAT exam countdown date
CREATE TABLE public.user_exam_countdowns (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_exam_countdowns TO authenticated;
GRANT ALL ON public.user_exam_countdowns TO service_role;

ALTER TABLE public.user_exam_countdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exam date"
  ON public.user_exam_countdowns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own exam date"
  ON public.user_exam_countdowns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam date"
  ON public.user_exam_countdowns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_exam_countdowns_updated_at
BEFORE UPDATE ON public.user_exam_countdowns
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Word meaning persistent cache
CREATE TABLE public.word_meaning_cache (
  word text PRIMARY KEY,
  payload jsonb NOT NULL,
  source text NOT NULL,
  cached boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.word_meaning_cache TO anon, authenticated;
GRANT ALL ON public.word_meaning_cache TO service_role;

ALTER TABLE public.word_meaning_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached word meanings"
  ON public.word_meaning_cache FOR SELECT
  USING (true);

CREATE TRIGGER trg_word_meaning_cache_updated_at
BEFORE UPDATE ON public.word_meaning_cache
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_word_meaning_cache_word ON public.word_meaning_cache(word);