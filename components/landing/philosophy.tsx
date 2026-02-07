import ScrollReveal from '@/components/landing/scroll-reveal'

const values = [
  {
    number: '01',
    title: 'Etica',
    description:
      'Atuacao pautada pela integridade, transparencia e respeito ao cliente e a profissao.',
  },
  {
    number: '02',
    title: 'Excelencia',
    description:
      'Profundidade tecnica, atualizacao constante e dedicacao maxima a cada caso.',
  },
  {
    number: '03',
    title: 'Compromisso',
    description:
      'Cada cliente recebe atencao integral — tratamos seu caso como se fosse o unico.',
  },
]

export default function Philosophy() {
  return (
    <section className="py-24 bg-landing-ivory">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-20">
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif font-semibold text-landing-ink leading-snug italic">
              &ldquo;A melhor defesa e a que acontece antes do ataque.&rdquo;
            </blockquote>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mt-8" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <ScrollReveal key={value.number} delay={`${index * 150}ms`}>
              <div className="text-center md:text-left">
                <span className="text-4xl font-serif font-bold text-landing-gold mb-4 block">
                  {value.number}
                </span>
                <h3 className="text-xl font-serif font-semibold text-landing-ink mb-3">
                  {value.title}
                </h3>
                <p className="text-landing-stone leading-relaxed">
                  {value.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
