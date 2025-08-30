# Outputs importantes para referência e debugging

output "alb_dns_name" {
  description = "Nome DNS do Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_zone_id" {
  description = "Zone ID do Application Load Balancer"
  value       = aws_lb.app.zone_id
}

output "cloudfront_distribution_id" {
  description = "ID da distribuição CloudFront"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.app[0].id : null
}

output "cloudfront_domain_name" {
  description = "Nome de domínio da distribuição CloudFront"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.app[0].domain_name : null
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 para assets estáticos"
  value       = aws_s3_bucket.app_static.bucket
}

output "s3_bucket_website_endpoint" {
  description = "Endpoint do website S3"
  value       = aws_s3_bucket_website_configuration.app_static.website_endpoint
}

output "ecs_cluster_name" {
  description = "Nome do cluster ECS"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Nome do serviço ECS"
  value       = aws_ecs_service.app.name
}

output "secrets_manager_supabase_arn" {
  description = "ARN do secret com credenciais do Supabase"
  value       = aws_secretsmanager_secret.supabase_credentials.arn
}

output "secrets_manager_app_config_arn" {
  description = "ARN do secret com configurações da aplicação"
  value       = aws_secretsmanager_secret.app_config.arn
}

output "cloudwatch_log_group_name" {
  description = "Nome do grupo de logs no CloudWatch"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "application_url" {
  description = "URL principal da aplicação"
  value = var.enable_cloudfront ? (
    var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.app[0].domain_name}"
  ) : "http://${aws_lb.app.dns_name}"
}

output "alb_direct_url" {
  description = "URL direta do ALB (bypass CloudFront)"
  value       = "http://${aws_lb.app.dns_name}"
}

output "cloudfront_status" {
  description = "Status do CloudFront (habilitado/desabilitado)"
  value       = var.enable_cloudfront ? "enabled" : "disabled"
}

output "ssl_certificate_arn" {
  description = "ARN do certificado SSL (se configurado)"
  value       = var.domain_name != "" ? aws_acm_certificate.app[0].arn : null
}

# Outputs para debugging e monitoramento
output "vpc_id" {
  description = "ID da VPC utilizada"
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "IDs das subnets utilizadas"
  value       = data.aws_subnets.default.ids
}

output "security_group_ids" {
  description = "IDs dos security groups criados"
  value = {
    ecs = aws_security_group.ecs_sg.id
    alb = aws_security_group.alb_sg.id
  }
}

# Outputs para integração com CI/CD
output "ecr_repository_url" {
  description = "URL do repositório ECR (se criado)"
  value       = "Configurar ECR separadamente se necessário"
}

output "task_definition_arn" {
  description = "ARN da task definition do ECS"
  value       = aws_ecs_task_definition.app.arn
}