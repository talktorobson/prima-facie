-- Migration 002: Add law_firm_id to contact_submissions for per-firm website forms
-- Also adds custom_fields JSONB for custom form field responses

ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS law_firm_id UUID REFERENCES law_firms(id);
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS custom_fields JSONB;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_law_firm ON contact_submissions(law_firm_id);

-- Update RLS: staff can only read submissions for their firm
DROP POLICY IF EXISTS "contact_submissions_staff_read" ON contact_submissions;
CREATE POLICY "contact_submissions_staff_read" ON contact_submissions FOR SELECT USING (
  (law_firm_id IS NULL AND public.current_user_is_staff()) OR
  (law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff())
);
