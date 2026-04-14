# CCB Admin Suite

Sistema administrativo para gestão de congregações, ministérios e eventos da Igreja Cristã Brasileira (CCB).

## 📋 Sobre o Projeto

O **CCB Admin Suite** é uma plataforma web moderna para administradores de congregações da CCB, permitindo:

- ✅ Gestão de congregações locais
- ✅ Cadastro e administração de ministrados e ministérios
- ✅ Agenda e calendário de eventos, cultos e reuniões
- ✅ Listas de presença e reforços
- ✅ Interface responsiva e intuitiva
- ✅ Integração com Firebase para persistência de dados

## 🚀 Começando

### Pré-requisitos

- Node.js 16+ (instalar via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm ou yarn
- Conta Firebase (opcional, se desejar usar banco de dados)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/vmcsoftware/ccb-admin-suite.git
cd ccb-admin-suite

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env.local copiando o template
cp .env.example .env.local

# 4. Preencha .env.local com suas credenciais Firebase
# (Solicite ao lead do projeto ou use suas próprias credenciais)
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (use `.env.example` como template):

```env
VITE_FIREBASE_API_KEY=sua_chave_api_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=sua_measurement_id
```

⚠️ **Importante:** O arquivo `.env.local` é ignorado pelo Git (`.gitignore`), garantindo que suas credenciais nunca sejam expostas publicamente. Para mais detalhes sobre segurança, veja [SECURITY.md](./SECURITY.md).

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# A aplicação estará disponível em http://localhost:8080
```

Acesse `http://localhost:8080` no seu navegador. A página sera recarregada automaticamente quando você fizer alterações no código.

### Build para Produção

```bash
# Compile para produção
npm run build

# Visualize o build localmente
npm run preview
```

### Testes

```bash
# Execute os testes uma vez
npm run test

# Execute os testes em modo watch
npm run test:watch
```

### Linting

```bash
# Verifique erros e warnings de código
npm run lint
```

## 🏗️ Arquitetura

### Stack Tecnológico

- **Frontend:** React 18.3.1
- **Build Tool:** Vite 5.4.19
- **Linguagem:** TypeScript 5.8.3
- **Styling:** Tailwind CSS 3.4.17
- **UI Components:** Shadcn/ui
- **Roteamento:** React Router v6.30.1
- **State Management:** TanStack React Query 5.83.0
- **Formulários:** React Hook Form 7.61.1
- **Backend:** Firebase 12.9.0
- **Testes:** Vitest 3.2.4

### Estrutura de Pastas

```
src/
├── components/        # Componentes React reutilizáveis
│   ├── Layout.tsx     # Layout principal da aplicação
│   ├── NavLink.tsx    # Componentes de navegação
│   └── ui/            # Componentes Shadcn/ui (50+ componentes de UI)
├── pages/             # Páginas da aplicação
│   ├── Index.tsx      # Dashboard/Página inicial
│   ├── Congregacoes.tsx   # Gestão de congregações
│   ├── Ministerio.tsx     # Gestão de ministérios
│   ├── Agenda.tsx         # Calendário e eventos
│   ├── Reforcos.tsx       # Gestão de reforços
│   ├── Listas.tsx         # Listas gerais
│   └── NotFound.tsx       # Página 404
├── hooks/             # Custom React Hooks
│   ├── use-mobile.tsx # Detecção de modo mobile
│   ├── use-toast.ts   # Sistema de notificações
│   └── useData.ts     # Hooks para fetch de dados Firestore
├── lib/               # Funções e utilitários
│   ├── firebase.ts    # Configuração do Firebase
│   └── utils.ts       # Funções auxiliares (cn, etc)
├── types/             # Definições de tipos TypeScript
│   └── index.ts       # Interfaces (Congregacao, Membro, Evento, etc)
├── test/              # Testes automatizados
│   ├── setup.ts       # Configuração do Vitest
│   └── example.test.ts # Exemplo de teste
├── App.tsx            # Componente raiz da aplicação
├── main.tsx           # Ponto de entrada
└── index.css          # Estilos globais
```

## 📱 Funcionalidades

### Dashboard (Home)
- Visão geral da congração com estatísticas
- Próximos eventos e cultos

### Congregações
- Listar todas as congregações
- Adicionar nova congregação
- Editar informações
- Excluir congregação
- Informações: endereço, dias de culto, RJM, ensaios

### Ministério
- Cadastrar membros da congregação
- Atribuir tipo de ministério (Ancião, Diácono, Cooperador)
- Filtro por tipo de ministério
- Editar/Excluir membros

### Agenda
- Calendário interativo
- Registrar eventos (cultos, RJM, ensaios, reuniões)
- Visualizar próximos eventos
- Detalhes e descrição de eventos

### Reforços
- Registrar reforços de ministrados
- Listar reforços por data e tipo
- Adicionar observações

### Listas
- Listas dinâmicas de dados
- Busca e filtro
- Exportação de dados (preparado para CSV)

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=seu_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

**Nota:** O arquivo `.env.local` deve estar em `.gitignore` para não expor credenciais.

## 🧪 Testes

O projeto usa **Vitest** para testes unitários e **React Testing Library** para testes de componentes.

```bash
# Rodar todos os testes
npm run test

# Rodar em modo watch
npm run test:watch

# Gerar coverage
npm run test -- --coverage
```

## 🚢 Deploy

### Deploy Automático (GitHub Pages)

```bash
npm run deploy
```

Isso:
1. Faz build da aplicação
2. Deploy para GitHub Pages em `https://vmcsoftware.github.io/ccb-admin-suite/`

### Deploy Customizado

O arquivo `vite.config.ts` está configurado com `base: '/ccb-admin-suite/'` para deploy em subdomain. Ajuste conforme necessário.

## 📝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/AmazingFeature`
2. Commit suas mudanças: `git commit -m 'Add AmazingFeature'`
3. Push para a branch: `git push origin feature/AmazingFeature`
4. Abra um Pull Request

## 🐛 Bug Reports

Por favor, reporte bugs em [GitHub Issues](https://github.com/vmcsoftware/ccb-admin-suite/issues) incluindo:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs real
- Screenshots (se aplicável)
- Ambiente (OS, navegador, versão do Node)

## � Segurança

**⚠️ IMPORTANTE:** As credenciais do Firebase são carregadas via variáveis de ambiente (`.env.local`) que **nunca** devem ser commitadas ao repositório.

- Nunca faça commit de `.env.local`
- Sempre use `.env.example` como template
- Regenere chaves expostas imediatamente (veja [SECURITY.md](./SECURITY.md))
- Para produção, use variáveis de ambiente seguras (GitHub Secrets, Vercel Env, etc.)

Para maiores detalhes sobre práticas de segurança, veja [SECURITY.md](./SECURITY.md).

## �📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para dúvidas ou sugestões, abra uma issue ou envie um pull request.

## 🙏 Créditos

- Desenvolvido para a Comunidade da Igreja Cristã Brasileira
- UI Components por [Shadcn/ui](https://ui.shadcn.com/)
- Ícones por [Lucide React](https://lucide.dev/)
- Built with [Vite](https://vitejs.dev/) e [React](https://react.dev/)

---

**Última atualização:** Fevereiro 2026

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Build the project and deploy the contents of the `dist` folder to your static host (Netlify, Vercel, GitHub Pages, etc.).

## Can I connect a custom domain?

Yes — configure your hosting provider's domain settings (DNS) and point the domain to your chosen host. See your host's docs for details.
