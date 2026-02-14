# ======================================================
# s3.tf - Bucket S3 para uploads
# ======================================================

resource "aws_s3_bucket" "uploads" {
  bucket = "${local.prefix}-uploads"
  # Resultado: "jurix-staging-uploads" ou "jurix-production-uploads"
}

# Bloquear TODO acesso público
# Mesmo que alguém erre uma policy, o bucket continua privado
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Encriptação - todos os arquivos são encriptados em repouso
resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS - permite o frontend fazer upload via presigned URL
# Sem isso, o browser bloqueia o upload direto pro S3
locals {
  cors_origins = terraform.workspace == "production" ? ["https://app.jurix.com.br"] : ["http://localhost:3000", "https://jurix-git-staging-brunolandims-projects.vercel.app"]
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = local.cors_origins
    max_age_seconds = 3600
  }
}
