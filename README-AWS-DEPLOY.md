# Deploy AWS - Couples Financials

Este guia completo explica como fazer o deploy da aplicação Couples Financials na AWS usando containerização Docker, infraestrutura como código (Terraform) e CI/CD automatizado.

## 📋 Visão Geral

A solução implementa uma arquitetura escalável na AWS com:

- **Frontend**: React containerizado com Docker + Nginx
- **Infraestrutura**: Amazon ECS (Fargate) + Application Load Balancer
- **CDN**: Amazon CloudFront para distribuição global
- **Storage**: Amazon S3 para assets estáticos
- **Secrets**: AWS Secrets Manager para credenciais
- **Logs**: CloudWatch para monitoramento
- **CI/CD**: GitHub Actions para deploy automatizado

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │  Application     │    │   ECS Fargate   │
│   (Global CDN)  │───▶│  Load Balancer   │───▶│   (Containers)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   S3 Bucket     │    │  Target Groups   │    │   CloudWatch    │
│ (Static Assets) │    │  (Health Check)  │    │     (Logs)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                      ┌──────────────────┐    ┌─────────────────┐
                      │ Secrets Manager  │    │    Supabase     │
                      │  (Credentials)   │───▶│   (Database)    │
                      └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Pré-requisitos

Certifique-se de ter instalado:

