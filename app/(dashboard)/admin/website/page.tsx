'use client'

import { useState, useCallback } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import {
  useWebsiteContent,
  useUpdateWebsiteSection,
  usePublishWebsite,
  useCreateWebsiteContent,
  useUpdateLawFirmSlug,
} from '@/lib/queries/useWebsiteContent'
import { getDefaultWebsiteContent } from '@/lib/website/default-content'
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
import {
  Globe,
  Eye,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react'
import WebsiteImageUpload, { WebsiteMultiImageUpload } from '@/components/website/website-image-upload'

type TabKey =
  | 'geral'
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

const tabs: { key: TabKey; label: string }[] = [
  { key: 'geral', label: 'Geral' },
  { key: 'topbar', label: 'Topbar' },
  { key: 'header', label: 'Header' },
  { key: 'hero', label: 'Hero' },
  { key: 'credentials', label: 'Credenciais' },
  { key: 'practice_areas', label: 'Servicos' },
  { key: 'philosophy', label: 'Filosofia' },
  { key: 'methodology', label: 'Metodologia' },
  { key: 'content_preview', label: 'Conteudos' },
  { key: 'coverage_region', label: 'Regiao' },
  { key: 'founders', label: 'Equipe' },
  { key: 'cta_final', label: 'CTA' },
  { key: 'footer', label: 'Rodape' },
  { key: 'contact_info', label: 'Contato' },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminWebsitePage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const { data: lawFirm } = useLawFirm(effectiveLawFirmId ?? undefined)
  const { data: content, isLoading } = useWebsiteContent(effectiveLawFirmId ?? undefined)
  const updateSection = useUpdateWebsiteSection()
  const publishWebsite = usePublishWebsite()
  const createContent = useCreateWebsiteContent()
  const updateSlug = useUpdateLawFirmSlug()

  const [activeTab, setActiveTab] = useState<TabKey>('geral')
  const [saving, setSaving] = useState(false)

  const handleSaveSection = useCallback(
    async (section: string, data: Record<string, unknown>) => {
      if (!effectiveLawFirmId) return
      setSaving(true)
      try {
        await updateSection.mutateAsync({ lawFirmId: effectiveLawFirmId, section, data })
      } finally {
        setSaving(false)
      }
    },
    [effectiveLawFirmId, updateSection]
  )

  const handleCreate = async () => {
    if (!effectiveLawFirmId || !lawFirm) return
    const defaults = getDefaultWebsiteContent({
      name: lawFirm.name,
      phone: lawFirm.phone,
      email: lawFirm.email,
      address_street: lawFirm.address_street,
      address_city: lawFirm.address_city,
      address_state: lawFirm.address_state,
    })
    const slug = slugify(lawFirm.name)
    await createContent.mutateAsync({ lawFirmId: effectiveLawFirmId, content: defaults })
    await updateSlug.mutateAsync({ lawFirmId: effectiveLawFirmId, slug })
  }

  const handleTogglePublish = async () => {
    if (!effectiveLawFirmId) return
    await publishWebsite.mutateAsync({
      lawFirmId: effectiveLawFirmId,
      publish: !content?.is_published,
    })
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              Website do Escritorio
            </h1>
            <p className="mt-2 text-gray-600">
              Gerencie o site publico do seu escritorio
            </p>
          </div>
          {content && (
            <div className="flex items-center gap-3">
              {lawFirm?.slug && (
                <a
                  href={`/site/${lawFirm.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Visualizar
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button
                onClick={handleTogglePublish}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  content.is_published
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {content.is_published ? 'Despublicar' : 'Publicar Site'}
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : !content ? (
          <div className="text-center py-16">
            <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum site configurado</h2>
            <p className="text-gray-600 mb-6">
              Crie o site do seu escritorio com um template profissional
            </p>
            <button
              onClick={handleCreate}
              disabled={createContent.isPending}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createContent.isPending ? 'Criando...' : 'Criar Website'}
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex gap-1 min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {activeTab === 'geral' && (
                <GeralTab
                  content={content}
                  lawFirm={lawFirm}
                  slug={lawFirm?.slug || ''}
                  onSaveSlug={async (slug) => {
                    if (!effectiveLawFirmId) return
                    await updateSlug.mutateAsync({ lawFirmId: effectiveLawFirmId, slug })
                  }}
                  onSaveSeo={(data) => handleSaveSection('seo', data as Record<string, unknown>)}
                  onSaveOrder={(order) => handleSaveSection('section_order', order as unknown as Record<string, unknown>)}
                  onSaveHidden={(hidden) => handleSaveSection('hidden_sections', hidden as unknown as Record<string, unknown>)}
                  saving={saving}
                />
              )}
              {activeTab === 'topbar' && (
                <TopbarTab data={content.topbar} onSave={(d) => handleSaveSection('topbar', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'header' && (
                <HeaderTab data={content.header} onSave={(d) => handleSaveSection('header', d as Record<string, unknown>)} saving={saving} lawFirmId={effectiveLawFirmId || ''} />
              )}
              {activeTab === 'hero' && (
                <HeroTab data={content.hero} onSave={(d) => handleSaveSection('hero', d as Record<string, unknown>)} saving={saving} lawFirmId={effectiveLawFirmId || ''} />
              )}
              {activeTab === 'credentials' && (
                <CredentialsTab data={content.credentials} onSave={(d) => handleSaveSection('credentials', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'practice_areas' && (
                <PracticeAreasTab data={content.practice_areas} onSave={(d) => handleSaveSection('practice_areas', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'philosophy' && (
                <PhilosophyTab data={content.philosophy} onSave={(d) => handleSaveSection('philosophy', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'methodology' && (
                <MethodologyTab data={content.methodology} onSave={(d) => handleSaveSection('methodology', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'content_preview' && (
                <ContentPreviewTab data={content.content_preview} onSave={(d) => handleSaveSection('content_preview', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'coverage_region' && (
                <CoverageTab data={content.coverage_region} onSave={(d) => handleSaveSection('coverage_region', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'founders' && (
                <FoundersTab data={content.founders} onSave={(d) => handleSaveSection('founders', d as Record<string, unknown>)} saving={saving} lawFirmId={effectiveLawFirmId || ''} />
              )}
              {activeTab === 'cta_final' && (
                <CtaFinalTab data={content.cta_final} onSave={(d) => handleSaveSection('cta_final', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'footer' && (
                <FooterTab data={content.footer} onSave={(d) => handleSaveSection('footer', d as Record<string, unknown>)} saving={saving} />
              )}
              {activeTab === 'contact_info' && (
                <ContactInfoTab data={content.contact_info} onSave={(d) => handleSaveSection('contact_info', d as Record<string, unknown>)} saving={saving} />
              )}
            </div>
          </>
        )}
      </div>
    </AdminOnly>
  )
}

// ──────────────────────────────────────────
// Shared UI Helpers
// ──────────────────────────────────────────

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      <Save className="h-4 w-4" />
      {saving ? 'Salvando...' : 'Salvar'}
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
    />
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
    />
  )
}

// ──────────────────────────────────────────
// Tab Components
// ──────────────────────────────────────────

function GeralTab({
  content,
  lawFirm,
  slug,
  onSaveSlug,
  onSaveSeo,
  saving,
}: {
  content: { seo: WebsiteSeo; section_order: string[]; hidden_sections: string[]; is_published: boolean }
  lawFirm: { name: string } | undefined | null
  slug: string
  onSaveSlug: (slug: string) => Promise<void>
  onSaveSeo: (data: WebsiteSeo) => void
  onSaveOrder: (order: string[]) => void
  onSaveHidden: (hidden: string[]) => void
  saving: boolean
}) {
  const [localSlug, setLocalSlug] = useState(slug)
  const [seo, setSeo] = useState<WebsiteSeo>(content.seo || { title: '', description: '' })

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">URL do Site</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">/site/</span>
          <TextInput
            value={localSlug}
            onChange={(v) => setLocalSlug(slugify(v))}
            placeholder="meu-escritorio"
          />
          <button
            onClick={() => onSaveSlug(localSlug)}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Salvar URL
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO</h3>
        <div className="space-y-4">
          <div>
            <FieldLabel>Titulo da Pagina</FieldLabel>
            <TextInput
              value={seo.title}
              onChange={(v) => setSeo({ ...seo, title: v })}
              placeholder="Titulo para o Google"
            />
          </div>
          <div>
            <FieldLabel>Descricao</FieldLabel>
            <TextArea
              value={seo.description}
              onChange={(v) => setSeo({ ...seo, description: v })}
              placeholder="Descricao para o Google"
            />
          </div>
          <div>
            <FieldLabel>URL da Imagem OG</FieldLabel>
            <TextInput
              value={seo.og_image_url || ''}
              onChange={(v) => setSeo({ ...seo, og_image_url: v })}
              placeholder="https://..."
            />
          </div>
          <SaveButton saving={saving} onClick={() => onSaveSeo(seo)} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
        <p className="text-sm text-gray-600">
          {content.is_published ? (
            <span className="text-green-600 font-medium">Publicado</span>
          ) : (
            <span className="text-amber-600 font-medium">Rascunho</span>
          )}
        </p>
      </div>
    </div>
  )
}

function TopbarTab({ data, onSave, saving }: { data: WebsiteTopbar; onSave: (d: WebsiteTopbar) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteTopbar>(data || { text: '', enabled: true })
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={local.enabled}
          onChange={(e) => setLocal({ ...local, enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm font-medium text-gray-700">Exibir topbar</span>
      </div>
      <div>
        <FieldLabel>Texto da Topbar</FieldLabel>
        <TextInput value={local.text} onChange={(v) => setLocal({ ...local, text: v })} />
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function HeaderTab({ data, onSave, saving, lawFirmId }: { data: WebsiteHeader; onSave: (d: WebsiteHeader) => void; saving: boolean; lawFirmId: string }) {
  const [local, setLocal] = useState<WebsiteHeader>(
    data || { firm_name: '', firm_suffix: '', nav_links: [], cta_text: '', cta_secondary_text: '', cta_secondary_href: '' }
  )
  return (
    <div className="space-y-4">
      <div>
        <WebsiteImageUpload
          lawFirmId={lawFirmId}
          value={local.logo_url || ''}
          onChange={(url) => setLocal({ ...local, logo_url: url })}
          folder="logo"
          label="Logo do Escritorio"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Nome do Escritorio</FieldLabel>
          <TextInput value={local.firm_name} onChange={(v) => setLocal({ ...local, firm_name: v })} />
        </div>
        <div>
          <FieldLabel>Sufixo</FieldLabel>
          <TextInput value={local.firm_suffix} onChange={(v) => setLocal({ ...local, firm_suffix: v })} placeholder="Advogados" />
        </div>
      </div>
      <div>
        <FieldLabel>Texto do CTA</FieldLabel>
        <TextInput value={local.cta_text} onChange={(v) => setLocal({ ...local, cta_text: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>CTA Secundario</FieldLabel>
          <TextInput value={local.cta_secondary_text} onChange={(v) => setLocal({ ...local, cta_secondary_text: v })} />
        </div>
        <div>
          <FieldLabel>Link CTA Secundario</FieldLabel>
          <TextInput value={local.cta_secondary_href} onChange={(v) => setLocal({ ...local, cta_secondary_href: v })} />
        </div>
      </div>
      <div>
        <FieldLabel>Links de Navegacao</FieldLabel>
        {local.nav_links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <TextInput
              value={link.label}
              onChange={(v) => {
                const updated = [...local.nav_links]
                updated[i] = { ...updated[i], label: v }
                setLocal({ ...local, nav_links: updated })
              }}
              placeholder="Label"
            />
            <TextInput
              value={link.href}
              onChange={(v) => {
                const updated = [...local.nav_links]
                updated[i] = { ...updated[i], href: v }
                setLocal({ ...local, nav_links: updated })
              }}
              placeholder="/pagina"
            />
            <button onClick={() => setLocal({ ...local, nav_links: local.nav_links.filter((_, j) => j !== i) })} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setLocal({ ...local, nav_links: [...local.nav_links, { label: '', href: '' }] })}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Adicionar link
        </button>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function HeroTab({ data, onSave, saving, lawFirmId }: { data: WebsiteHero; onSave: (d: WebsiteHero) => void; saving: boolean; lawFirmId: string }) {
  const [local, setLocal] = useState<WebsiteHero>(
    data || { headline_lines: [], headline_gold_lines: [], subheadline: '', cta_primary_text: '', cta_primary_href: '', cta_secondary_text: '', cta_secondary_href: '', cta_tertiary_text: '', cta_tertiary_href: '', microcopy: '', stats: [] }
  )
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Linhas do titulo (brancas)</FieldLabel>
        <TextArea
          value={local.headline_lines.join('\n')}
          onChange={(v) => setLocal({ ...local, headline_lines: v.split('\n') })}
          placeholder="Uma linha por titulo"
        />
      </div>
      <div>
        <FieldLabel>Linhas do titulo (douradas)</FieldLabel>
        <TextArea
          value={local.headline_gold_lines.join('\n')}
          onChange={(v) => setLocal({ ...local, headline_gold_lines: v.split('\n') })}
          placeholder="Uma linha por titulo"
        />
      </div>
      <div>
        <FieldLabel>Subtitulo</FieldLabel>
        <TextArea value={local.subheadline} onChange={(v) => setLocal({ ...local, subheadline: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>CTA Primario</FieldLabel>
          <TextInput value={local.cta_primary_text} onChange={(v) => setLocal({ ...local, cta_primary_text: v })} />
        </div>
        <div>
          <FieldLabel>Link CTA Primario</FieldLabel>
          <TextInput value={local.cta_primary_href} onChange={(v) => setLocal({ ...local, cta_primary_href: v })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>CTA Secundario</FieldLabel>
          <TextInput value={local.cta_secondary_text} onChange={(v) => setLocal({ ...local, cta_secondary_text: v })} />
        </div>
        <div>
          <FieldLabel>Link CTA Secundario</FieldLabel>
          <TextInput value={local.cta_secondary_href} onChange={(v) => setLocal({ ...local, cta_secondary_href: v })} />
        </div>
      </div>
      <div>
        <FieldLabel>Microcopy</FieldLabel>
        <TextInput value={local.microcopy} onChange={(v) => setLocal({ ...local, microcopy: v })} />
      </div>
      <div>
        <WebsiteMultiImageUpload
          lawFirmId={lawFirmId}
          values={local.office_images || []}
          onChange={(urls) => setLocal({ ...local, office_images: urls })}
          folder="office"
          label="Fotos do Escritorio (ate 3)"
          max={3}
        />
      </div>
      <div>
        <FieldLabel>Estatisticas</FieldLabel>
        {local.stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <TextInput
              value={stat.number}
              onChange={(v) => {
                const updated = [...local.stats]
                updated[i] = { ...updated[i], number: v }
                setLocal({ ...local, stats: updated })
              }}
              placeholder="2.500+"
            />
            <TextInput
              value={stat.label}
              onChange={(v) => {
                const updated = [...local.stats]
                updated[i] = { ...updated[i], label: v }
                setLocal({ ...local, stats: updated })
              }}
              placeholder="Processos Gerenciados"
            />
            <button onClick={() => setLocal({ ...local, stats: local.stats.filter((_, j) => j !== i) })} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setLocal({ ...local, stats: [...local.stats, { number: '', label: '' }] })}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Adicionar estatistica
        </button>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function CredentialsTab({ data, onSave, saving }: { data: WebsiteCredentials; onSave: (d: WebsiteCredentials) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteCredentials>(data || { section_title: '', items: [] })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Titulo da Secao</FieldLabel>
        <TextInput value={local.section_title} onChange={(v) => setLocal({ ...local, section_title: v })} />
      </div>
      <div>
        <FieldLabel>Itens</FieldLabel>
        {local.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <TextInput
              value={item.icon}
              onChange={(v) => {
                const updated = [...local.items]
                updated[i] = { ...updated[i], icon: v }
                setLocal({ ...local, items: updated })
              }}
              placeholder="Icone"
            />
            <TextInput
              value={item.metric}
              onChange={(v) => {
                const updated = [...local.items]
                updated[i] = { ...updated[i], metric: v }
                setLocal({ ...local, items: updated })
              }}
              placeholder="20+"
            />
            <TextInput
              value={item.label}
              onChange={(v) => {
                const updated = [...local.items]
                updated[i] = { ...updated[i], label: v }
                setLocal({ ...local, items: updated })
              }}
              placeholder="Label"
            />
            <button onClick={() => setLocal({ ...local, items: local.items.filter((_, j) => j !== i) })} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setLocal({ ...local, items: [...local.items, { icon: 'Shield', metric: '', label: '' }] })}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Adicionar item
        </button>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function PracticeAreasTab({ data, onSave, saving }: { data: WebsitePracticeAreas; onSave: (d: WebsitePracticeAreas) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsitePracticeAreas>(data || { section_title: '', items: [], cta_text: '', cta_href: '' })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Titulo da Secao</FieldLabel>
        <TextInput value={local.section_title} onChange={(v) => setLocal({ ...local, section_title: v })} />
      </div>
      <div>
        <FieldLabel>Areas de Atuacao</FieldLabel>
        {local.items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <TextInput value={item.icon} onChange={(v) => { const u = [...local.items]; u[i] = { ...u[i], icon: v }; setLocal({ ...local, items: u }) }} placeholder="Icone" />
              <TextInput value={item.title} onChange={(v) => { const u = [...local.items]; u[i] = { ...u[i], title: v }; setLocal({ ...local, items: u }) }} placeholder="Titulo" />
              <button onClick={() => setLocal({ ...local, items: local.items.filter((_, j) => j !== i) })} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <TextArea value={item.description} onChange={(v) => { const u = [...local.items]; u[i] = { ...u[i], description: v }; setLocal({ ...local, items: u }) }} placeholder="Descricao" />
          </div>
        ))}
        <button
          onClick={() => setLocal({ ...local, items: [...local.items, { icon: 'Scale', title: '', description: '' }] })}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Adicionar area
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Texto do CTA</FieldLabel>
          <TextInput value={local.cta_text} onChange={(v) => setLocal({ ...local, cta_text: v })} />
        </div>
        <div>
          <FieldLabel>Link do CTA</FieldLabel>
          <TextInput value={local.cta_href} onChange={(v) => setLocal({ ...local, cta_href: v })} />
        </div>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function PhilosophyTab({ data, onSave, saving }: { data: WebsitePhilosophy; onSave: (d: WebsitePhilosophy) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsitePhilosophy>(data || { quote: '', values: [] })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Citacao</FieldLabel>
        <TextArea value={local.quote} onChange={(v) => setLocal({ ...local, quote: v })} />
      </div>
      <div>
        <FieldLabel>Valores</FieldLabel>
        {local.values.map((value, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <TextInput value={value.number} onChange={(v) => { const u = [...local.values]; u[i] = { ...u[i], number: v }; setLocal({ ...local, values: u }) }} placeholder="01" />
              <TextInput value={value.title} onChange={(v) => { const u = [...local.values]; u[i] = { ...u[i], title: v }; setLocal({ ...local, values: u }) }} placeholder="Titulo" />
              <button onClick={() => setLocal({ ...local, values: local.values.filter((_, j) => j !== i) })} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <TextArea value={value.description} onChange={(v) => { const u = [...local.values]; u[i] = { ...u[i], description: v }; setLocal({ ...local, values: u }) }} placeholder="Descricao" />
          </div>
        ))}
        <button
          onClick={() => setLocal({ ...local, values: [...local.values, { number: String(local.values.length + 1).padStart(2, '0'), title: '', description: '' }] })}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Adicionar valor
        </button>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function MethodologyTab({ data, onSave, saving }: { data: WebsiteMethodology; onSave: (d: WebsiteMethodology) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteMethodology>(data || { section_title: '', steps: [], cta_text: '', cta_href: '' })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Titulo da Secao</FieldLabel>
        <TextInput value={local.section_title} onChange={(v) => setLocal({ ...local, section_title: v })} />
      </div>
      <div>
        <FieldLabel>Etapas</FieldLabel>
        {local.steps.map((step, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <TextInput value={step.number} onChange={(v) => { const u = [...local.steps]; u[i] = { ...u[i], number: v }; setLocal({ ...local, steps: u }) }} placeholder="01" />
              <TextInput value={step.title} onChange={(v) => { const u = [...local.steps]; u[i] = { ...u[i], title: v }; setLocal({ ...local, steps: u }) }} placeholder="Titulo" />
              <button onClick={() => setLocal({ ...local, steps: local.steps.filter((_, j) => j !== i) })} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <TextArea value={step.description} onChange={(v) => { const u = [...local.steps]; u[i] = { ...u[i], description: v }; setLocal({ ...local, steps: u }) }} placeholder="Descricao" />
          </div>
        ))}
        <button
          onClick={() => setLocal({ ...local, steps: [...local.steps, { number: String(local.steps.length + 1).padStart(2, '0'), title: '', description: '' }] })}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Adicionar etapa
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Texto do CTA</FieldLabel>
          <TextInput value={local.cta_text} onChange={(v) => setLocal({ ...local, cta_text: v })} />
        </div>
        <div>
          <FieldLabel>Link do CTA</FieldLabel>
          <TextInput value={local.cta_href} onChange={(v) => setLocal({ ...local, cta_href: v })} />
        </div>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function ContentPreviewTab({ data, onSave, saving }: { data: WebsiteContentPreview; onSave: (d: WebsiteContentPreview) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteContentPreview>(data || { section_title: '', articles: [], newsletter: { heading: '', placeholder: '', button_text: '', disclaimer: '' }, show_articles: true, newsletter_enabled: true, cta_text: '', cta_href: '' })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Titulo da Secao</FieldLabel>
        <TextInput value={local.section_title} onChange={(v) => setLocal({ ...local, section_title: v })} />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={local.show_articles} onChange={(e) => setLocal({ ...local, show_articles: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
          Exibir artigos
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={local.newsletter_enabled} onChange={(e) => setLocal({ ...local, newsletter_enabled: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
          Newsletter
        </label>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function CoverageTab({ data, onSave, saving }: { data: WebsiteCoverageRegion; onSave: (d: WebsiteCoverageRegion) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteCoverageRegion>(data || { title: '', paragraphs: [], cta_text: '', cta_href: '' })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Titulo</FieldLabel>
        <TextInput value={local.title} onChange={(v) => setLocal({ ...local, title: v })} />
      </div>
      <div>
        <FieldLabel>Paragrafos</FieldLabel>
        <TextArea
          value={local.paragraphs.join('\n\n')}
          onChange={(v) => setLocal({ ...local, paragraphs: v.split('\n\n').filter(Boolean) })}
          rows={6}
          placeholder="Separe paragrafos com uma linha em branco"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Texto do CTA</FieldLabel>
          <TextInput value={local.cta_text} onChange={(v) => setLocal({ ...local, cta_text: v })} />
        </div>
        <div>
          <FieldLabel>Link do CTA</FieldLabel>
          <TextInput value={local.cta_href} onChange={(v) => setLocal({ ...local, cta_href: v })} />
        </div>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function FoundersTab({ data, onSave, saving, lawFirmId }: { data: WebsiteFounders; onSave: (d: WebsiteFounders) => void; saving: boolean; lawFirmId: string }) {
  const [local, setLocal] = useState<WebsiteFounders>(data || { section_title: '', members: [], cta_text: '', cta_href: '' })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Titulo da Secao</FieldLabel>
        <TextInput value={local.section_title} onChange={(v) => setLocal({ ...local, section_title: v })} />
      </div>
      <div>
        <FieldLabel>Membros da Equipe</FieldLabel>
        {local.members.map((member, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <TextInput value={member.name} onChange={(v) => { const u = [...local.members]; u[i] = { ...u[i], name: v }; setLocal({ ...local, members: u }) }} placeholder="Nome" />
              <TextInput value={member.title} onChange={(v) => { const u = [...local.members]; u[i] = { ...u[i], title: v }; setLocal({ ...local, members: u }) }} placeholder="Cargo" />
              <button onClick={() => setLocal({ ...local, members: local.members.filter((_, j) => j !== i) })} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-2">
              <TextInput value={member.oab} onChange={(v) => { const u = [...local.members]; u[i] = { ...u[i], oab: v }; setLocal({ ...local, members: u }) }} placeholder="OAB/SP" />
            </div>
            <div className="mb-2">
              <WebsiteImageUpload
                lawFirmId={lawFirmId}
                value={member.photo_url || ''}
                onChange={(url) => { const u = [...local.members]; u[i] = { ...u[i], photo_url: url }; setLocal({ ...local, members: u }) }}
                folder="founders"
                label="Foto"
              />
            </div>
            <TextArea value={member.bio} onChange={(v) => { const u = [...local.members]; u[i] = { ...u[i], bio: v }; setLocal({ ...local, members: u }) }} placeholder="Biografia" />
          </div>
        ))}
        <button
          onClick={() => setLocal({ ...local, members: [...local.members, { name: '', title: '', oab: '', bio: '' }] })}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Adicionar membro
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Texto do CTA</FieldLabel>
          <TextInput value={local.cta_text} onChange={(v) => setLocal({ ...local, cta_text: v })} />
        </div>
        <div>
          <FieldLabel>Link do CTA</FieldLabel>
          <TextInput value={local.cta_href} onChange={(v) => setLocal({ ...local, cta_href: v })} />
        </div>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function CtaFinalTab({ data, onSave, saving }: { data: WebsiteCtaFinal; onSave: (d: WebsiteCtaFinal) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteCtaFinal>(data || { headline: '', subtitle: '', cta_primary_text: '', cta_primary_href: '', cta_secondary_text: '', cta_secondary_href: '', disclaimer: '' })
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Titulo</FieldLabel>
        <TextInput value={local.headline} onChange={(v) => setLocal({ ...local, headline: v })} />
      </div>
      <div>
        <FieldLabel>Subtitulo</FieldLabel>
        <TextInput value={local.subtitle} onChange={(v) => setLocal({ ...local, subtitle: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>CTA Primario</FieldLabel>
          <TextInput value={local.cta_primary_text} onChange={(v) => setLocal({ ...local, cta_primary_text: v })} />
        </div>
        <div>
          <FieldLabel>Link CTA Primario</FieldLabel>
          <TextInput value={local.cta_primary_href} onChange={(v) => setLocal({ ...local, cta_primary_href: v })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>CTA Secundario</FieldLabel>
          <TextInput value={local.cta_secondary_text} onChange={(v) => setLocal({ ...local, cta_secondary_text: v })} />
        </div>
        <div>
          <FieldLabel>Link CTA Secundario</FieldLabel>
          <TextInput value={local.cta_secondary_href} onChange={(v) => setLocal({ ...local, cta_secondary_href: v })} />
        </div>
      </div>
      <div>
        <FieldLabel>Disclaimer</FieldLabel>
        <TextInput value={local.disclaimer} onChange={(v) => setLocal({ ...local, disclaimer: v })} />
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function FooterTab({ data, onSave, saving }: { data: WebsiteFooter; onSave: (d: WebsiteFooter) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteFooter>(
    data || { firm_name: '', tagline: '', nav_links: [], contact_phone: '', contact_email: '', contact_address: '', social_links: [], legal_links: [], copyright_text: '' }
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Nome do Escritorio</FieldLabel>
          <TextInput value={local.firm_name} onChange={(v) => setLocal({ ...local, firm_name: v })} />
        </div>
        <div>
          <FieldLabel>Texto de Copyright</FieldLabel>
          <TextInput value={local.copyright_text} onChange={(v) => setLocal({ ...local, copyright_text: v })} />
        </div>
      </div>
      <div>
        <FieldLabel>Tagline</FieldLabel>
        <TextArea value={local.tagline} onChange={(v) => setLocal({ ...local, tagline: v })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <FieldLabel>Telefone</FieldLabel>
          <TextInput value={local.contact_phone} onChange={(v) => setLocal({ ...local, contact_phone: v })} />
        </div>
        <div>
          <FieldLabel>E-mail</FieldLabel>
          <TextInput value={local.contact_email} onChange={(v) => setLocal({ ...local, contact_email: v })} />
        </div>
        <div>
          <FieldLabel>Endereco</FieldLabel>
          <TextInput value={local.contact_address} onChange={(v) => setLocal({ ...local, contact_address: v })} />
        </div>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}

function ContactInfoTab({ data, onSave, saving }: { data: WebsiteContactInfo; onSave: (d: WebsiteContactInfo) => void; saving: boolean }) {
  const [local, setLocal] = useState<WebsiteContactInfo>(
    data || { phone: '', email: '', address: '', address_cep: '', hours: '', whatsapp_number: '', whatsapp_message: '' }
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Telefone</FieldLabel>
          <TextInput value={local.phone} onChange={(v) => setLocal({ ...local, phone: v })} />
        </div>
        <div>
          <FieldLabel>E-mail</FieldLabel>
          <TextInput value={local.email} onChange={(v) => setLocal({ ...local, email: v })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Endereco</FieldLabel>
          <TextArea value={local.address} onChange={(v) => setLocal({ ...local, address: v })} />
        </div>
        <div>
          <FieldLabel>CEP</FieldLabel>
          <TextInput value={local.address_cep} onChange={(v) => setLocal({ ...local, address_cep: v })} />
        </div>
      </div>
      <div>
        <FieldLabel>Horario de Atendimento</FieldLabel>
        <TextInput value={local.hours} onChange={(v) => setLocal({ ...local, hours: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Numero WhatsApp (apenas digitos)</FieldLabel>
          <TextInput value={local.whatsapp_number} onChange={(v) => setLocal({ ...local, whatsapp_number: v })} placeholder="551533844013" />
        </div>
        <div>
          <FieldLabel>Mensagem WhatsApp</FieldLabel>
          <TextInput value={local.whatsapp_message} onChange={(v) => setLocal({ ...local, whatsapp_message: v })} />
        </div>
      </div>
      <SaveButton saving={saving} onClick={() => onSave(local)} />
    </div>
  )
}
