# Application Load Balancer
resource "aws_lb" "app" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets           = data.aws_subnets.default.ids

  enable_deletion_protection = false

  # Configuração de logs de acesso (opcional)
  # access_logs {
  #   bucket  = aws_s3_bucket.alb_logs.bucket
  #   prefix  = "alb-logs"
  #   enabled = true
  # }

  tags = {
    Name = "${var.app_name}-alb"
  }

  lifecycle {
    ignore_changes = [name]
  }
}

# Target Group para o ALB
resource "aws_lb_target_group" "app" {
  name        = "${var.app_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = {
    Name = "${var.app_name}-target-group"
  }

  lifecycle {
    ignore_changes = [name]
  }
}

# Listener para HTTP
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  # Redirect HTTP to HTTPS se certificado estiver configurado
  dynamic "default_action" {
    for_each = var.domain_name != "" ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  # Forward para target group se não houver domínio configurado
  dynamic "default_action" {
    for_each = var.domain_name == "" ? [1] : []
    content {
      type = "forward"
      forward {
        target_group {
          arn = aws_lb_target_group.app.arn
        }
      }
    }
  }

  tags = {
    Name = "${var.app_name}-http-listener"
  }
}

# Listener para HTTPS (apenas se domínio estiver configurado)
resource "aws_lb_listener" "app_https" {
  count = var.domain_name != "" ? 1 : 0
  
  load_balancer_arn = aws_lb.app.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.app[0].certificate_arn

  default_action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.app.arn
      }
    }
  }

  tags = {
    Name = "${var.app_name}-https-listener"
  }
}

# Certificado SSL via ACM (apenas se domínio estiver configurado)
resource "aws_acm_certificate" "app" {
  count = var.domain_name != "" ? 1 : 0
  
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.app_name}-certificate"
  }
}

# Validação do certificado SSL
resource "aws_acm_certificate_validation" "app" {
  count = var.domain_name != "" ? 1 : 0
  
  certificate_arn         = aws_acm_certificate.app[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Zona Route53 (apenas se domínio estiver configurado)
data "aws_route53_zone" "app" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# Registros DNS para validação do certificado
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.app[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.app[0].zone_id
}

# Registro DNS principal
resource "aws_route53_record" "app" {
  count = var.domain_name != "" ? 1 : 0
  
  zone_id = data.aws_route53_zone.app[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}