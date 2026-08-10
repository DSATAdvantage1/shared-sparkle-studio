
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
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bank questions"
  ON public.bank_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bank questions"
  ON public.bank_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bank questions"
  ON public.bank_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER bank_questions_touch_updated_at
  BEFORE UPDATE ON public.bank_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX bank_questions_section_idx ON public.bank_questions (section, domain, skill);
