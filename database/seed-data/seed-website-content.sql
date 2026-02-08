-- =====================================================
-- Prima Facie - Website Content Seed Data
-- Seeds the D'Avila Reis law firm with full website content
-- =====================================================

-- Step 1: Enable website for D'Avila Reis firm
UPDATE law_firms
SET slug = 'davila-reis',
    website_published = true,
    updated_at = now()
WHERE name ILIKE '%avila%reis%';

-- Step 2: Insert website_content with all JSONB sections
INSERT INTO website_content (
  law_firm_id,
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
  section_order,
  hidden_sections,
  is_published,
  published_at
)
SELECT
  id,
  -- theme
  '{"color_bg":"#FAF8F5","color_ink":"#1A1A2E","color_accent":"#B8860B","color_accent_light":"#D4A843","color_mist":"#E8E4DF","color_stone":"#6B6B7B","color_charcoal":"#2D2D3F","font_serif":"Georgia","font_sans":"system-ui"}'::jsonb,
  -- topbar
  '{"text":"Atuação exclusiva para empresas (gestão/empregador). Conteúdo informativo.","enabled":true}'::jsonb,
  -- header
  '{"firm_name":"D''Avila Reis","firm_suffix":"Advogados","nav_links":[{"href":"/atuacao","label":"Atuação"},{"href":"/conteudos","label":"Conteúdos"},{"href":"/equipe","label":"Equipe"},{"href":"/sobre","label":"Sobre"},{"href":"/contato","label":"Contato"}],"cta_text":"Agendar reunião inicial","cta_secondary_text":"Portal do Cliente","cta_secondary_href":"/login"}'::jsonb,
  -- hero
  '{"headline_lines":["Protegemos Seu","Negócio."],"headline_gold_lines":["Blindamos Seu","Patrimônio."],"subheadline":"Há mais de 20 anos atuamos na defesa de empresas em demandas trabalhistas (lado patronal), elaboração e revisão de contratos empresariais e cobrança e recuperação de crédito.","cta_primary_text":"Agendar reunião inicial","cta_primary_href":"/contato","cta_secondary_text":"Falar com a equipe","cta_secondary_href":"https://wa.me/551533844013?text=Olá%2C%20gostaria%20de%20agendar%20uma%20reunião.","cta_tertiary_text":"Portal do Cliente","cta_tertiary_href":"/login","microcopy":"Atendemos exclusivamente pessoas jurídicas (empresas).","stats":[{"number":"2.500+","label":"Processos Gerenciados"},{"number":"200+","label":"Empresas Protegidas"},{"number":"20","label":"Anos de Experiência"}]}'::jsonb,
  -- credentials
  '{"section_title":"Experiência e Registro","items":[{"icon":"Award","metric":"20+","label":"Anos de Experiência"},{"icon":"TrendingUp","metric":"2.500+","label":"Processos Gerenciados"},{"icon":"Shield","metric":"200+","label":"Empresas Atendidas"},{"icon":"Scale","metric":"OAB/SP","label":"Registro Ativo"}]}'::jsonb,
  -- practice_areas
  '{"section_title":"Áreas de Atuação","items":[{"icon":"Scale","title":"Direito Trabalhista Empresarial (Patronal)","description":"Defesa completa do empregador em reclamações trabalhistas. Audiências, recursos, execução. Estratégia para reduzir passivo e proteger patrimônio dos sócios."},{"icon":"Shield","title":"Consultoria Preventiva Trabalhista","description":"Auditorias trabalhistas, elaboração de políticas internas, treinamento de gestores e adequação de contratos para evitar ações judiciais."},{"icon":"FileText","title":"Contratos Empresariais","description":"Elaboração, revisão e negociação de contratos comerciais, de prestação de serviços, societários e de locação. Proteção jurídica para operações do dia a dia."},{"icon":"Gavel","title":"Cobrança e Recuperação de Crédito","description":"Cobrança extrajudicial e judicial de títulos, duplicatas e contratos inadimplidos. Execuções fiscais e ações monitórias com foco em resultado."}],"cta_text":"Ver detalhes da atuação","cta_href":"/atuacao"}'::jsonb,
  -- philosophy
  '{"quote":"A melhor defesa é a que acontece antes do ataque.","values":[{"number":"01","title":"Ética","description":"Atuação pautada pela integridade, transparência e respeito ao cliente e à profissão."},{"number":"02","title":"Excelência","description":"Profundidade técnica, atualização constante e dedicação máxima a cada caso."},{"number":"03","title":"Compromisso","description":"Cada cliente recebe atenção integral — tratamos seu caso como se fosse o único."}]}'::jsonb,
  -- methodology
  '{"section_title":"Método de trabalho","steps":[{"number":"01","title":"Triagem e direcionamento","description":"Você preenche o formulário de contato. Avaliamos a demanda e identificamos a área jurídica adequada."},{"number":"02","title":"Plano de ação","description":"Reunião inicial para entender o caso em profundidade. Apresentamos estratégia, prazos e honorários."},{"number":"03","title":"Execução e acompanhamento","description":"Equipe dedicada conduz o caso com relatórios periódicos. Você acompanha tudo pelo Portal do Cliente."}],"cta_text":"Solicitar triagem do caso","cta_href":"/contato"}'::jsonb,
  -- content_preview
  '{"section_title":"Alertas e guias práticos para empresas","articles":[{"title":"5 erros que aumentam o passivo trabalhista da sua empresa","excerpt":"Conheça as falhas mais comuns na gestão de pessoal que geram reclamações trabalhistas — e como corrigi-las antes que virem processo.","category":"Trabalhista"},{"title":"Cláusulas essenciais em contratos de prestação de serviços","excerpt":"Um contrato mal redigido pode custar caro. Veja quais cláusulas protegem sua empresa em disputas comerciais.","category":"Contratos"},{"title":"Como funciona a cobrança judicial de duplicatas","excerpt":"Entenda o passo a passo da execução de títulos e quando vale a pena acionar o judiciário para recuperar créditos.","category":"Cobrança"}],"newsletter":{"heading":"Receba alertas jurídicos no seu e-mail","placeholder":"seu@email.com.br","button_text":"Receber alertas","disclaimer":"Ao se inscrever, você concorda com nossa Política de Privacidade. Você pode cancelar a qualquer momento."},"show_articles":true,"newsletter_enabled":true,"cta_text":"Ver todos os conteúdos","cta_href":"/conteudos"}'::jsonb,
  -- coverage_region
  '{"title":"Interior de São Paulo","paragraphs":["Nosso escritório está sediado em Cerquilho/SP e atende empresas em todo o eixo Sorocaba — Campinas — Piracicaba, incluindo Tatuí, Tietê, Indaiatuba e cidades vizinhas.","Atuamos também em demandas em todo o Estado de São Paulo e, para casos específicos, em outros estados via correspondentes credenciados."],"cta_text":"Ver área de atuação","cta_href":"/area-de-atuacao"}'::jsonb,
  -- founders
  '{"section_title":"Quem Somos","members":[{"name":"Dr. Ruy D''Avila Reis","title":"Sócio Fundador","oab":"OAB/SP","bio":"Sócio fundador com mais de 20 anos de experiência na defesa de empresas em demandas trabalhistas. Especialista em blindagem patrimonial e estratégia processual para o empregador."},{"name":"Dra. Larissa D''Avila Reis","title":"Sócia Fundadora","oab":"OAB/SP · OAB/MG · OAB/PR · Ordem dos Advogados de Portugal","bio":"Sócia fundadora com inscrição ativa na OAB/SP, OAB/MG, OAB/PR e na Ordem dos Advogados de Portugal (OAP). Experiência em direito empresarial com dimensão transfronteiriça entre Brasil e Europa."}],"cta_text":"Conhecer a equipe","cta_href":"/equipe"}'::jsonb,
  -- cta_final
  '{"headline":"Você representa uma empresa e precisa de apoio jurídico?","subtitle":"Envie as informações essenciais para triagem.","cta_primary_text":"Solicitar contato (sou empresa)","cta_primary_href":"/contato","cta_secondary_text":"Portal do Cliente","cta_secondary_href":"/login","disclaimer":"Responderemos em até 24 horas úteis (triagem)."}'::jsonb,
  -- footer
  '{"firm_name":"D''Avila Reis","tagline":"Advocacia empresarial e trabalhista preventiva. Protegendo empresários há mais de 20 anos.","nav_links":[{"href":"/sobre","label":"Sobre o Escritório"},{"href":"/atuacao","label":"Áreas de Atuação"},{"href":"/conteudos","label":"Conteúdos"},{"href":"/contato","label":"Contato"},{"href":"/login","label":"Portal do Cliente"}],"contact_phone":"(15) 3384-4013","contact_email":"financeiro@davilareisadvogados.com.br","contact_address":"Av. Dr. Vinício Gagliardi, 675\nCentro, Cerquilho/SP","social_links":[{"platform":"linkedin","url":"#"}],"legal_links":[{"href":"/politica-de-privacidade","label":"Política de Privacidade"},{"href":"/cookies","label":"Cookies"},{"href":"/aviso-legal","label":"Aviso Legal"}],"copyright_text":"2026 D''Avila Reis Advogados. Todos os direitos reservados."}'::jsonb,
  -- contact_info
  '{"phone":"(15) 3384-4013","email":"recepcao@davilareisadvogados.com.br","address":"Av. Dr. Vinício Gagliardi, 675\nCentro, Cerquilho/SP","address_cep":"18520-091","hours":"Seg a Sex, 8h às 18h","whatsapp_number":"551533844013","whatsapp_message":"Olá, gostaria de agendar uma consultoria."}'::jsonb,
  -- seo
  '{"title":"D''Avila Reis Advogados — Advocacia Empresarial e Trabalhista","description":"Escritório especializado na defesa de empresas em demandas trabalhistas, contratos empresariais e cobrança de crédito. Mais de 20 anos de experiência."}'::jsonb,
  -- section_order
  '["topbar","header","hero","credentials","practice_areas","philosophy","methodology","content_preview","coverage_region","founders","cta_final","footer"]'::jsonb,
  -- hidden_sections
  '[]'::jsonb,
  -- is_published
  true,
  -- published_at
  now()
FROM law_firms
WHERE slug = 'davila-reis'
ON CONFLICT (law_firm_id) DO UPDATE SET
  theme = EXCLUDED.theme,
  topbar = EXCLUDED.topbar,
  header = EXCLUDED.header,
  hero = EXCLUDED.hero,
  credentials = EXCLUDED.credentials,
  practice_areas = EXCLUDED.practice_areas,
  philosophy = EXCLUDED.philosophy,
  methodology = EXCLUDED.methodology,
  content_preview = EXCLUDED.content_preview,
  coverage_region = EXCLUDED.coverage_region,
  founders = EXCLUDED.founders,
  cta_final = EXCLUDED.cta_final,
  footer = EXCLUDED.footer,
  contact_info = EXCLUDED.contact_info,
  seo = EXCLUDED.seo,
  section_order = EXCLUDED.section_order,
  hidden_sections = EXCLUDED.hidden_sections,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = now();
