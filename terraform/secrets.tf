# AWS Secrets Manager para credenciais do Supabase
resource "aws_secretsmanager_secret" "supabase_credentials" {
  name        = "${var.app_name}-supabase-credentials"
  description = "Credenciais do Supabase para aplicação ${var.app_name}"

  tags = {
    Name        = "${var.app_name}-supabase-secrets"
    Environment = var.environment
  }
}

# Valores das credenciais do Supabase
resource "aws_secretsmanager_secret_version" "supabase_credentials" {
  secret_id = aws_secretsmanager_secret.supabase_credentials.id
  
  secret_string = jsonencode({
    SUPABASE_URL              = var.supabase_url
    SUPABASE_ANON_KEY         = var.supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Secret adicional para outras configurações da aplicação
resource "aws_secretsmanager_secret" "app_config" {
  name        = "${var.app_name}-app-config"
  description = "Configurações gerais da aplicação ${var.app_name}"

  tags = {
    Name        = "${var.app_name}-app-config"
    Environment = var.environment
  }
}

# Valores das configurações da aplicação
resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  
  secret_string = jsonencode({
    NODE_ENV     = "production"
    APP_NAME     = var.app_name
    ENVIRONMENT  = var.environment
    AWS_REGION   = var.aws_region
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# IAM policy para permitir acesso aos secrets
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.app_name}-secrets-access"
  description = "Política para acessar secrets do ${var.app_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.supabase_credentials.arn,
          aws_secretsmanager_secret.app_config.arn
        ]
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-secrets-policy"
    Environment = var.environment
  }
}

# Anexar política ao role de execução do ECS
resource "aws_iam_role_policy_attachment" "ecs_secrets_access" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = aws_iam_policy.secrets_access.arn
}