- [AWS CLI](https://aws.amazon.com/cli/) 
- [Terraform](https://terraform.io/) (versão 1.0+)
- [Docker](https://docker.com/)
- [Node.js](https://nodejs.org/) (versão 18+)
- [Git](https://git-scm.com/)

### 2. Configuração Inicial

Execute o script de configuração:

```bash
chmod +x scripts/setup-aws.sh
./scripts/setup-aws.sh
```

Este script irá:
- ✅ Verificar se AWS CLI está configurado
- ✅ Criar arquivo `terraform/terraform.tfvars`
- ✅ Configurar credenciais do Supabase
- ✅ Preparar secrets para GitHub Actions

### 3. Deploy Manual

Para fazer o deploy completo:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 4. Deploy Automatizado (CI/CD)

1. Configure os secrets no GitHub:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Faça push para a branch `main`:
```bash
git add .
git commit -m "Deploy to AWS"
git push origin main
```

## 📁 Estrutura dos Arquivos

```
couples-financials/
├── Dockerfile                     # Containerização da aplicação
├── docker-compose.yml            # Orquestração local
├── nginx.conf                    # Configuração do Nginx
├── terraform/                    # Infraestrutura como código
│   ├── main.tf                   # Configuração principal
│   ├── variables.tf              # Variáveis
│   ├── ecs.tf                    # Amazon ECS
│   ├── alb.tf                    # Load Balancer
│   ├── s3.tf                     # Storage
│   ├── cloudfront.tf             # CDN
│   ├── secrets.tf                # Secrets Manager
│   ├── outputs.tf                # Outputs
│   └── terraform.tfvars.example  # Exemplo de variáveis
├── .github/workflows/            # CI/CD
│   └── deploy.yml                # GitHub Actions
└── scripts/                     # Scripts de automação
    ├── setup-aws.sh             # Configuração inicial
    ├── deploy.sh                # Deploy manual
    └── test-deployment.sh       # Testes pós-deploy
```

## ⚙️ Configuração Detalhada

### 1. Variáveis do Terraform

Copie e configure o arquivo de variáveis:

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Edite `terraform/terraform.tfvars`:

```hcl
# Configurações gerais
aws_region  = "us-east-1"
environment = "prod"
app_name    = "couples-financials"

# Domínio personalizado (opcional)
domain_name = "meuapp.com.br"  # Configure se tiver domínio próprio

# Credenciais do Supabase
supabase_url              = "https://elxttabdtddlavhseipz.supabase.co"
supabase_anon_key         = "sua_chave_anonima_aqui"
supabase_service_role_key = "sua_chave_service_role_aqui"

# Configurações do container
desired_count = 2    # Número de instâncias
cpu          = 256   # CPU em unidades
memory       = 512   # Memória em MB

# CloudFront
enable_cloudfront = true
```

### 2. Secrets do GitHub Actions

Configure estes secrets no seu repositório GitHub:

| Secret | Descrição | Onde encontrar |
|--------|-----------|----------------|
| `AWS_ACCESS_KEY_ID` | ID da chave de acesso AWS | AWS Console → IAM → Users |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS | AWS Console → IAM → Users |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role | Supabase → Settings → API |

### 3. Permissões AWS Necessárias

O usuário IAM precisa das seguintes permissões:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "ecs:*",
                "ecr:*",
                "s3:*",
                "cloudfront:*",
                "iam:*",
                "secretsmanager:*",
                "logs:*",
                "elasticloadbalancing:*",
                "route53:*",
                "acm:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🏃‍♂️ Comandos de Deploy

### Deploy Completo

```bash
# Deploy completo (build + infraestrutura + aplicação)
./scripts/deploy.sh

# Deploy apenas da infraestrutura
./scripts/deploy.sh --infrastructure-only

# Deploy apenas da aplicação
./scripts/deploy.sh --app-only

# Deploy sem executar testes
./scripts/deploy.sh --skip-tests
```

### Deploy Manual com Terraform

```bash
cd terraform

# Inicializar Terraform
terraform init

# Planejar mudanças
terraform plan

# Aplicar mudanças
terraform apply

# Ver outputs
terraform output
```

### Teste do Deploy

```bash
# Testar aplicação deployada
./scripts/test-deployment.sh

# Teste rápido
./scripts/test-deployment.sh --quick

# Gerar relatório
./scripts/test-deployment.sh --report
```

## 🔧 Desenvolvimento Local

### Docker Compose

Para testar localmente com Docker:

```bash
# Build e start
docker-compose up --build

# Apenas start
docker-compose up

# Stop
docker-compose down
```

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Visualizar build
npm run preview
```

## 🎯 Recursos AWS Criados

O deploy criará os seguintes recursos:

### Compute
- **ECS Cluster**: Cluster Fargate para containers
- **ECS Service**: Serviço com auto-scaling
- **ECS Task Definition**: Definição da task com containers

### Networking
- **Application Load Balancer**: Balanceamento de carga
- **Target Groups**: Grupos de destino com health checks
- **Security Groups**: Regras de firewall

### Storage & CDN
- **S3 Bucket**: Assets estáticos
- **CloudFront**: CDN global com cache
- **ECR Repository**: Registro de imagens Docker

### Security
- **Secrets Manager**: Credenciais do Supabase
- **IAM Roles**: Roles para ECS e execução
- **SSL Certificate**: Certificado SSL via ACM (se domínio configurado)

### Monitoring
- **CloudWatch Log Groups**: Logs da aplicação
- **CloudWatch Metrics**: Métricas do ALB e ECS

## 🌐 Domínio Personalizado

Para usar um domínio próprio:

1. **Registre o domínio** no Route53 ou configure DNS
2. **Configure no terraform.tfvars**:
   ```hcl
   domain_name = "meuapp.com.br"
   ```
3. **Execute o deploy** - certificado SSL será criado automaticamente

## 📊 Monitoramento e Logs

### CloudWatch Logs

Acesse os logs em:
- **Aplicação**: `/ecs/couples-financials`
- **Load Balancer**: Logs de acesso (opcional)

### Métricas Importantes

- **ECS Service**: CPU, Memória, Task Count
- **ALB**: Request Count, Response Time, Error Rate
- **CloudFront**: Cache Hit Rate, Origin Response Time

### Comandos Úteis

```bash
# Ver logs em tempo real
aws logs tail /ecs/couples-financials --follow

# Verificar status do serviço
aws ecs describe-services --cluster couples-financials-cluster --services couples-financials

# Verificar health targets
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## 🛠️ Troubleshooting

### Problemas Comuns

**1. Aplicação não carrega**
```bash
# Verificar logs
aws logs tail /ecs/couples-financials --follow

# Verificar status do serviço
aws ecs describe-services --cluster couples-financials-cluster --services couples-financials
```

**2. Health check falhando**
```bash
# Verificar target groups
aws elbv2 describe-target-health --target-group-arn <arn>

# Testar health endpoint
curl http://<alb-dns>/health
```

**3. Deploy falha no Terraform**
```bash
# Ver logs detalhados
terraform apply -auto-approve -var-file=terraform.tfvars

# Importar recursos existentes se necessário
terraform import aws_ecs_cluster.main couples-financials-cluster
```

**4. Imagem Docker não encontrada**
```bash
# Verificar repositório ECR
aws ecr describe-repositories

# Rebuild e push
docker build -t couples-financials .
docker tag couples-financials:latest $ECR_REGISTRY/couples-financials:latest
docker push $ECR_REGISTRY/couples-financials:latest
```

### Scripts de Debug

```bash
# Informações completas do deployment
./scripts/test-deployment.sh --report

# Status dos recursos AWS
aws ecs list-services --cluster couples-financials-cluster
aws elbv2 describe-load-balancers --names couples-financials-alb
aws cloudfront list-distributions
```

## 💰 Custos Estimados

Custos mensais aproximados (região us-east-1):

| Recurso | Custo Estimado |
|---------|----------------|
| ECS Fargate (2 tasks, 0.25 vCPU, 0.5GB) | ~$15-20 |
| Application Load Balancer | ~$16 |
| CloudFront (até 1TB) | ~$8-10 |
| S3 (100GB) | ~$2-3 |
| Secrets Manager | ~$1 |
| CloudWatch Logs (5GB) | ~$2 |
| **Total Estimado** | **~$44-52/mês** |

### Otimização de Custos

- Use **Spot Instances** para reduzir custos do ECS
- Configure **Lifecycle Policies** no S3
- Ajuste **Log Retention** no CloudWatch
- Use **Reserved Capacity** para cargas previsíveis

## 🔄 Atualizações e Rollback

### Atualização Automática (CI/CD)

Faça push para `main` e o GitHub Actions fará o deploy:

```bash
git add .
git commit -m "Nova funcionalidade"
git push origin main
```

### Atualização Manual

```bash
# Build nova imagem
docker build -t couples-financials:new-version .

# Tag e push
docker tag couples-financials:new-version $ECR_REGISTRY/couples-financials:new-version
docker push $ECR_REGISTRY/couples-financials:new-version

# Atualizar task definition
aws ecs update-service --cluster couples-financials-cluster --service couples-financials --force-new-deployment
```

### Rollback

```bash
# Via Terraform
terraform plan -var="container_image=$ECR_REGISTRY/couples-financials:previous-version"
terraform apply

# Via AWS CLI
aws ecs update-service --cluster couples-financials-cluster --service couples-financials --task-definition couples-financials:previous-revision
```

## 🧪 Testes

### Testes Automatizados

```bash
# Testes completos
./scripts/test-deployment.sh

# Testes específicos
curl http://<alb-dns>/health
curl http://<alb-dns>/
```

### Smoke Tests

O pipeline inclui testes automáticos:
- ✅ Health check endpoint
- ✅ Página principal carrega
- ✅ Assets estáticos disponíveis
- ✅ Conectividade com Supabase

## 📚 Recursos Adicionais

### Links Úteis

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Suporte

Para problemas específicos:

1. **Revise os logs** no CloudWatch
2. **Execute os testes** com `./scripts/test-deployment.sh`
3. **Verifique a documentação** do AWS
4. **Use o AWS Support** se necessário

---

## 🎉 Conclusão

Você agora tem um ambiente de produção completo na AWS com:

- ✅ **Aplicação containerizada** rodando no ECS Fargate
- ✅ **CDN global** com CloudFront
- ✅ **Load balancing** e health checks
- ✅ **SSL automático** (se domínio configurado)
- ✅ **Deploy automatizado** com GitHub Actions
- ✅ **Monitoramento** com CloudWatch
- ✅ **Secrets seguros** no Secrets Manager

A aplicação está pronta para escalar e atender usuários globalmente! 🚀

Para dúvidas ou melhorias, consulte a documentação ou abra uma issue no repositório.