# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Unreleased]

### Added
- Suporte para roteamento completo com React Router v6
- Sistema de gerenciamento de estado com React Query
- Integração com Firebase para persistência de dados
- Componentes UI customizados com Shadcn/ui
- Sistema de notificações com Sonner
- Deploy automático para GitHub Pages

### Fixed
- Corrigido ESLint errors relacionados a interfaces vazias
- Resolvido erro de any type em useData.ts
- Corrigido erro de require em tailwind.config.ts
- Reorganizado CSS imports para seguir especificação
- Melhorada performance do build (7.45s → 6.85s)

### Changed
- Migrado de require para import ES6 em tailwind.config.ts
- Renovado README.md com instruções completas
- Adicionado guia de contribuição (CONTRIBUTING.md)
- Melhorado TypeScript strict mode

## [0.0.1] - 2026-02-16

### Initial Release
- ✨ Aplicação base com React + TypeScript + Vite
- 📱 Pages: Dashboard, Congregações, Ministério, Agenda, Reforços, Listas
- 🎨 UI Components: 50+ componentes Shadcn/ui
- 🔥 Integração Firebase
- 📋 Sistema de tipos TypeScript
- 🎯 Roteamento com React Router v6
- 📊 State management com React Query
- 🎨 Styling com Tailwind CSS
- ✅ ESLint e TypeScript configured
- 🧪 Vitest setup pronto para testes

---

## Tipos de Mudanças

- **Added**: Para novas funcionalidades.
- **Changed**: Para mudanças em funcionalidades existentes.
- **Deprecated**: Para funcionalidades que serão removidas em breve.
- **Removed**: Para funcionalidades removidas.
- **Fixed**: Para correções de bugs.
- **Security**: Em caso da descoberta de vulnerabilidades.

## Versioning

Este projeto segue [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis se APIs
- **MINOR**: Novas funcionalidades mantendo compatibilidade
- **PATCH**: Correções de bugs

Formato: `MAJOR.MINOR.PATCH`

Exemplo: `1.2.3`

## Como Reportar Mudanças

Ao fazer por Pull Request, descreva:

1. **Tipo de mudança** (Added, Fixed, Changed, etc)
2. **O que foi mudado** - descrição clara
3. **Por que** - motivo da mudança
4. **Como testar** - passos para validar
5. **Issues relacionadas** - linke issues (Closes #123)

---

**Última atualização:** Fevereiro 2026
