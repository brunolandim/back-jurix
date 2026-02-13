# ======================================================
# main.tf - Configuração base do Terraform
# ======================================================
# Aqui definimos:
# 1. Qual versão do Terraform usar
# 2. Quais providers (AWS, etc)
# 3. Onde guardar o state (local ou S3)
# ======================================================

terraform {
  # Quando for pra produção, descomente o backend S3
  # para guardar o state remotamente (compartilhado entre a equipe)
  #
  # backend "s3" {
  #   bucket  = "jurix-terraform-state"
  #   key     = "terraform.tfstate"
  #   region  = "us-east-1"
  #   encrypt = true
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Provider = qual cloud você vai usar
# Tudo que você criar (Lambda, RDS, S3...) vai pra essa região
provider "aws" {
  region = "us-east-1"
}

# Locals = variáveis internas calculadas
# Diferente de "variables", locals não vêm de fora - são definidas aqui dentro
locals {
  project = "jurix"
  prefix  = "${local.project}-${terraform.workspace}"
  # terraform.workspace = "staging" ou "production"
  # então prefix = "jurix-staging" ou "jurix-production"
}
