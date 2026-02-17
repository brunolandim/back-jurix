# ======================================================
# rds.tf - Banco de dados PostgreSQL (RDS)
# Criado apenas no workspace production.
# Staging usa Neon (free tier) via SSM parameter manual.
# ======================================================

# Senha gerada automaticamente - ninguém precisa saber
resource "random_password" "db_password" {
  count   = terraform.workspace == "production" ? 1 : 0
  length  = 32
  special = false
  # special = false porque alguns caracteres especiais
  # quebram a connection string do Prisma
}

# Security Group - quem pode acessar o banco
resource "aws_security_group" "rds" {
  count       = terraform.workspace == "production" ? 1 : 0
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
  count      = terraform.workspace == "production" ? 1 : 0
  identifier = "${local.prefix}-db"
  # identifier = nome do recurso na AWS (não é o nome do banco)

  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t4g.micro"

  allocated_storage     = 20  # 20 GB inicial
  max_allocated_storage = 50  # cresce automaticamente até 50 GB
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "jurix"
  username = "jurix"
  password = random_password.db_password[0].result

  publicly_accessible    = true
  # true = permite conexão pela internet (necessário sem VPC)
  # A segurança vem do security group + senha forte
  # Para produção com SSM tunnel: mudar pra false + VPC

  vpc_security_group_ids = [aws_security_group.rds[0].id]

  backup_retention_period = 14
  skip_final_snapshot     = false
  # production: exige snapshot antes de deletar

  tags = {
    Name = "${local.prefix}-db"
  }
}

# Salva a DATABASE_URL no SSM para usar no Beekeeper ou outros tools
resource "aws_ssm_parameter" "database_url" {
  count = terraform.workspace == "production" ? 1 : 0
  name  = "/jurix/${terraform.workspace}/database_url"
  type  = "SecureString"
  value = "postgresql://${aws_db_instance.main[0].username}:${random_password.db_password[0].result}@${aws_db_instance.main[0].endpoint}/${aws_db_instance.main[0].db_name}"
}
