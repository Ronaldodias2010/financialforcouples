# Variáveis de configuração para o Terraform

variable "aws_region" {
  description = "Região da AWS onde os recursos serão criados"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente de deploy (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Nome da aplicação"
  type        = string
  default     = "couples-financials"
}

variable "domain_name" {
  description = "Nome do domínio para a aplicação"
  type        = string
  default     = ""
}

variable "supabase_url" {
  description = "URL do Supabase"
  type        = string
  default     = "https://elxttabdtddlavhseipz.supabase.co"
}

variable "supabase_anon_key" {
  description = "Chave anônima do Supabase"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Chave do service role do Supabase"
  type        = string
  sensitive   = true
}

variable "container_image" {
  description = "Imagem do container Docker"
  type        = string
  default     = "couples-financials:latest"
}

variable "container_port" {
  description = "Porta do container"
  type        = number
  default     = 80
}

variable "desired_count" {
  description = "Número desejado de instâncias do container"
  type        = number
  default     = 2
}

variable "cpu" {
  description = "CPU para a task do ECS (em unidades)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memória para a task do ECS (em MB)"
  type        = number
  default     = 512
}

variable "enable_cloudfront" {
  description = "Habilitar CloudFront para distribuição global"
  type        = bool
  default     = true
}

variable "cloudwatch_log_retention_days" {
  description = "Dias de retenção dos logs no CloudWatch"
  type        = number
  default     = 7
}

variable "cloudfront_oac_id" {
  description = "ID de um Origin Access Control do CloudFront já existente para reutilizar. Se definido, não criaremos um novo OAC."
  type        = string
  default     = ""
}

variable "cloudfront_create_oac" {
  description = "Se verdadeiro, cria um novo OAC quando nenhum ID for fornecido (pode falhar por cota)."
  type        = bool
  default     = false
}

variable "cloudfront_create_spa_function" {
  description = "Se verdadeiro, cria função CloudFront para roteamento SPA (pode falhar por limite de funções)."
  type        = bool
  default     = false
}

variable "bypass_cloudfront_during_deploy" {
  description = "Desabilitar CloudFront temporariamente durante deploys para maior velocidade."
  type        = bool
  default     = false
}

variable "auto_invalidate_cloudfront" {
  description = "Invalidar automaticamente o cache do CloudFront após deploys."
  type        = bool
  default     = true
}