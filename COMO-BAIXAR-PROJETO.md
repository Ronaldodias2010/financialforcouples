# 📥 Como Baixar o Projeto na Sua Máquina

## Pré-requisitos

Você vai precisar ter instalado:
- **Git**: Para clonar o repositório
- **Terminal/Command Prompt**: Já vem instalado no seu sistema

---

## 🔍 Passo 1: Instalar Git (se ainda não tiver)

### Windows
1. Baixe em: https://git-scm.com/download/win
2. Execute o instalador
3. Aceite as configurações padrão

### macOS
```bash
# Instalar com Homebrew
brew install git

# Ou o macOS vai perguntar se quer instalar quando tentar usar o git
git --version
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install git
```

---

## 📂 Passo 2: Encontrar a URL do Seu Repositório GitHub

### Opção A: Via Lovable
1. No Lovable, clique no ícone do **GitHub** (canto superior)
2. Copie a URL do repositório (algo como: `https://github.com/seu-usuario/couples-financials.git`)

### Opção B: Via GitHub direto
1. Acesse: https://github.com
2. Entre na sua conta
3. Encontre o repositório do projeto (provavelmente chamado `couples-financials` ou similar)
4. Clique no botão verde **"Code"**
5. Copie a URL HTTPS (exemplo: `https://github.com/seu-usuario/couples-financials.git`)

---

## 💻 Passo 3: Clonar o Projeto

### Abrir Terminal

**Windows:**
- Pressione `Win + R`
- Digite `cmd` e Enter
- Ou procure por "Terminal" ou "Command Prompt"

**macOS:**
- Pressione `Cmd + Espaço`
- Digite `terminal` e Enter

**Linux:**
- Pressione `Ctrl + Alt + T`

### Escolher Onde Baixar

Navegue até a pasta onde quer baixar o projeto:

```bash
# Exemplo: ir para Documentos
cd ~/Documents

# Ou criar uma pasta para projetos
mkdir ~/Projects
cd ~/Projects
```

### Clonar o Repositório

```bash
# Substitua a URL pela URL do SEU repositório
git clone https://github.com/seu-usuario/couples-financials.git

# Exemplo real (SUBSTITUA pela sua URL):
git clone https://github.com/seuusuario/couplesfinancials.git
```

### Entrar na Pasta do Projeto

```bash
cd couples-financials
```

---

## ✅ Passo 4: Verificar os Arquivos

Confirme que baixou tudo corretamente:

```bash
# Listar arquivos
ls -la

# No Windows (cmd):
dir

# Você deve ver:
# - pasta scripts/
# - pasta terraform-gcp/
# - pasta src/
# - arquivos .md como GUIA-EXECUCAO-LOCAL.md
```

---

## 🚀 Passo 5: Executar o Script de Setup GCP

Agora sim, você pode executar o script!

### No macOS/Linux:

```bash
# Dar permissão de execução
chmod +x scripts/setup-gcp.sh

# Executar o script
./scripts/setup-gcp.sh
```

### No Windows:

O script é bash, então você tem 2 opções:

**Opção 1: Usar Git Bash (Recomendado - Mais Simples)**

Git Bash vem junto quando você instala o Git no Windows!

1. Abra o **Explorador de Arquivos** (Windows Explorer)
2. Navegue até a pasta do projeto (exemplo: `C:\Users\SeuUsuario\Documents\couples-financials`)
3. **Clique com botão direito** dentro da pasta (em um espaço vazio)
4. Selecione **"Git Bash Here"** no menu
5. Uma janela preta vai abrir (terminal Git Bash)
6. Execute o comando:
```bash
./scripts/setup-gcp.sh
```

**Opção 2: Usar WSL (Windows Subsystem for Linux)**

Para usuários mais avançados que querem um ambiente Linux completo:

```bash
# 1. Abrir PowerShell como Administrador
# (Clique direito no menu Iniciar > Windows PowerShell (Admin))

# 2. Instalar WSL
wsl --install

# 3. Reiniciar o computador quando pedido

# 4. Após reiniciar, abrir Ubuntu (vai aparecer no menu Iniciar)

# 5. Navegar até a pasta do projeto
cd /mnt/c/Users/SeuUsuario/Documents/couples-financials

# 6. Executar o script
./scripts/setup-gcp.sh
```

**⚠️ Recomendação: Use a Opção 1 (Git Bash) - é mais simples!**

---

## 📋 Resumo dos Comandos (Copiar e Colar)

### macOS/Linux - Sequência Completa:

```bash
# 1. Ir para pasta de projetos (ou escolha outra)
cd ~/Projects

# 2. Clonar repositório (SUBSTITUA pela sua URL)
git clone https://github.com/seu-usuario/couples-financials.git

# 3. Entrar na pasta
cd couples-financials

# 4. Verificar arquivos
ls -la

# 5. Dar permissão ao script
chmod +x scripts/setup-gcp.sh

# 6. Executar setup
./scripts/setup-gcp.sh
```

### Windows (Git Bash) - Sequência Completa:

```bash
# 1. Ir para pasta de projetos
cd ~/Documents

# 2. Clonar repositório (SUBSTITUA pela sua URL)
git clone https://github.com/seu-usuario/couples-financials.git

# 3. Entrar na pasta
cd couples-financials

# 4. Executar setup
./scripts/setup-gcp.sh
```

---

## 🔍 Como Encontrar a URL do Repositório

### Se não souber a URL exata:

1. **Via GitHub Web:**
   - Acesse https://github.com
   - Login
   - Clique no seu perfil (canto superior direito)
   - Clique em "Your repositories"
   - Encontre o projeto
   - Clique nele
   - Botão verde "Code" > Copie a URL HTTPS

2. **Via Lovable:**
   - No editor Lovable
   - Procure ícone do GitHub (geralmente no topo)
   - Deve mostrar o link do repositório

---

## ❓ Problemas Comuns

### "git: command not found"
- Instale o Git conforme Passo 1

### "Permission denied"
```bash
chmod +x scripts/setup-gcp.sh
```

### "fatal: could not read Username"
- Você precisa autenticar no GitHub
- Configure suas credenciais:
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### "Repository not found"
- Verifique se a URL está correta
- Confirme que tem acesso ao repositório no GitHub
- Se o repo for privado, pode precisar de token de acesso

---

## 🎯 Próximos Passos

Depois de executar `./scripts/setup-gcp.sh` com sucesso:

1. ✅ O script vai gerar o arquivo `gcp-key.json`
2. ✅ Copie o conteúdo desse arquivo
3. ✅ Configure os GitHub Secrets
4. ⏭️ Me avise para continuar com Terraform!

---

## 💡 Dica Extra

Se quiser editar o código localmente também:

```bash
# Instalar Node.js/Bun
# macOS:
brew install bun

# Instalar dependências
bun install

# Rodar localmente
bun run dev
```

Mas isso é opcional - para executar o script GCP, você só precisa do Git!
