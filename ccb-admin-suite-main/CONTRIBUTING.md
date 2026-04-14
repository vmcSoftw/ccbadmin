# Guia de Contribuição - CCB Admin Suite

Obrigado por considerar contribuir para o **CCB Admin Suite**! Este documento fornece diretrizes e instruções para contribuir.

## 📋 Código de Conduta

Este projeto adota um Código de Conduta inclusivo para garantir um ambiente acolhedor para todos.

### Nossa Promessa

Nós nos comprometemos a prover um ambiente livre de assédio para todos, independente de idade, corpo, capacidade, etnia, identidade/expressão de gênero, nível de experiência, nacionalidade, aparência pessoal, raça, religião ou identidade sexual e orientação.

### Nossos Padrões

Exemplos de comportamento que contribuem para criar um ambiente positivo incluem:

- Usar linguagem acolhedora e inclusiva
- Ser respeitoso com pontos de vista e experiências diferentes
- Aceitar crítica construtiva com graça
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros da comunidade

## 🚀 Como Contribuir

### Reportar Bugs

Antes de criar relatórios de bugs, verifique a [lista de issues](https://github.com/vmcsoftware/ccb-admin-suite/issues) pois você pode descobrir que o bug já foi reportado.

Quando criar um relatório de bug, inclua:

- **Título descritivo**: use um título claro para identificar o problema
- **Descrição exata**: descreva os passos específicos para reproduzir o problema
- **Comportamento observado**: descreva o comportamento que você observou e indique qual é o problema
- **Comportamento esperado**: descreva qual era o comportamento esperado
- **Screenshots/Vídeos**: inclua se possível
- **Seu ambiente**: SO, versão do navegador, versão do Node.js, etc

### Sugerir Melhorias

Para sugerir melhorias, crie um issue com as seguintes informações:

- **Título descritivo**: resumo da sugestão
- **Descrição detalhada**: explique o resultado não esperado ou o comportamento que você sugeriu
- **Exemplos práticos**: forneça exemplos específicos para demonstrar os passos
- **Prints e animações**: inclua screen captures ou gifs animados se possível

### Pull Requests

Garanta que os PRs seguem este processo:

1. **Fork o repositório** e crie sua branch a partir de `main`
2. **Dê um nome significativo** à sua branch: `feature/nova-funcionalidade` ou `fix/corrigir-bug`
3. **Faça commits claros** com mensagens descritivas
4. **Respeite o style guide** do projeto (veja abaixo)
5. **Inclua testes** para funcionalidades novas ou correções
6. **Verifique o build**: `npm run build` deve passar sem erros
7. **Execute o lint**: `npm run lint` deve passar sem erros críticos
8. **Escreva uma descrição clara** do seu PR explicando as mudanças

## 🎨 Style Guide

### Git Commit Messages

- Use imperativo ("Add feature" não "Added feature")
- Limite a primeira linha a 72 caracteres
- Referência issues e pull requests liberalmente após a primeira linha
- Considere iniciar sua mensagem com um emoji:
  - 🎉 `:tada:` Novo release
  - ✨ `:sparkles:` Nova funcionalidade
  - 🐛 `:bug:` Correção de bug
  - 📝 `:memo:` Documentação
  - 🎨 `:art:` Melhoria de estrutura/formato
  - ⚡ `:zap:` Melhoria de performance
  - ✅ `:white_check_mark:` Testes
  - 🔧 `:wrench:` Configuração
  - 🚀 `:rocket:` Deployment

Exemplos:

```
✨ feat: adicionar listagem de congregações

- Implementa página de congregações
- Adiciona filtro por região
- Integra com Firebase

Closes #123
```

### TypeScript/JavaScript

Siga estes princípios:

```typescript
// ✅ Bom
const handleDatafetch = async (id: string): Promise<Congregacao> => {
  const data = await fetchCongregacao(id);
  return data;
};

// ❌ Ruim
const handleDatafetch = async (id) => {
  const data = await fetchCongregacao(id);
  return data;
};
```

- Use **tipos explícitos** (TypeScript)
- Prefira **const** sobre **let** ou **var**
- Use **arrow functions** para callbacks
- Mantenha funções pequenas e focadas
- Nomeie variáveis de forma descritiva

### React/JSX

```tsx
// ✅ Bom
const CongregacaoCard: React.FC<CongregacaoCardProps> = ({ congregacao }) => {
  return (
    <div className="card">
      <h2>{congregacao.nome}</h2>
      <p>{congregacao.endereco}</p>
    </div>
  );
};

// ❌ Ruim
export const CongregacaoCard = (props: any) => {
  return (
    <div className="card">
      <h2>{props.congregacao.nome}</h2>
    </div>
  );
};
```

- Use componentes funcionais com hooks
- Defina tipos `Props` separadamente
- Mantenha componentes pequenos e reutilizáveis
- Use React.memo() para otimizar re-renders quando apropriado

### CSS/Tailwind

```tsx
// ✅ Bom
<div className="flex items-center gap-4 rounded-lg border border-gray-200 p-4">
  {/* conteúdo */}
</div>

// ❌ Ruim
<div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
  {/* conteúdo */}
</div>
```

- Use **Tailwind CSS** classes (não inline styles)
- Mantenha className bem organizado
- Use componentes Shadcn/ui quando disponível

## 📋 Processo de Review

1. Um membro do time irá revisar seu PR
2. Mudanças podem ser solicitadas
3. Uma vez aprovado, seu PR será mesclado
4. Sua contribuição aparecerá no próximo release!

## 🔍 Checklist para PRs

Antes de submeter seu PR, verifique:

- [ ] Seu branch está baseado em `main`
- [ ] Você adicionou testes para novas funcionalidades
- [ ] `npm run lint` passa sem erros críticos
- [ ] `npm run build` é executado com sucesso
- [ ] `npm run test` passa
- [ ] Você atualizou a documentação relevante
- [ ] Sua mensagem de commit é clara e descritiva
- [ ] Você não tem conflitos com `main`

## 📚 Recursos Úteis

- [Documentação React](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Vite Guide](https://vitejs.dev/guide/)

## ❓ Dúvidas?

Abra uma issue com a tag `question` ou entre em contato com os mantenedores.

## 🙏 Obrigado!

Sua contribuição é muito apreciada! 🎉

---

**Última atualização:** Fevereiro 2026
