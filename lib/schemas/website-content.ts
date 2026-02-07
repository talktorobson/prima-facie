import { z } from 'zod'

// ----- Theme -----
export const websiteThemeSchema = z.object({
  color_bg: z.string().min(1, 'Cor de fundo é obrigatória'),
  color_ink: z.string().min(1, 'Cor de texto é obrigatória'),
  color_accent: z.string().min(1, 'Cor de destaque é obrigatória'),
  color_accent_light: z.string().min(1, 'Cor de destaque clara é obrigatória'),
  color_mist: z.string().min(1, 'Cor mist é obrigatória'),
  color_stone: z.string().min(1, 'Cor stone é obrigatória'),
  color_charcoal: z.string().min(1, 'Cor charcoal é obrigatória'),
  font_serif: z.string().min(1, 'Fonte serifada é obrigatória'),
  font_sans: z.string().min(1, 'Fonte sans-serif é obrigatória'),
})

// ----- Topbar -----
export const websiteTopbarSchema = z.object({
  text: z.string().min(1, 'Texto do topbar é obrigatório'),
  enabled: z.boolean(),
})

// ----- Header -----
export const websiteNavLinkSchema = z.object({
  href: z.string().min(1, 'Link é obrigatório'),
  label: z.string().min(1, 'Label é obrigatório'),
})

export const websiteHeaderSchema = z.object({
  firm_name: z.string().min(1, 'Nome do escritório é obrigatório'),
  firm_suffix: z.string().min(1, 'Sufixo é obrigatório'),
  logo_url: z.string().optional(),
  nav_links: z.array(websiteNavLinkSchema),
  cta_text: z.string().min(1, 'Texto do CTA é obrigatório'),
  cta_secondary_text: z.string().min(1, 'Texto do CTA secundário é obrigatório'),
  cta_secondary_href: z.string().min(1, 'Link do CTA secundário é obrigatório'),
})

// ----- Hero -----
export const websiteHeroStatSchema = z.object({
  number: z.string().min(1, 'Número é obrigatório'),
  label: z.string().min(1, 'Label é obrigatório'),
})

export const websiteHeroSchema = z.object({
  headline_lines: z.array(z.string().min(1)),
  headline_gold_lines: z.array(z.string().min(1)),
  subheadline: z.string().min(1, 'Subtítulo é obrigatório'),
  cta_primary_text: z.string().min(1, 'Texto do CTA primário é obrigatório'),
  cta_primary_href: z.string().min(1, 'Link do CTA primário é obrigatório'),
  cta_secondary_text: z.string().min(1, 'Texto do CTA secundário é obrigatório'),
  cta_secondary_href: z.string().min(1, 'Link do CTA secundário é obrigatório'),
  cta_tertiary_text: z.string().min(1, 'Texto do CTA terciário é obrigatório'),
  cta_tertiary_href: z.string().min(1, 'Link do CTA terciário é obrigatório'),
  microcopy: z.string().min(1, 'Microcopy é obrigatório'),
  stats: z.array(websiteHeroStatSchema),
  hero_image_url: z.string().optional(),
  office_images: z.array(z.string()).optional(),
})

// ----- Credentials -----
export const websiteCredentialItemSchema = z.object({
  icon: z.string().min(1, 'Ícone é obrigatório'),
  metric: z.string().min(1, 'Métrica é obrigatória'),
  label: z.string().min(1, 'Label é obrigatório'),
})

export const websiteCredentialsSchema = z.object({
  section_title: z.string().min(1, 'Título da seção é obrigatório'),
  items: z.array(websiteCredentialItemSchema),
})

