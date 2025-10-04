# Cloud Storage bucket para assets estáticos

resource "google_storage_bucket" "static_assets" {
  name          = "${var.gcp_project_id}-${var.app_name}-assets"
  location      = "US"
  storage_class = "STANDARD"
  
  # Acesso público
  uniform_bucket_level_access = true

  # Versionamento
  versioning {
    enabled = false
  }

  # Lifecycle rules para otimizar custos
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  # CORS para assets
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Website configuration (se necessário)
  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }

  # Labels
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Tornar bucket público para leitura
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.static_assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Backup bucket (opcional)
resource "google_storage_bucket" "backups" {
  name          = "${var.gcp_project_id}-${var.app_name}-backups"
  location      = "US"
  storage_class = "NEARLINE"
  
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "backups"
  }
}
