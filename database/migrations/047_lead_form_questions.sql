ALTER TABLE lead_forms
  ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]';

ALTER TABLE lead_form_submissions
  ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}';
