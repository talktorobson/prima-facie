-- Migration 012: Articles, Contact Submissions, Newsletter Subscribers
-- Creates tables for the public content hub, contact triage form, and newsletter

-- Articles table (blog/content system)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  law_firm_id UUID REFERENCES law_firms(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT NOT NULL CHECK (category IN ('alerta', 'guia', 'artigo')),
  topic TEXT CHECK (topic IN ('trabalhista', 'empresarial', 'cobranca')),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(law_firm_id, slug)
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  urgency TEXT,
  city TEXT,
  role TEXT,
  company_name TEXT,
  cnpj TEXT,
  employee_count TEXT,
  segment TEXT,
  details JSONB,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_channel TEXT,
  preferred_time TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- RLS policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Articles: anyone can read published, authenticated users with matching law_firm can manage
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (published = true);
CREATE POLICY "articles_admin_all" ON articles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.user_type IN ('admin', 'super_admin')
    AND (users.law_firm_id = articles.law_firm_id OR users.user_type = 'super_admin')
  )
);

-- Contact submissions: anyone can insert, admins can read
CREATE POLICY "contact_submissions_public_insert" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_submissions_admin_read" ON contact_submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.user_type IN ('admin', 'super_admin')
  )
);

-- Newsletter: anyone can insert, admins can read
CREATE POLICY "newsletter_public_insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "newsletter_admin_read" ON newsletter_subscribers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.user_type IN ('admin', 'super_admin')
  )
);
