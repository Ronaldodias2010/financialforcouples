# 📦 Guia de Deploy - Couples Miles Extension

## 📥 Como Baixar a Pasta da Extensão

### Opção 1: Via GitHub (Recomendado)
1. No Lovable, clique em **"..." (menu)** → **"Export to GitHub"**
2. Clone o repositório: `git clone [SEU-REPO-URL]`
3. A pasta estará em: `couples-miles-extension/`

### Opção 2: Download Manual
Copie todos os arquivos listados abaixo:
```
couples-miles-extension/
├── manifest.json
├── background.js
├── content.js
├── selectors.js
├── popup.html
├── popup.js
├── styles.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── assets/
    ├── screenshot-popup.png
    ├── screenshot-dashboard.png
    └── promo-small.png
```

---

## ✅ Passo 1: Ícones PNG (COMPLETO)
Os ícones já foram gerados em `/icons/`:
- `icon16.png` - Toolbar
- `icon48.png` - Extensões page
- `icon128.png` - Chrome Web Store

---

## 🚀 Passo 2: Publicar na Chrome Web Store

### 2.1 Pré-requisitos
- [ ] Conta Google
- [ ] Taxa de desenvolvedor ($5 USD - única vez)
- [ ] Screenshots da extensão
- [ ] Ícone promocional (440x280 ou 1400x560)

### 2.2 Criar Conta de Desenvolvedor

1. Acesse: https://chrome.google.com/webstore/devconsole
2. Clique em "Register as a Chrome Web Store Developer"
3. Pague a taxa de $5 USD
4. Aceite os termos

### 2.3 Preparar o Pacote

```bash
# No diretório do projeto Couples
cd couples-miles-extension

# Criar ZIP (excluindo arquivos desnecessários)
zip -r couples-miles-v1.0.0.zip . \
  -x "*.svg" \
  -x "*.md" \
  -x ".DS_Store" \
  -x "__MACOSX/*"
```

**Ou manualmente:**
1. Selecione todos os arquivos da pasta `couples-miles-extension/`
2. Exclua: `*.svg`, `*.md`
3. Clique com botão direito → Compactar

### 2.4 Upload para Chrome Web Store

1. Acesse: https://chrome.google.com/webstore/devconsole
2. Clique em **"New Item"**
3. Faça upload do arquivo ZIP
4. Preencha as informações:

**Informações Obrigatórias:**

| Campo | Valor Sugerido |
|-------|----------------|
| Nome | Couples Miles - Sincronização Segura |
| Descrição Curta | Sincronize seus saldos de milhas de forma segura |
| Categoria | Produtividade |
| Idioma | Português (Brasil) |

**Descrição Completa:**
```
Couples Miles é uma extensão segura para sincronizar seus saldos de programas de milhagem com o aplicativo Couples Financials.

✈️ PROGRAMAS SUPORTADOS:
• LATAM Pass
• Azul Fidelidade  
• Smiles
• Livelo

🔐 SEGURANÇA EM PRIMEIRO LUGAR:
• Login acontece 100% no site oficial
• Nenhuma senha é armazenada
• Dados são transmitidos via HTTPS
• Sincronização manual (você controla)

📋 COMO FUNCIONA:
1. Instale a extensão
2. Faça login na sua conta Couples
3. Acesse o site da companhia aérea
4. Clique em "Sincronizar Milhas"

⚡ Seu saldo será atualizado automaticamente no dashboard do Couples!

💜 Desenvolvido pela equipe Couples Financials
Política de Privacidade: https://couplesfinancials.com/privacy
```

### 2.5 Configurações de Privacidade

**Permissões Justificativas:**

| Permissão | Justificativa |
|-----------|---------------|
| activeTab | Ler o saldo de milhas visível na aba atual |
| storage | Armazenar preferências e token de autenticação |
| host_permissions | Acessar sites de programas de milhagem (LATAM, Azul, etc.) |

**Práticas de Privacidade:**
- [ ] Marcar: "Esta extensão não coleta dados pessoais identificáveis"
- [ ] Link para política: https://couplesfinancials.com/privacy

### 2.6 Assets Visuais Necessários

