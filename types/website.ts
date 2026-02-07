// =====================================================
// Prima Facie - Website Content Types
// TypeScript interfaces for per-firm website JSONB sections
// =====================================================

// ----- Theme -----
export interface WebsiteTheme {
  color_bg: string
  color_ink: string
  color_accent: string
  color_accent_light: string
  color_mist: string
  color_stone: string
  color_charcoal: string
  font_serif: string
  font_sans: string
}

// ----- Topbar -----
export interface WebsiteTopbar {
  text: string
  enabled: boolean
}

// ----- Header -----
export interface WebsiteNavLink {
  href: string
  label: string
}

export interface WebsiteHeader {
  firm_name: string
  firm_suffix: string
  logo_url?: string
  nav_links: WebsiteNavLink[]
  cta_text: string
  cta_secondary_text: string
  cta_secondary_href: string
}

// ----- Hero -----
export interface WebsiteHeroStat {
  number: string
  label: string
}

export interface WebsiteHero {
  headline_lines: string[]
  headline_gold_lines: string[]
  subheadline: string
  cta_primary_text: string
  cta_primary_href: string
  cta_secondary_text: string
  cta_secondary_href: string
  cta_tertiary_text: string
  cta_tertiary_href: string
  microcopy: string
  stats: WebsiteHeroStat[]
  hero_image_url?: string
  office_images?: string[]
}

// ----- Credentials -----
export interface WebsiteCredentialItem {
  icon: string
  metric: string
  label: string
}

export interface WebsiteCredentials {
  section_title: string
  items: WebsiteCredentialItem[]
}

// ----- Practice Areas -----
export interface WebsitePracticeAreaItem {
  icon: string
  title: string
  description: string
}

export interface WebsitePracticeAreas {
  section_title: string
  items: WebsitePracticeAreaItem[]
  cta_text: string
  cta_href: string
}

// ----- Philosophy -----
export interface WebsitePhilosophyValue {
  number: string
  title: string
  description: string
}

export interface WebsitePhilosophy {
  quote: string
  values: WebsitePhilosophyValue[]
}

// ----- Methodology -----
export interface WebsiteMethodologyStep {
  number: string
  title: string
  description: string
}

export interface WebsiteMethodology {
  section_title: string
  steps: WebsiteMethodologyStep[]
  cta_text: string
  cta_href: string
}

// ----- Content Preview -----
export interface WebsiteArticlePreview {
  title: string
  excerpt: string
  category: string
}

export interface WebsiteNewsletter {
  heading: string
  placeholder: string
  button_text: string
  disclaimer: string
}

export interface WebsiteContentPreview {
  section_title: string
  articles: WebsiteArticlePreview[]
  newsletter: WebsiteNewsletter
  show_articles: boolean
  newsletter_enabled: boolean
  cta_text: string
  cta_href: string
}

// ----- Coverage Region -----
export interface WebsiteCoverageRegion {
  title: string
  paragraphs: string[]
  cta_text: string
  cta_href: string
}

// ----- Founders -----
export interface WebsiteFounderMember {
  name: string
  title: string
  oab: string
  bio: string
  photo_url?: string
}

export interface WebsiteFounders {
  section_title: string
  members: WebsiteFounderMember[]
  cta_text: string
  cta_href: string
}

// ----- CTA Final -----
export interface WebsiteCtaFinal {
  headline: string
  subtitle: string
  cta_primary_text: string
  cta_primary_href: string
  cta_secondary_text: string
  cta_secondary_href: string
  disclaimer: string
}

// ----- Footer -----
export interface WebsiteSocialLink {
  platform: string
  url: string
}

export interface WebsiteFooterLegalLink {
  href: string
  label: string
}

export interface WebsiteFooter {
  firm_name: string
  tagline: string
  nav_links: WebsiteNavLink[]
  contact_phone: string
  contact_email: string
  contact_address: string
  social_links: WebsiteSocialLink[]
  legal_links: WebsiteFooterLegalLink[]
  copyright_text: string
}

// ----- Contact Form Custom Fields -----
export interface WebsiteContactFormField {
  id: string
  type: 'select' | 'textarea'
  label: string
  placeholder?: string
  required?: boolean
  options?: string[] // for select fields only
}

// ----- Contact Info (shared) -----
export interface WebsiteContactInfo {
  phone: string
  email: string
  address: string
  address_cep: string
  hours: string
  whatsapp_number: string
  whatsapp_message: string
  contact_form_fields?: WebsiteContactFormField[]
}

// ----- SEO -----
export interface WebsiteSeo {
  title: string
  description: string
  og_image_url?: string
  keywords?: string[]
}

// ----- Aggregate -----
export interface WebsiteContent {
  id: string
  law_firm_id: string
  theme: WebsiteTheme
  topbar: WebsiteTopbar
  header: WebsiteHeader
  hero: WebsiteHero
  credentials: WebsiteCredentials
  practice_areas: WebsitePracticeAreas
  philosophy: WebsitePhilosophy
  methodology: WebsiteMethodology
  content_preview: WebsiteContentPreview
  coverage_region: WebsiteCoverageRegion
  founders: WebsiteFounders
  cta_final: WebsiteCtaFinal
  footer: WebsiteFooter
  contact_info: WebsiteContactInfo
  seo: WebsiteSeo
  section_order: string[]
  hidden_sections: string[]
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

// Section key union type
export type WebsiteSectionKey =
  | 'theme'
  | 'topbar'
  | 'header'
  | 'hero'
  | 'credentials'
  | 'practice_areas'
  | 'philosophy'
  | 'methodology'
  | 'content_preview'
  | 'coverage_region'
  | 'founders'
  | 'cta_final'
  | 'footer'
  | 'contact_info'
  | 'seo'
