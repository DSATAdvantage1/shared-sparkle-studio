-- Per-user DSAT exam countdown date (timezone-safe: store date only)
CREATE TABLE public.user_exam_countdowns (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Optional: ensure we don't leave trigger-less updated_at out-of-date
CREATE OR REPLACE FUNCTION public.touch_user_exam_countdowns_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_exam_countdowns_updated_at ON public.user_exam_countdowns;

CREATE TRIGGER user_exam_countdowns_updated_at
BEFORE UPDATE ON public.user_exam_countdowns
FOR EACH ROW EXECUTE FUNCTION public.touch_user_exam_countdowns_updated_at();
