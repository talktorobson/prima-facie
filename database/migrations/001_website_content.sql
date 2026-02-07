-- =====================================================
-- Migration 001: Website Content Management
-- Per-firm editable public websites
-- =====================================================

-- 1. Add slug and website_published to law_firms
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS website_published BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_law_firms_slug ON law_firms(slug) WHERE slug IS NOT NULL;

-- 2. Website content table — one row per firm, JSONB per section
CREATE TABLE IF NOT EXISTS website_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL UNIQUE REFERENCES law_firms(id) ON DELETE CASCADE,

  -- Visual theme
  theme JSONB DEFAULT '{}',

  -- Page sections (each is a JSONB column with a well-defined shape)
  topbar JSONB DEFAULT '{}',
  header JSONB DEFAULT '{}',
  hero JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  practice_areas JSONB DEFAULT '{}',
  philosophy JSONB DEFAULT '{}',
  methodology JSONB DEFAULT '{}',
  content_preview JSONB DEFAULT '{}',
  coverage_region JSONB DEFAULT '{}',
  founders JSONB DEFAULT '{}',
  cta_final JSONB DEFAULT '{}',
  footer JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',

  -- SEO metadata
  seo JSONB DEFAULT '{}',

  -- Section ordering and visibility
  section_order JSONB DEFAULT '["topbar","header","hero","credentials","practice_areas","philosophy","methodology","content_preview","coverage_region","founders","cta_final","footer"]',
  hidden_sections JSONB DEFAULT '[]',

  -- Publishing state
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_website_content_law_firm ON website_content(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_website_content_published ON website_content(is_published) WHERE is_published = true;

-- Updated_at trigger
CREATE TRIGGER set_website_content_updated_at
  BEFORE UPDATE ON website_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Row Level Security
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read published website content (for /site/[slug] SSR)
CREATE POLICY "website_content_public_read"
  ON website_content FOR SELECT
  USING (is_published = true);

-- Staff manage: users can manage their own firm's website content
CREATE POLICY "website_content_staff_manage"
  ON website_content FOR ALL
  USING (law_firm_id = public.current_user_law_firm_id())
  WITH CHECK (law_firm_id = public.current_user_law_firm_id());

-- Super admin bypass: super admins can manage all website content
CREATE POLICY "website_content_super_admin"
  ON website_content FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role bypass
CREATE POLICY "website_content_service_role"
  ON website_content FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Storage bucket for website assets (images, logos)
-- Run via Supabase dashboard or API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('website-assets', 'website-assets', true);
