import {
  Scale,
  Users,
  Receipt,
  Calendar,
  FileText,
  CheckSquare,
  BarChart3,
  Target,
  MessageCircle,
  Shield,
  Globe,
  Settings,
} from 'lucide-react'
import ScrollReveal from '@/components/landing/scroll-reveal'

const modules = [
  {
    icon: Scale,
    title: 'Processos',
    description: 'Gestao completa de processos judiciais com fluxo de trabalho.',
  },
  {
    icon: Users,
    title: 'Clientes',
    description: 'Cadastro de clientes PF/PJ com CPF/CNPJ e historico.',
  },
  {
    icon: Receipt,
    title: 'Faturamento',
    description: 'Faturas, controle de horas e dashboard financeiro.',
  },
  {
    icon: Calendar,
    title: 'Calendario',
    description: 'Agendamentos, prazos e eventos sincronizados.',
  },
  {
    icon: FileText,
    title: 'Documentos',
    description: 'Upload, versionamento e controle de acesso.',
  },
  {
    icon: CheckSquare,
    title: 'Tarefas',
    description: 'Gestao de tarefas com prioridade e atribuicao.',
  },
  {
    icon: BarChart3,
    title: 'Relatorios',
    description: 'Analytics avancados com exportacao PDF e Excel.',
  },
  {
    icon: Target,
    title: 'Pipeline',
    description: 'Pipeline de vendas com previsao de receita.',
  },
  {
    icon: MessageCircle,
    title: 'Mensagens',
    description: 'Chat interno com suporte a WhatsApp e email.',
  },
  {
    icon: Shield,
    title: 'Administracao',
    description: 'Painel admin com seguranca, logs e configuracoes.',
  },
  {
    icon: Globe,
    title: 'Portal',
    description: 'Portal de acesso para clientes e colaboradores.',
  },
  {
    icon: Settings,
    title: 'Configuracoes',
    description: 'Personalizacao completa do escritorio.',
  },
]

export default function SaasFeatures() {
  return (
    <section id="funcionalidades" className="bg-saas-bg py-24 relative">
      <div className="container mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-saas-heading mb-4 saas-accent-line mx-auto w-fit">
            Tudo que seu escritorio precisa
          </h2>
          <p className="text-saas-muted text-lg max-w-2xl mx-auto mt-8">
            12 modulos integrados para cobrir todas as areas da gestao juridica.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((mod, index) => (
            <ScrollReveal key={mod.title} delay={`${index * 50}ms`}>
              <div className="saas-glass saas-glow-border rounded-xl p-6 h-full">
                <mod.icon className="h-8 w-8 text-saas-violet-light mb-4" />
                <h3 className="text-base font-display font-semibold text-saas-heading mb-2">
                  {mod.title}
                </h3>
                <p className="text-sm text-saas-muted leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
