# Couples Miles - Extensão Chrome Segura

Extensão Chrome (Manifest V3) para sincronização segura de saldos de milhas com o Couples Financials.

## 🎯 Objetivo

Permitir que usuários sincronizem seus saldos de milhagem de forma segura, sem comprometer credenciais.

## 🔐 Princípios de Segurança

- ✅ Login acontece 100% no site oficial da companhia
- ✅ Extensão só extrai dados após clique manual do usuário
- ✅ Sem captura automática
- ✅ Sem automação de login
- ✅ Sem armazenamento de cookies
- ✅ Sem armazenamento de sessão
- ✅ JWT obrigatório para autenticação no backend
- ✅ Rate limit de 1 sincronização por programa a cada 6 horas

## 📦 Programas Suportados

- LATAM Pass (latam.com)
- Azul Fidelidade (tudoazul.com.br)
- Smiles (smiles.com.br)
- Livelo (livelo.com.br)

## 🏗️ Estrutura

```
couples-miles-extension/
├── manifest.json         # Configuração Manifest V3
├── background.js         # Service Worker
├── content.js           # Extração de saldo
├── selectors.js         # Seletores por programa
├── popup.html           # Interface do popup
├── popup.js             # Lógica do popup
├── styles.css           # Estilos
└── icons/               # Ícones
```

## 🚀 Deploy

### Pré-requisitos

1. Conta de desenvolvedor Chrome Web Store ($5 taxa única)
2. Acesso ao Supabase do Couples

### Passos

1. **Gerar Ícones PNG**
   ```bash
   # Converter SVGs para PNG (requer Inkscape ou similar)
   inkscape icons/icon16.svg -w 16 -h 16 -o icons/icon16.png
   inkscape icons/icon48.svg -w 48 -h 48 -o icons/icon48.png
   inkscape icons/icon128.svg -w 128 -h 128 -o icons/icon128.png
   ```

2. **Empacotar Extensão**
   ```bash
   # Criar ZIP para upload
   cd couples-miles-extension
   zip -r couples-miles-extension.zip . -x "*.svg" -x "README.md"
   ```

3. **Upload para Chrome Web Store**
   - Acesse https://chrome.google.com/webstore/devconsole
   - Clique em "New Item"
   - Faça upload do ZIP
   - Preencha informações obrigatórias
   - Submeta para revisão

## ✅ Checklist de Segurança

- [ ] Extensão não armazena senhas
- [ ] Extensão não intercepta formulários de login
- [ ] Extensão não envia cookies para servidor
- [ ] Comunicação usa HTTPS
- [ ] JWT é validado no backend
- [ ] Rate limiting implementado
- [ ] Consentimento LGPD exigido

## ⚖️ Checklist Jurídico (LGPD)

- [ ] Modal de consentimento implementado
- [ ] Descrição clara dos dados coletados
- [ ] Opção de revogação disponível
- [ ] Política de privacidade atualizada
- [ ] Data de consentimento registrada

## 🔄 Plano de Rollout

### Fase 1: Beta Interno (Semana 1-2)
- [ ] Testar com 10-20 usuários
- [ ] Coletar feedback
- [ ] Corrigir bugs

### Fase 2: Beta Público (Semana 3-4)
- [ ] Publicar como "unlisted" na Chrome Web Store
- [ ] Expandir para 100 usuários
- [ ] Monitorar métricas

### Fase 3: Lançamento (Semana 5+)
- [ ] Publicar na Chrome Web Store (público)
- [ ] Anunciar em newsletter
- [ ] Monitorar reviews

## 🐛 Manutenção

Os seletores DOM podem mudar quando os sites atualizam seus layouts.

Para atualizar, edite `selectors.js` com os novos seletores:

```javascript
latam_pass: {
  selectors: [
    // Adicione novos seletores aqui
    '.novo-seletor-latam'
  ]
}
```

## 📊 Métricas Coletadas

- Programa sincronizado
- Saldo (apenas número)
- Timestamp
- Versão da extensão
- Status (sucesso/erro)

**NÃO são coletados:**
- Senhas
- Cookies
- Tokens de sessão
- Dados pessoais além do necessário

## 🆘 Suporte

Em caso de problemas:
1. Verifique se está logado no site da companhia
2. Atualize a página
3. Tente sincronizar novamente
4. Contate suporte@couplesfinancials.com
