# ======================================================
# data.tf - Data Sources + Locals
# ======================================================
# Alguns valores vêm de recursos que o Terraform CRIA (RDS, S3)
# Outros vêm do SSM (secrets que você cadastra manualmente)
#
# Parâmetros que você precisa criar no SSM antes do primeiro apply:
#
# aws ssm put-parameter --name "/jurix/staging/jwt_secret" --value "seu-secret" --type SecureString
# aws ssm put-parameter --name "/jurix/staging/stripe_secret_key" --value "sk_..." --type SecureString
# aws ssm put-parameter --name "/jurix/staging/stripe_webhook_secret" --value "whsec_..." --type SecureString
# aws ssm put-parameter --name "/jurix/staging/stripe_pro_price_id" --value "price_..." --type String
# aws ssm put-parameter --name "/jurix/staging/stripe_business_price_id" --value "price_..." --type String
# aws ssm put-parameter --name "/jurix/staging/stripe_enterprise_price_id" --value "price_..." --type String
# aws ssm put-parameter --name "/jurix/staging/app_url" --value "http://localhost:3000" --type String
# aws ssm put-parameter --name "/jurix/staging/ses_from_email" --value "noreply@jurix.com.br" --type String
# aws ssm put-parameter --name "/jurix/staging/whatsapp_phone_number_id" --value "" --type String
# aws ssm put-parameter --name "/jurix/staging/whatsapp_access_token" --value "" --type SecureString
# aws ssm put-parameter --name "/jurix/staging/database_url" --value "postgresql://...NEON_URL..." --type SecureString
# ======================================================

# --- Secrets do SSM (você cria manualmente) ---

data "aws_ssm_parameter" "jwt_secret" {
  name = "/jurix/${terraform.workspace}/jwt_secret"
}

data "aws_ssm_parameter" "stripe_secret_key" {
  name = "/jurix/${terraform.workspace}/stripe_secret_key"
}

data "aws_ssm_parameter" "stripe_webhook_secret" {
  name = "/jurix/${terraform.workspace}/stripe_webhook_secret"
}

data "aws_ssm_parameter" "whatsapp_access_token" {
  name = "/jurix/${terraform.workspace}/whatsapp_access_token"
}

# --- Config do SSM (você cria manualmente) ---

data "aws_ssm_parameter" "app_url" {
  name = "/jurix/${terraform.workspace}/app_url"
}

data "aws_ssm_parameter" "ses_from_email" {
  name = "/jurix/${terraform.workspace}/ses_from_email"
}

data "aws_ssm_parameter" "stripe_pro_price_id" {
  name = "/jurix/${terraform.workspace}/stripe_pro_price_id"
}

data "aws_ssm_parameter" "stripe_business_price_id" {
  name = "/jurix/${terraform.workspace}/stripe_business_price_id"
}

data "aws_ssm_parameter" "stripe_enterprise_price_id" {
  name = "/jurix/${terraform.workspace}/stripe_enterprise_price_id"
}

data "aws_ssm_parameter" "whatsapp_phone_number_id" {
  name = "/jurix/${terraform.workspace}/whatsapp_phone_number_id"
}

# DATABASE_URL do Neon (staging) - lida do SSM parameter manual
data "aws_ssm_parameter" "database_url" {
  count = terraform.workspace != "production" ? 1 : 0
  name  = "/jurix/${terraform.workspace}/database_url"
}

# ======================================================
# Locals - Env vars para as Lambdas
# ======================================================
# Mix de:
# - Recursos criados pelo Terraform (RDS, S3) → referência direta
# - Valores do SSM → data.aws_ssm_parameter.xxx.value

locals {
  database_url = terraform.workspace == "production" ? "postgresql://${aws_db_instance.main[0].username}:${random_password.db_password[0].result}@${aws_db_instance.main[0].endpoint}/${aws_db_instance.main[0].db_name}" : data.aws_ssm_parameter.database_url[0].value

  env_vars = {
    # --- Vêm do Terraform (criados aqui) ---
    DATABASE_URL = local.database_url
    S3_BUCKET    = aws_s3_bucket.uploads.bucket

    # --- Vêm do SSM (cadastrados manualmente) ---
    JWT_SECRET                 = data.aws_ssm_parameter.jwt_secret.value
    JWT_EXPIRES_IN             = "7d"
    AWS_REGION_CUSTOM          = "us-east-1"
    STRIPE_SECRET_KEY          = data.aws_ssm_parameter.stripe_secret_key.value
    STRIPE_WEBHOOK_SECRET      = data.aws_ssm_parameter.stripe_webhook_secret.value
    STRIPE_PRO_PRICE_ID        = data.aws_ssm_parameter.stripe_pro_price_id.value
    STRIPE_BUSINESS_PRICE_ID   = data.aws_ssm_parameter.stripe_business_price_id.value
    STRIPE_ENTERPRISE_PRICE_ID = data.aws_ssm_parameter.stripe_enterprise_price_id.value
    APP_URL                    = data.aws_ssm_parameter.app_url.value
    SES_FROM_EMAIL             = data.aws_ssm_parameter.ses_from_email.value
    SES_REGION                 = "us-east-1"
    WHATSAPP_PHONE_NUMBER_ID   = data.aws_ssm_parameter.whatsapp_phone_number_id.value
    WHATSAPP_ACCESS_TOKEN      = data.aws_ssm_parameter.whatsapp_access_token.value
  }
}