| Asset | Tamanho | Uso |
|-------|---------|-----|
| Screenshot 1 | 1280x800 | Popup da extensão |
| Screenshot 2 | 1280x800 | Dashboard com saldo sincronizado |
| Ícone Promocional | 440x280 | Listagem na loja |
| Marquee (opcional) | 1400x560 | Destaque na loja |

### 2.7 Submeter para Revisão

1. Clique em **"Submit for Review"**
2. Tempo de revisão: 1-3 dias úteis
3. Acompanhe o status no Developer Dashboard

---

## 🧪 Passo 3: Testar com Usuários Beta

### 3.1 Publicação "Unlisted" (Recomendado)

Antes de publicar publicamente:
1. No Developer Console, escolha **"Visibility: Unlisted"**
2. Apenas usuários com o link direto poderão instalar
3. Compartilhe com beta testers selecionados

### 3.2 Selecionar Beta Testers

**Perfil ideal:**
- [ ] Usuários ativos do Couples
- [ ] Possuem contas em programas de milhagem
- [ ] Dispostos a dar feedback
- [ ] Mix de Chrome, Edge, Brave

**Quantidade sugerida:**
- Fase 1: 5-10 usuários (interno)
- Fase 2: 20-50 usuários (beta fechado)
- Fase 3: 100+ usuários (beta aberto)

### 3.3 Script de Onboarding para Beta Testers

```
Olá! 👋

Você foi selecionado para testar a nova extensão Couples Miles!

📥 INSTALAÇÃO:
1. Acesse: [LINK UNLISTED]
2. Clique em "Adicionar ao Chrome"
3. Faça login com sua conta Couples

🧪 O QUE TESTAR:
1. Fazer login na extensão
2. Acessar LATAM/Azul/Smiles/Livelo
3. Clicar em "Sincronizar Milhas"
4. Verificar se o saldo aparece no Couples

📝 FEEDBACK:
Responda este formulário após testar:
[LINK DO FORMULÁRIO]

Obrigado por ajudar! 💜
```

### 3.4 Formulário de Feedback

**Perguntas sugeridas:**

1. Qual navegador você usa? (Chrome/Edge/Brave/Outro)
2. Quais programas você testou? (LATAM/Azul/Smiles/Livelo)
3. A sincronização funcionou? (Sim/Não/Parcialmente)
4. O que poderia melhorar?
5. Encontrou algum erro? Descreva.
6. De 1-10, quão fácil foi usar?

### 3.5 Métricas a Monitorar

**No Supabase:**
```sql
-- Total de sincronizações por programa
SELECT program_code, COUNT(*) as total, 
       COUNT(DISTINCT user_id) as unique_users
FROM extension_sync_logs
GROUP BY program_code
ORDER BY total DESC;

-- Taxa de sucesso
SELECT sync_status, COUNT(*) as total
FROM extension_sync_logs
GROUP BY sync_status;

-- Erros mais comuns
SELECT error_message, COUNT(*) as occurrences
FROM extension_sync_logs
WHERE sync_status = 'error'
GROUP BY error_message
ORDER BY occurrences DESC;
```

### 3.6 Checklist de Beta

**Antes de lançar beta:**
- [ ] Extensão publicada como "Unlisted"
- [ ] Link de instalação testado
- [ ] Formulário de feedback criado
- [ ] 5+ beta testers confirmados
- [ ] Queries de monitoramento prontas

**Durante o beta:**
- [ ] Coletar feedback diariamente
- [ ] Monitorar logs de erro
- [ ] Responder dúvidas rapidamente
- [ ] Documentar bugs encontrados

**Após o beta:**
- [ ] Corrigir bugs críticos
- [ ] Atualizar seletores se necessário
- [ ] Preparar para lançamento público

---

## 🎉 Lançamento Público

Após beta bem-sucedido:

1. Altere visibilidade para **"Public"**
2. Anuncie em:
   - [ ] Newsletter Couples
   - [ ] Instagram/redes sociais
   - [ ] Banner no app
3. Monitore reviews na Chrome Web Store
4. Responda feedbacks

---

## 📞 Suporte

**Contato para usuários:**
- Email: suporte@couplesfinancials.com
- Chat no app Couples

**Para desenvolvedores:**
- Logs: https://supabase.com/dashboard/project/elxttabdtddlavhseipz/functions/extension-sync-miles/logs
