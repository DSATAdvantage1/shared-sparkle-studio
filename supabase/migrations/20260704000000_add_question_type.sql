-- Add question_type column to bank_questions table
ALTER TABLE public.bank_questions ADD COLUMN IF NOT EXISTS question_type text;

-- Create index for faster filtering by question_type
CREATE INDEX IF NOT EXISTS bank_questions_question_type_idx ON public.bank_questions (question_type);
