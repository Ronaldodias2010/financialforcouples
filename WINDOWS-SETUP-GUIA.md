# 🪟 Guia Completo de Setup GCP para Windows

Este guia é específico para usuários **Windows** que querem configurar o projeto Couples Financials no Google Cloud Platform.

---

## 📋 Pré-requisitos para Windows

### 1. Instalar Git para Windows (OBRIGATÓRIO)
```
1. Acesse: https://git-scm.com/download/win
2. Baixe o instalador (64-bit)
3. Execute o instalador
4. Aceite todas as configurações padrão
5. IMPORTANTE: Certifique-se que "Git Bash Here" está marcado
```

**Verificar instalação:**
```bash
# Abrir Git Bash e executar:
git --version
# Deve mostrar algo como: git version 2.x.x
```

### 2. Instalar Google Cloud SDK para Windows
```
1. Acesse: https://cloud.google.com/sdk/docs/install#windows
2. Baixe o instalador: GoogleCloudSDKInstaller.exe
3. Execute o instalador
4. Marque "Run 'gcloud init'" no final da instalação
5. Faça login quando solicitado
```

**Verificar instalação:**
```bash
# No Git Bash:
gcloud --version
# Deve mostrar a versão instalada
```

### 3. Instalar Docker Desktop (Opcional)
```
1. Acesse: https://docs.docker.com/desktop/install/windows-install/
2. Baixe Docker Desktop
3. Execute o instalador
4. Reinicie o computador quando pedido
```

---

## 🚀 Passo a Passo - Execução no Windows

### PASSO 1: Baixar o Projeto do GitHub

#### 1.1. Obter a URL do repositório
- Acesse seu repositório no GitHub
- Clique no botão verde **"Code"**
- Copie a URL HTTPS (exemplo: `https://github.com/seu-usuario/couples-financials.git`)

#### 1.2. Clonar o projeto
```bash
# Abrir Git Bash em qualquer lugar
# (Clique direito na área de trabalho > Git Bash Here)

# Ir para a pasta Documentos
cd ~/Documents

# Clonar o repositório (substitua pela SUA URL)
git clone https://github.com/seu-usuario/couples-financials.git

# Entrar na pasta do projeto
cd couples-financials
```

---

### PASSO 2: Executar o Script de Setup GCP

#### 2.1. Abrir Git Bash na pasta do projeto
```
1. Abrir Explorador de Arquivos
2. Navegar até: C:\Users\SeuUsuario\Documents\couples-financials
3. Clicar com botão direito dentro da pasta (espaço vazio)
4. Selecionar "Git Bash Here"
```

#### 2.2. Executar o script
```bash
./scripts/setup-gcp.sh
```

#### 2.3. Durante a execução

O script vai:

1. **Pedir login no Google Cloud**
   - Uma janela do navegador vai abrir
   - Faça login com sua conta Google
   - Autorize o acesso

2. **Configurar o projeto automaticamente**
   - Projeto: `couplesfinancials`
   - Não precisa digitar nada aqui

3. **Verificar billing**
   - Se não estiver ativado, você verá um link
   - Acesse o link e ative o billing

4. **Habilitar APIs** (automático)
   - Cloud Run
   - Artifact Registry
   - Secret Manager
   - E outras...

5. **Criar Artifact Registry** (automático)

6. **Criar Service Account** (automático)

7. **Gerar arquivo gcp-key.json** (automático)
   - Este arquivo será criado na pasta do projeto

8. **Pedir chaves do Supabase**
   ```
   Acesse: https://supabase.com/dashboard/project/elxttabdtddlavhseipz/settings/api
   
   Copie e cole quando pedido:
   - SUPABASE_ANON_KEY (chave pública)
   - SUPABASE_SERVICE_ROLE_KEY (chave secreta)
   ```

---

### PASSO 3: Configurar GitHub Secrets

#### 3.1. Copiar conteúdo do gcp-key.json
```bash
# No Git Bash, execute:
cat gcp-key.json

# Ou abra o arquivo com Notepad:
notepad gcp-key.json
```

#### 3.2. Adicionar no GitHub

1. Acesse seu repositório no GitHub
2. Vá em: **Settings** > **Secrets and variables** > **Actions**
3. Clique em **"New repository secret"**
4. Adicione os seguintes secrets:

| Nome do Secret | Valor |
|----------------|-------|
| `GCP_PROJECT_ID` | `couplesfinancials` |
| `GCP_SERVICE_ACCOUNT_KEY` | Cole TODO o conteúdo do `gcp-key.json` |
| `SUPABASE_URL` | `https://elxttabdtddlavhseipz.supabase.co` |

---

## ✅ Verificação

### Verificar se tudo foi criado corretamente

```bash
# No Git Bash, executar um por um:

# 1. Verificar Artifact Registry
gcloud artifacts repositories list --location=us-central1

# 2. Verificar Service Account
gcloud iam service-accounts list

# 3. Verificar Secrets
gcloud secrets list

# 4. Verificar APIs habilitadas
gcloud services list --enabled
```

---

## 🔧 Solução de Problemas (Windows)

### "bash: ./scripts/setup-gcp.sh: Permission denied"

**No Windows com Git Bash, isso raramente acontece, mas se acontecer:**
```bash
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

### "gcloud: command not found"

**Solução:**
1. Reinstale o Google Cloud SDK: https://cloud.google.com/sdk/docs/install#windows
2. Feche e abra o Git Bash novamente
3. Execute: `gcloud --version`

### "git: command not found"

**Solução:**
1. Instale Git para Windows: https://git-scm.com/download/win
2. Feche e abra o Git Bash novamente
3. Execute: `git --version`

### Erro de Billing

**Se aparecer erro sobre billing:**
```
1. Acesse: https://console.cloud.google.com/billing/linkedaccount?project=couplesfinancials
2. Associe uma conta de cobrança (pode usar período gratuito)
3. Execute o script novamente
```

### Git Bash não aparece no menu de contexto

**Solução:**
1. Reinstale o Git
2. Durante a instalação, certifique-se de marcar: "Git Bash Here"
3. Ou execute manualmente:
   - Abra Git Bash do menu Iniciar
   - Use `cd` para navegar até a pasta

```bash
# Exemplo:
cd /c/Users/SeuUsuario/Documents/couples-financials
```

---

## 🎯 Próximos Passos

Depois de concluir este setup:

1. ✅ Verificar que `gcp-key.json` foi gerado
2. ✅ Configurar GitHub Secrets (veja PASSO 3 acima)
3. ⏭️ Configurar Terraform (próximo passo)
4. ⏭️ Fazer deploy da aplicação

---

## 💡 Dicas para Windows

### Comandos úteis no Git Bash

```bash
# Ver onde você está
pwd

# Listar arquivos
ls -la

# Navegar para pasta
cd nome-da-pasta

# Voltar uma pasta
cd ..

# Abrir arquivo no Notepad
notepad arquivo.txt

# Ver conteúdo de arquivo
cat arquivo.txt
```

### Caminhos no Windows vs Git Bash

```bash
# Windows Explorer mostra:
C:\Users\SeuUsuario\Documents\projeto

# No Git Bash você digita:
cd /c/Users/SeuUsuario/Documents/projeto

# Ou simplesmente use:
cd ~/Documents/projeto
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique que instalou todos os pré-requisitos
2. Certifique-se que está usando **Git Bash** (não CMD ou PowerShell)
3. Feche e abra o Git Bash depois de instalar qualquer ferramenta
4. Leia as mensagens de erro com atenção

**Me avise quando terminar este passo para continuarmos com o Terraform!** 🚀
