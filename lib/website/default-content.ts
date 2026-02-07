import type {
  WebsiteTheme,
  WebsiteTopbar,
  WebsiteHeader,
  WebsiteHero,
  WebsiteCredentials,
  WebsitePracticeAreas,
  WebsitePhilosophy,
  WebsiteMethodology,
  WebsiteContentPreview,
  WebsiteCoverageRegion,
  WebsiteFounders,
  WebsiteCtaFinal,
  WebsiteFooter,
  WebsiteContactInfo,
  WebsiteSeo,
} from '@/types/website'

interface FirmInfo {
  name: string
  phone?: string
  email: string
  address_street?: string
  address_city?: string
  address_state?: string
}

export interface DefaultWebsiteContent {
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
}

function buildAddress(firm: FirmInfo): string {
  const parts: string[] = []
  if (firm.address_street) parts.push(firm.address_street)
  if (firm.address_city && firm.address_state) {
    parts.push(`${firm.address_city}/${firm.address_state}`)
  } else if (firm.address_city) {
    parts.push(firm.address_city)
  }
  return parts.join('\n') || 'Endereço não informado'
}

export function getDefaultWebsiteContent(firm: FirmInfo): DefaultWebsiteContent {
  const address = buildAddress(firm)
  const phone = firm.phone || '(00) 0000-0000'
  const currentYear = new Date().getFullYear()

  const theme: WebsiteTheme = {
    color_bg: '#FAF8F5',
    color_ink: '#1A1A2E',
    color_accent: '#B8860B',
    color_accent_light: '#D4A843',
    color_mist: '#E8E4DF',
    color_stone: '#6B6B7B',
    color_charcoal: '#2D2D3F',
    font_serif: 'Georgia',
    font_sans: 'system-ui',
  }

  const topbar: WebsiteTopbar = {
    text: `${firm.name} — Advocacia e Consultoria Jurídica.`,
    enabled: true,
  }

  const header: WebsiteHeader = {
    firm_name: firm.name,
    firm_suffix: 'Advogados',
    nav_links: [
      { href: '/atuacao', label: 'Atuação' },
      { href: '/conteudos', label: 'Conteúdos' },
      { href: '/equipe', label: 'Equipe' },
      { href: '/sobre', label: 'Sobre' },
      { href: '/contato', label: 'Contato' },
    ],
    cta_text: 'Agendar consulta',
    cta_secondary_text: 'Portal do Cliente',
    cta_secondary_href: '/login',
  }

  const hero: WebsiteHero = {
    headline_lines: ['Seu Escritório', 'de Advocacia.'],
    headline_gold_lines: ['Experiência e', 'Confiança.'],
    subheadline:
      'Oferecemos assessoria jurídica completa para pessoas físicas e jurídicas, com atendimento personalizado e foco em resultados.',
    cta_primary_text: 'Agendar consulta',
    cta_primary_href: '/contato',
    cta_secondary_text: 'Falar com a equipe',
    cta_secondary_href: '/contato',
    cta_tertiary_text: 'Portal do Cliente',
    cta_tertiary_href: '/login',
    microcopy: 'Primeira consulta sem compromisso.',
    stats: [
      { number: '500+', label: 'Clientes Atendidos' },
      { number: '1.000+', label: 'Processos Gerenciados' },
      { number: '10+', label: 'Anos de Experiência' },
    ],
  }

  const credentials: WebsiteCredentials = {
    section_title: 'Experiência e Registro',
    items: [
      { icon: 'Award', metric: '10+', label: 'Anos de Experiência' },
      { icon: 'TrendingUp', metric: '1.000+', label: 'Processos Gerenciados' },
      { icon: 'Shield', metric: '500+', label: 'Clientes Atendidos' },
      { icon: 'Scale', metric: 'OAB', label: 'Registro Ativo' },
    ],
  }

  const practice_areas: WebsitePracticeAreas = {
    section_title: 'Áreas de Atuação',
    items: [
      {
        icon: 'Scale',
        title: 'Direito Civil',
        description:
          'Assessoria em contratos, responsabilidade civil, direito do consumidor, cobranças e ações indenizatórias.',
      },
      {
        icon: 'Briefcase',
        title: 'Direito Trabalhista',
        description:
          'Defesa em reclamações trabalhistas, consultoria preventiva, elaboração de contratos de trabalho e acordos.',
      },
      {
        icon: 'Building2',
        title: 'Direito Empresarial',
        description:
          'Constituição de empresas, contratos comerciais, societário, recuperação judicial e consultoria corporativa.',
      },
      {
        icon: 'Shield',
        title: 'Direito Criminal',
        description:
          'Defesa criminal, habeas corpus, recursos e acompanhamento processual em todas as instâncias.',
      },
    ],
    cta_text: 'Ver detalhes da atuação',
    cta_href: '/atuacao',
  }

  const philosophy: WebsitePhilosophy = {
    quote: 'O Direito é a arte do bom e do justo.',
    values: [
      {
        number: '01',
        title: 'Ética',
        description:
          'Atuação pautada pela integridade, transparência e respeito ao cliente e à profissão.',
      },
      {
        number: '02',
        title: 'Excelência',
        description:
          'Profundidade técnica, atualização constante e dedicação máxima a cada caso.',
      },
      {
        number: '03',
        title: 'Compromisso',
        description:
          'Cada cliente recebe atenção integral — tratamos seu caso como se fosse o único.',
      },
    ],
  }

  const methodology: WebsiteMethodology = {
    section_title: 'Método de trabalho',
    steps: [
      {
        number: '01',
        title: 'Contato inicial',
        description:
          'Você entra em contato pelo formulário ou telefone. Avaliamos a demanda e identificamos a área jurídica adequada.',
      },
      {
        number: '02',
        title: 'Plano de ação',
        description:
          'Reunião para entender o caso em profundidade. Apresentamos estratégia, prazos e honorários.',
      },
      {
        number: '03',
        title: 'Execução e acompanhamento',
        description:
          'Equipe dedicada conduz o caso com relatórios periódicos. Você acompanha tudo pelo Portal do Cliente.',
      },
    ],
    cta_text: 'Entrar em contato',
    cta_href: '/contato',
  }

  const content_preview: WebsiteContentPreview = {
    section_title: 'Artigos e informativos jurídicos',
    articles: [
      {
        title: 'Conheça seus direitos como consumidor',
        excerpt:
          'Entenda as principais garantias previstas no Código de Defesa do Consumidor e como exercê-las.',
        category: 'Civil',
      },
      {
        title: 'Quando vale a pena entrar com uma ação trabalhista?',
        excerpt:
          'Saiba quais situações justificam buscar a Justiça do Trabalho e o que esperar do processo.',
        category: 'Trabalhista',
      },
      {
        title: 'Dicas para proteger o patrimônio da sua empresa',
        excerpt:
          'Estratégias jurídicas para blindar seu negócio contra riscos e imprevistos.',
        category: 'Empresarial',
      },
    ],
    newsletter: {
      heading: 'Receba informativos jurídicos no seu e-mail',
      placeholder: 'seu@email.com.br',
      button_text: 'Inscrever-se',
      disclaimer:
        'Ao se inscrever, você concorda com nossa Política de Privacidade. Você pode cancelar a qualquer momento.',
    },
    show_articles: true,
    newsletter_enabled: true,
    cta_text: 'Ver todos os conteúdos',
    cta_href: '/conteudos',
  }

  const coverage_region: WebsiteCoverageRegion = {
    title: 'Área de Atuação',
    paragraphs: [
      'Atendemos clientes em toda a região, com atuação presencial e remota conforme a necessidade de cada caso.',
      'Para demandas em outras localidades, contamos com rede de correspondentes jurídicos credenciados.',
    ],
    cta_text: 'Ver área de atuação',
    cta_href: '/area-de-atuacao',
  }

  const founders: WebsiteFounders = {
    section_title: 'Quem Somos',
    members: [
      {
        name: 'Dr. Nome do Sócio',
        title: 'Sócio Fundador',
        oab: 'OAB/SP',
        bio: 'Advogado com ampla experiência em direito civil e empresarial. Comprometido com a defesa dos interesses de seus clientes.',
      },
    ],
    cta_text: 'Conhecer a equipe',
    cta_href: '/equipe',
  }

  const cta_final: WebsiteCtaFinal = {
    headline: 'Precisa de orientação jurídica?',
    subtitle: 'Entre em contato e agende uma consulta com nossa equipe.',
    cta_primary_text: 'Solicitar contato',
    cta_primary_href: '/contato',
    cta_secondary_text: 'Portal do Cliente',
    cta_secondary_href: '/login',
    disclaimer: 'Responderemos em até 24 horas úteis.',
  }

  const footer: WebsiteFooter = {
    firm_name: firm.name,
    tagline: `${firm.name} — Advocacia e consultoria jurídica com foco em resultados.`,
    nav_links: [
      { href: '/sobre', label: 'Sobre o Escritório' },
      { href: '/atuacao', label: 'Áreas de Atuação' },
      { href: '/conteudos', label: 'Conteúdos' },
      { href: '/contato', label: 'Contato' },
      { href: '/login', label: 'Portal do Cliente' },
    ],
    contact_phone: phone,
    contact_email: firm.email,
    contact_address: address,
    social_links: [{ platform: 'linkedin', url: '#' }],
    legal_links: [
      { href: '/politica-de-privacidade', label: 'Política de Privacidade' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/aviso-legal', label: 'Aviso Legal' },
    ],
    copyright_text: `${currentYear} ${firm.name}. Todos os direitos reservados.`,
  }

  const contact_info: WebsiteContactInfo = {
    phone,
    email: firm.email,
    address,
    address_cep: '00000-000',
    hours: 'Seg a Sex, 8h às 18h',
    whatsapp_number: '',
    whatsapp_message: 'Olá, gostaria de agendar uma consulta.',
  }

  const seo: WebsiteSeo = {
    title: `${firm.name} — Advocacia e Consultoria Jurídica`,
    description: `${firm.name}: escritório de advocacia com atendimento personalizado em direito civil, trabalhista, empresarial e criminal.`,
  }

  return {
    theme,
    topbar,
    header,
    hero,
    credentials,
    practice_areas,
    philosophy,
    methodology,
    content_preview,
    coverage_region,
    founders,
    cta_final,
    footer,
    contact_info,
    seo,
    section_order: [
      'topbar',
      'header',
      'hero',
      'credentials',
      'practice_areas',
      'philosophy',
      'methodology',
      'content_preview',
      'coverage_region',
      'founders',
      'cta_final',
      'footer',
    ],
    hidden_sections: [],
    is_published: false,
  }
}
