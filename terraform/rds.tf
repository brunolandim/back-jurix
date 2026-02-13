# ======================================================
# rds.tf - Banco de dados PostgreSQL (RDS)
# ======================================================

# Senha gerada automaticamente - ninguém precisa saber
resource "random_password" "db_password" {
  length  = 32
  special = false
  # special = false porque alguns caracteres especiais
  # quebram a connection string do Prisma
}

# Security Group - quem pode acessar o banco
resource "aws_security_group" "rds" {
  name        = "${local.prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"

  # Permite conexões na porta 5432 (PostgreSQL)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    # Por enquanto libera pra todos os IPs (Lambda sem VPC tem IP dinâmico)
    # A segurança vem da senha forte (32 chars) + SSL
    # Para produção: mover pra VPC e restringir
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.prefix}-rds-sg"
  }
}

# A instância RDS
resource "aws_db_instance" "main" {
  identifier = "${local.prefix}-db"
  # identifier = nome do recurso na AWS (não é o nome do banco)

  engine         = "postgres"
  engine_version = "16"
  instance_class = terraform.workspace == "production" ? "db.t3.small" : "db.t3.micro"
  # t3.micro = ~$15/mês (staging)
  # t3.small = ~$30/mês (production)

  allocated_storage     = 20  # 20 GB inicial
  max_allocated_storage = 50  # cresce automaticamente até 50 GB
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "jurix"
  username = "jurix"
  password = random_password.db_password.result

  publicly_accessible    = true
  # true = permite conexão pela internet (necessário sem VPC)
  # A segurança vem do security group + senha forte
  # Para produção com SSM tunnel: mudar pra false + VPC

  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = terraform.workspace == "production" ? 14 : 1
  skip_final_snapshot     = terraform.workspace != "production"
  # staging: sem snapshot final (pode deletar tranquilo)
  # production: exige snapshot antes de deletar

  tags = {
    Name = "${local.prefix}-db"
  }
}

# Salva a DATABASE_URL no SSM para usar no Beekeeper ou outros tools
resource "aws_ssm_parameter" "database_url" {
  name  = "/jurix/${terraform.workspace}/database_url"
  type  = "SecureString"
  value = "postgresql://${aws_db_instance.main.username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  # Resultado: postgresql://jurix:SENHA_32_CHARS@jurix-staging-db.xxxxx.us-east-1.rds.amazonaws.com:5432/jurix
}
