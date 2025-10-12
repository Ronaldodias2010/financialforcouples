# Load Balancer HTTPS com Cloud CDN

# Endereço IP estático global
resource "google_compute_global_address" "default" {
  name = "${var.app_name}-ip"
}

# Backend Service conectado ao Cloud Run
resource "google_compute_backend_service" "default" {
  name                  = "${var.app_name}-backend"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  enable_cdn            = var.enable_cdn
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.serverless_neg.id
  }

  # Configuração do CDN
  dynamic "cdn_policy" {
    for_each = var.enable_cdn ? [1] : []
    content {
      cache_mode  = "CACHE_ALL_STATIC"
      default_ttl = var.cdn_cache_max_age
      max_ttl     = var.cdn_cache_max_age * 2
      client_ttl  = var.cdn_cache_max_age

      # Cache de conteúdo estático
      cache_key_policy {
        include_host         = true
        include_protocol     = true
        include_query_string = false
      }
    }
  }

  # Log de acesso
  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# URL Map
resource "google_compute_url_map" "default" {
  name            = "${var.app_name}-url-map"
  default_service = google_compute_backend_service.default.id

  # Redirect HTTP para HTTPS (opcional)
  host_rule {
    hosts        = var.domain_name != "" ? [var.domain_name] : ["*"]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.default.id
  }
}

# Certificado SSL gerenciado pelo Google (se domínio configurado)
resource "google_compute_managed_ssl_certificate" "default" {
  count = var.domain_name != "" ? 1 : 0
  name  = "${var.app_name}-ssl-cert"

  managed {
    domains = compact([
      var.domain_name,
      var.secondary_domain_name
    ])
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "default" {
  count            = var.domain_name != "" ? 1 : 0
  name             = "${var.app_name}-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default[0].id]
}

# HTTP Proxy (para redirect HTTP -> HTTPS)
resource "google_compute_target_http_proxy" "default" {
  name    = "${var.app_name}-http-proxy"
  url_map = google_compute_url_map.default.id
}

# Forwarding Rule HTTPS
resource "google_compute_global_forwarding_rule" "https" {
  count                 = var.domain_name != "" ? 1 : 0
  name                  = "${var.app_name}-https-rule"
  target                = google_compute_target_https_proxy.default[0].id
  port_range            = "443"
  ip_address            = google_compute_global_address.default.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# Forwarding Rule HTTP
resource "google_compute_global_forwarding_rule" "http" {
  name                  = "${var.app_name}-http-rule"
  target                = google_compute_target_http_proxy.default.id
  port_range            = "80"
  ip_address            = google_compute_global_address.default.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
