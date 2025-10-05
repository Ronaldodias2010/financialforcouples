# Como Desbloquear Permissões no GCP

## Problema
Você está recebendo este erro ao tentar acessar o projeto `couples-financials-446721`:

```
Permissões ausentes ou bloqueadas:
- resourcemanager.projects.get
- resourcemanager.projects.getIamPolicy
```

## Solução: Adicionar Permissões Necessárias

### Opção 1: Se VOCÊ criou o projeto (Mais provável)

Se você criou este projeto GCP, você já é o Owner, mas pode estar usando a conta errada.

**Verifique qual conta está logada:**

1. Vá para: https://console.cloud.google.com
2. No canto superior direito, clique no ícone do seu perfil
3. Verifique qual email está conectado

**Se for a conta errada:**
- Clique em "Adicionar conta" ou "Trocar conta"
- Faça login com a conta que criou o projeto GCP

### Opção 2: Se OUTRA PESSOA criou o projeto

Você precisa que essa pessoa adicione você como **Editor** ou **Owner** do projeto.

**Peça para essa pessoa fazer:**

1. Acessar: https://console.cloud.google.com/iam-admin/iam?project=couples-financials-446721

2. Clicar no botão **"CONCEDER ACESSO"** (ou "GRANT ACCESS")

3. Preencher:
   - **Principais novos**: Seu email do Google
   - **Função**: Selecionar **"Editor"** ou **"Owner"**
   
4. Clicar em **"Salvar"**

5. Aguardar 2-3 minutos para as permissões propagarem

### Opção 3: Usar o Cloud Shell (Se você é Owner)

Se você tem acesso ao Cloud Shell no projeto:

1. Abra o Cloud Shell: https://console.cloud.google.com/?cloudshell=true

2. Execute este comando (substitua SEU_EMAIL pelo seu email):

```bash
gcloud projects add-iam-policy-binding couples-financials-446721 \
    --member="user:SEU_EMAIL@gmail.com" \
    --role="roles/editor" projects add-iam-policy
```

## Quem Pode Conceder Essas Permissões?

Podem adicionar você ao projeto:
- ✅ A pessoa que criou o projeto GCP
- ✅ Quem configurou a conta de faturamento
- ✅ Qualquer usuário com papel "Owner" no projeto
- ✅ Administradores da organização (se for conta empresarial)

## Papéis e Suas Permissões

### Owner (Proprietário)
- Acesso total ao projeto
- Pode adicionar/remover outros usuários
- Pode excluir o projeto
- **Recomendado se você é o único desenvolvedor**

### Editor
- Pode modificar recursos
- Pode criar/deletar recursos
- NÃO pode gerenciar permissões de outros usuários
- **Recomendado para trabalho em equipe**

### Viewer (Visualizador)
- Apenas visualização
- NÃO pode fazer modificações
- **NÃO resolve seu problema**

## Verificar se Funcionou

Após receber as permissões:

1. Aguarde 2-3 minutos
2. Recarregue o console do GCP
3. Tente acessar novamente: https://console.cloud.google.com/iam-admin/iam?project=couples-financials-446721

Se conseguir ver a página de IAM, está funcionando! ✅

## Próximos Passos

Após ter as permissões corretas:

1. Retorne ao guia principal: `docs/TERRAFORM-FIX-GUIDE.md`
2. Siga os passos para habilitar as APIs e adicionar permissões
3. Re-execute o workflow do GitHub Actions

## Ainda com Problemas?

Se após seguir todos os passos você ainda não consegue acessar:

1. **Verifique se está no projeto correto**: 
   - O ID do projeto deve ser exatamente: `couples-financials-446721`

2. **Limpe o cache do navegador**:
   - Ctrl + Shift + Delete (ou Cmd + Shift + Delete no Mac)
   - Limpar cookies e cache

3. **Tente em modo anônimo/privado**:
   - Para garantir que não há conflito de contas

4. **Entre em contato com o proprietário do projeto**:
   - Ele pode verificar no console quem tem acesso