// ----- Practice Areas -----
export const websitePracticeAreaItemSchema = z.object({
  icon: z.string().min(1, 'Ícone é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
})

export const websitePracticeAreasSchema = z.object({
  section_title: z.string().min(1, 'Título da seção é obrigatório'),
  items: z.array(websitePracticeAreaItemSchema),
  cta_text: z.string().min(1, 'Texto do CTA é obrigatório'),
  cta_href: z.string().min(1, 'Link do CTA é obrigatório'),
})

// ----- Philosophy -----
export const websitePhilosophyValueSchema = z.object({
  number: z.string().min(1, 'Número é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
})

export const websitePhilosophySchema = z.object({
  quote: z.string().min(1, 'Citação é obrigatória'),
  values: z.array(websitePhilosophyValueSchema),
})

// ----- Methodology -----
export const websiteMethodologyStepSchema = z.object({
  number: z.string().min(1, 'Número é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
})

export const websiteMethodologySchema = z.object({
  section_title: z.string().min(1, 'Título da seção é obrigatório'),
  steps: z.array(websiteMethodologyStepSchema),
  cta_text: z.string().min(1, 'Texto do CTA é obrigatório'),
  cta_href: z.string().min(1, 'Link do CTA é obrigatório'),
})

// ----- Content Preview -----
export const websiteArticlePreviewSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  excerpt: z.string().min(1, 'Resumo é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
})

export const websiteNewsletterSchema = z.object({
  heading: z.string().min(1, 'Título é obrigatório'),
  placeholder: z.string().min(1, 'Placeholder é obrigatório'),
  button_text: z.string().min(1, 'Texto do botão é obrigatório'),
  disclaimer: z.string().min(1, 'Disclaimer é obrigatório'),
})

export const websiteContentPreviewSchema = z.object({
  section_title: z.string().min(1, 'Título da seção é obrigatório'),
  articles: z.array(websiteArticlePreviewSchema),
  newsletter: websiteNewsletterSchema,
  show_articles: z.boolean(),
  newsletter_enabled: z.boolean(),
  cta_text: z.string().min(1, 'Texto do CTA é obrigatório'),
  cta_href: z.string().min(1, 'Link do CTA é obrigatório'),
})

// ----- Coverage Region -----
export const websiteCoverageRegionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  paragraphs: z.array(z.string().min(1)),
  cta_text: z.string().min(1, 'Texto do CTA é obrigatório'),
  cta_href: z.string().min(1, 'Link do CTA é obrigatório'),
})

// ----- Founders -----
export const websiteFounderMemberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  oab: z.string().min(1, 'OAB é obrigatória'),
  bio: z.string().min(1, 'Biografia é obrigatória'),
  photo_url: z.string().optional(),
})

export const websiteFoundersSchema = z.object({
  section_title: z.string().min(1, 'Título da seção é obrigatório'),
  members: z.array(websiteFounderMemberSchema),
  cta_text: z.string().min(1, 'Texto do CTA é obrigatório'),
  cta_href: z.string().min(1, 'Link do CTA é obrigatório'),
})

// ----- CTA Final -----
export const websiteCtaFinalSchema = z.object({
  headline: z.string().min(1, 'Título é obrigatório'),
  subtitle: z.string().min(1, 'Subtítulo é obrigatório'),
  cta_primary_text: z.string().min(1, 'Texto do CTA primário é obrigatório'),
  cta_primary_href: z.string().min(1, 'Link do CTA primário é obrigatório'),
  cta_secondary_text: z.string().min(1, 'Texto do CTA secundário é obrigatório'),
  cta_secondary_href: z.string().min(1, 'Link do CTA secundário é obrigatório'),
  disclaimer: z.string().min(1, 'Disclaimer é obrigatório'),
})

// ----- Footer -----
export const websiteSocialLinkSchema = z.object({
  platform: z.string().min(1, 'Plataforma é obrigatória'),
  url: z.string().min(1, 'URL é obrigatória'),
})

export const websiteFooterLegalLinkSchema = z.object({
  href: z.string().min(1, 'Link é obrigatório'),
  label: z.string().min(1, 'Label é obrigatório'),
})

export const websiteFooterSchema = z.object({
  firm_name: z.string().min(1, 'Nome do escritório é obrigatório'),
  tagline: z.string().min(1, 'Tagline é obrigatória'),
  nav_links: z.array(websiteNavLinkSchema),
  contact_phone: z.string().min(1, 'Telefone é obrigatório'),
  contact_email: z.string().min(1, 'Email é obrigatório'),
  contact_address: z.string().min(1, 'Endereço é obrigatório'),
  social_links: z.array(websiteSocialLinkSchema),
  legal_links: z.array(websiteFooterLegalLinkSchema),
  copyright_text: z.string().min(1, 'Texto de copyright é obrigatório'),
})

// ----- Contact Info -----
export const websiteContactInfoSchema = z.object({
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().min(1, 'Email é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  address_cep: z.string().min(1, 'CEP é obrigatório'),
  hours: z.string().min(1, 'Horário é obrigatório'),
  whatsapp_number: z.string().min(1, 'Número do WhatsApp é obrigatório'),
  whatsapp_message: z.string().min(1, 'Mensagem do WhatsApp é obrigatória'),
})

// ----- SEO -----
export const websiteSeoSchema = z.object({
  title: z.string().min(1, 'Título SEO é obrigatório'),
  description: z.string().min(1, 'Descrição SEO é obrigatória'),
  og_image_url: z.string().optional(),
  keywords: z.array(z.string()).optional(),
})
