# Bucket S3 para arquivos estáticos e logs
resource "aws_s3_bucket" "app_static" {
  bucket = "${var.app_name}-static-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "${var.app_name}-static-assets"
    Environment = var.environment
  }
}

# String aleatória para sufixo do bucket
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Configuração de versionamento do bucket
resource "aws_s3_bucket_versioning" "app_static" {
  bucket = aws_s3_bucket.app_static.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configuração de criptografia do bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "app_static" {
  bucket = aws_s3_bucket.app_static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Configuração de bloqueio de acesso público
resource "aws_s3_bucket_public_access_block" "app_static" {
  bucket = aws_s3_bucket.app_static.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Política do bucket para acesso público de leitura (apenas para assets estáticos)
resource "aws_s3_bucket_policy" "app_static" {
  bucket = aws_s3_bucket.app_static.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.app_static.arn}/public/*"
      },
      {
        Sid    = "CloudFrontOriginAccessIdentity"
        Effect = "Allow"
        Principal = {
          AWS = var.enable_cloudfront ? aws_cloudfront_origin_access_identity.app[0].iam_arn : "*"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.app_static.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.app_static]
}

# Configuração de website estático
resource "aws_s3_bucket_website_configuration" "app_static" {
  bucket = aws_s3_bucket.app_static.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# Configuração de CORS
resource "aws_s3_bucket_cors_configuration" "app_static" {
  bucket = aws_s3_bucket.app_static.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Bucket para logs do ALB (opcional)
# resource "aws_s3_bucket" "alb_logs" {
#   bucket = "${var.app_name}-alb-logs-${random_string.bucket_suffix.result}"
#   
#   tags = {
#     Name        = "${var.app_name}-alb-logs"
#     Environment = var.environment
#   }
# }

# resource "aws_s3_bucket_policy" "alb_logs" {
#   bucket = aws_s3_bucket.alb_logs.id
#   
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           AWS = "arn:aws:iam::${data.aws_elb_service_account.main.id}:root"
#         }
#         Action   = "s3:PutObject"
#         Resource = "${aws_s3_bucket.alb_logs.arn}/alb-logs/*"
#       }
#     ]
#   })
# }

# data "aws_elb_service_account" "main" {}