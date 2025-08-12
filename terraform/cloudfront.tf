# CloudFront Origin Access Control para acesso seguro ao S3 (substitui OAI)
# Atualizado para resolver erro de quota de OAI
resource "aws_cloudfront_origin_access_control" "app" {
  count = var.enable_cloudfront && var.cloudfront_oac_id == "" && var.cloudfront_create_oac ? 1 : 0
  name  = "${var.app_name}-oac-${random_string.bucket_suffix.result}"
  description = "OAC for ${var.app_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

# Locais para OAC
locals {
  cloudfront_oac_id = var.cloudfront_oac_id != "" ? var.cloudfront_oac_id : try(aws_cloudfront_origin_access_control.app[0].id, null)
}

# Distribuição CloudFront
resource "aws_cloudfront_distribution" "app" {
  count = var.enable_cloudfront ? 1 : 0

  # Origem primária - Application Load Balancer
  origin {
    domain_name = aws_lb.app.dns_name
    origin_id   = "ALB-${var.app_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Origem secundária - S3 para assets estáticos
  origin {
    domain_name = aws_s3_bucket.app_static.bucket_regional_domain_name
    origin_id   = "S3-${var.app_name}-static"
    origin_access_control_id = local.cloudfront_oac_id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "CloudFront distribution for ${var.app_name}"

  # Aliases (domínios personalizados)
  aliases = var.domain_name != "" ? [var.domain_name] : []

  # Comportamento padrão - redirecionar para ALB
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${var.app_name}"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "CloudFront-Forwarded-Proto"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    # Função para reescrever URLs da SPA
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing[0].arn
    }
  }

  # Comportamento para assets estáticos do S3
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.app_name}-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Comportamento para assets de imagem
  ordered_cache_behavior {
    path_pattern     = "*.jpg"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.app_name}-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Comportamento para assets CSS
  ordered_cache_behavior {
    path_pattern     = "*.css"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.app_name}-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Comportamento para assets JS
  ordered_cache_behavior {
    path_pattern     = "*.js"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.app_name}-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Comportamento para assets PNG
  ordered_cache_behavior {
    path_pattern     = "*.png"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.app_name}-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Comportamento para assets SVG
  ordered_cache_behavior {
    path_pattern     = "*.svg"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.app_name}-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Comportamento para assets ICO
  ordered_cache_behavior {
    path_pattern     = "*.ico"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.app_name}-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Configuração de restrições geográficas
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Configuração do certificado SSL
  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == ""
    acm_certificate_arn           = var.domain_name != "" ? aws_acm_certificate_validation.app[0].certificate_arn : null
    ssl_support_method            = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version      = var.domain_name != "" ? "TLSv1.2_2021" : null
  }

  # Páginas de erro personalizadas
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = {
    Name        = "${var.app_name}-cloudfront"
    Environment = var.environment
  }
}

# Função CloudFront para roteamento de SPA
resource "aws_cloudfront_function" "spa_routing" {
  count = var.enable_cloudfront ? 1 : 0
  
  name    = "${var.app_name}-spa-routing-${random_string.bucket_suffix.result}"
  runtime = "cloudfront-js-1.0"
  comment = "Function to handle SPA routing"
  publish = true
  code    = file("${path.module}/cloudfront-function.js")

  lifecycle {
    ignore_changes = [name]
  }
}