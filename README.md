# Prima Facie - Sistema de Gestão para Escritórios de Advocacia

Prima Facie é uma plataforma SaaS moderna e intuitiva para gestão completa de escritórios de advocacia, oferecendo desde captação de clientes até faturamento e gestão documental.

## 🚀 Início Rápido

```bash
# Clone o repositório
git clone https://github.com/talktorobson/prima-facie.git
cd prima-facie

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Deploy**: Vercel
- **Gerenciamento de Estado**: Zustand
- **Requisições**: TanStack Query

## 📁 Estrutura do Projeto

```
prima-facie/
├── app/                    # App directory (Next.js 14)
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/       # Dashboard principal
│   └── portal/            # Portais cliente/staff
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI
│   ├── layout/           # Componentes de layout
│   └── features/         # Componentes de features
├── lib/                   # Utilitários e configurações
│   ├── supabase/         # Cliente Supabase
│   ├── utils/            # Funções utilitárias
│   └── hooks/            # Custom hooks
├── public/               # Assets estáticos
├── styles/               # Estilos globais
└── types/                # TypeScript types
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm test` - Executa os testes
- `npm run format` - Formata o código

## 🔐 Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais do projeto
4. Adicione as credenciais ao arquivo `.env.local`

## 📝 Roadmap

Veja o [roadmap completo](prima-facie-roadmap.md) para detalhes sobre as fases de desenvolvimento.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autor

**Robson Benevenuto D'Avila Reis**

---

Feito com ❤️ para escritórios de advocacia brasileiros