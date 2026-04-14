# 🔐 SEGURANÇA: Ação Urgente Necessária

## ⚠️ Problema Identificado

A chave de API do Firebase (`AIzaSyAU6I21qHfD-YS2i8PCu2nMJxMWgKC6Sj4`) estava **publicamente acessível** no repositório GitHub por estar hardcoded no arquivo `src/lib/firebase.ts`.

## ✅ O Que Foi Corrigido

1. **Removido chaves do código-fonte** - Arquivo `firebase.ts` agora usa variáveis de ambiente
2. **Criado `.env.local`** - Arquivo local com chaves (ignorado pelo Git)
3. **Criado `.env.example`** - Template de configuração para documentação
4. **Atualizado `.gitignore`** - Garante que `*.local` não será commitado

## 🚨 AÇÃO URGENTE NECESSÁRIA

### 1. Regenerar Chaves no Google Cloud (IMEDIATAMENTE)

Como a chave foi exposta publicamente no GitHub, você **DEVE** regenerar:

**No Google Cloud Console:**
1. Acesse: https://console.cloud.google.com/
2. Projeto: `ccbadmitba`
3. Menu → APIs e Serviços → Credenciais
4. Encontre a chave de API `AIzaSyAU6I21qHfD-YS2i8PCu2nMJxMWgKC6Sj4`
5. **Clique em "DELETAR"**
6. Crie uma **nova chave de API** (Criar credenciais → Chave de API)
7. Restrinja a chave (Application restrictions: Website)

### 2. Atualizar `.env.local` com a Nova Chave

```bash
# Substitua a chave antiga pela nova no arquivo:
.env.local
```

```env
VITE_FIREBASE_API_KEY=SUA_NOVA_CHAVE_AQUI
VITE_FIREBASE_AUTH_DOMAIN=ccbadmitba.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ccbadmitba
VITE_FIREBASE_STORAGE_BUCKET=ccbadmitba.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=60371542427
VITE_FIREBASE_APP_ID=1:60371542427:web:4fa20e76aaef21d538813e
VITE_FIREBASE_MEASUREMENT_ID=G-PHK2V24RF9
```

### 3. Git History

Como a chave foi commitada no histórico, você pode:

**Opção A: Usar BFG Repo-Cleaner (Recomendado)**
```bash
# Instale: https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files firebase.ts
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# ou mais específico:
git filter-repo --replace-text expressions.txt
```

**Opção B: git-filter-branch (Mais lento)**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/lib/firebase.ts" \
  --prune-empty --tag-name-filter cat -- --all
```

**Opção C: Aviso aos Colaboradores**
- Comunique a todos que façam clone novo
- Instruções em `SECURITY.md`

### 4. Monitoramento (Próximas 24-48 horas)

- Monitore seu Google Cloud por atividades suspeitas
- Verifique limites de API
- Ative alertas de consumo

## 📋 Setup Correto para Novos Desenvolvedores

```bash
# 1. Clone o repositório
git clone https://github.com/vmcsoftware/ccb-admin-suite.git

# 2. Copie o template
cp .env.example .env.local

# 3. Preencha .env.local com suas chaves:
# (peça para o lead do projeto inserir as chaves)

# 4. A app funcionará automaticamente com as variáveis de ambiente
npm run dev
```

## 📚 Referências

- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/learn-more#api-keys)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes.html)
- [Regenerate Google Cloud API Keys](https://cloud.google.com/docs/authentication/api-keys#creating_api_keys)

## ✨ Resumo de Mudanças de Segurança

| Arquivo | Mudança |
|---------|---------|
| `src/lib/firebase.ts` | Chaves → Variáveis de ambiente |
| `.env.local` | 🆕 Novo (ignorado pelo Git) |
| `.env.example` | 🆕 Template para documentação |
| `.gitignore` | ✅ Já ignora `*.local` |
| GitHub | ⚠️ Histórico contém chaves (limpar manualmente) |

---

**Status:** ✅ Código corrigido | ⚠️ Aguardando regeneração de chaves
