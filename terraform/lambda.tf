# ======================================================
# lambda.tf - Definição das Lambda Functions
# ======================================================
# Cada Lambda precisa de:
# 1. Um IAM Role (quem a Lambda "é" - suas permissões)
# 2. Uma IAM Policy (o que a Lambda "pode fazer" - S3, SES, SSM...)
# 3. A Function em si (código, runtime, env vars...)
#
# As env vars agora vêm do local.env_vars (definido em data.tf)
# que busca os valores do SSM Parameter Store
# ======================================================

# --------------------------------------------------
# IAM Role - A "identidade" das Lambdas
# --------------------------------------------------
resource "aws_iam_role" "lambda_role" {
  name = "${local.prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# --------------------------------------------------
# IAM Policy - O que as Lambdas podem fazer
# --------------------------------------------------
resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${local.prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:us-east-1:*:parameter/jurix/${terraform.workspace}/*"
      }
    ]
  })
}

# --------------------------------------------------
# Lambda Function - PUBLIC
# --------------------------------------------------
resource "aws_lambda_function" "public" {
  function_name = "${local.prefix}-public-api"
  role          = aws_iam_role.lambda_role.arn

  s3_bucket = aws_s3_bucket.uploads.bucket
  s3_key    = "deploy/functions.zip"

  handler     = "src/functions/public-lambda.handler"
  runtime     = "nodejs20.x"
  timeout     = 30
  memory_size = 512

  environment {
    variables = merge(local.env_vars, {
      NODE_ENV = terraform.workspace == "production" ? "production" : "development"
    })
    # merge() junta o map local.env_vars + NODE_ENV
    # Resultado: todas as env vars do data.tf + NODE_ENV
  }
}

# --------------------------------------------------
# Lambda Function - PRIVATE
# --------------------------------------------------
resource "aws_lambda_function" "private" {
  function_name = "${local.prefix}-private-api"
  role          = aws_iam_role.lambda_role.arn

  s3_bucket = aws_s3_bucket.uploads.bucket
  s3_key    = "deploy/functions.zip"

  handler     = "src/functions/private-lambda.handler"
  runtime     = "nodejs20.x"
  timeout     = 30
  memory_size = 512

  environment {
    variables = merge(local.env_vars, {
      NODE_ENV = terraform.workspace == "production" ? "production" : "development"
    })
  }
}

# --------------------------------------------------
# CloudWatch Log Groups
# --------------------------------------------------

resource "aws_cloudwatch_log_group" "public_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.public.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "private_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.private.function_name}"
  retention_in_days = 14
}

# ==========================================================
# NOTIFICATION WORKER - Lambda com schedule (sem API Gateway)
# ==========================================================

resource "aws_lambda_function" "notification_worker" {
  function_name = "${local.prefix}-notification-worker"
  role          = aws_iam_role.lambda_role.arn

  s3_bucket = aws_s3_bucket.uploads.bucket
  s3_key    = "deploy/functions.zip"

  handler     = "src/functions/notification-worker.handler"
  runtime     = "nodejs20.x"
  timeout     = 60
  memory_size = 256

  environment {
    variables = {
      NODE_ENV       = terraform.workspace == "production" ? "production" : "development"
      DATABASE_URL   = local.env_vars.DATABASE_URL
      SES_FROM_EMAIL = local.env_vars.SES_FROM_EMAIL
      SES_REGION     = "us-east-1"
    }
  }
}

resource "aws_cloudwatch_log_group" "worker_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.notification_worker.function_name}"
  retention_in_days = 14
}

# EventBridge Rule - cron job
resource "aws_cloudwatch_event_rule" "notification_schedule" {
  name                = "${local.prefix}-notification-schedule"
  description         = "Dispara o notification worker todo dia às 6h (Brasília)"
  schedule_expression = "cron(0 9 * * ? *)" # 9h UTC = 6h BRT
}

# Event Target - conecta a rule à Lambda
resource "aws_cloudwatch_event_target" "notification_worker" {
  rule = aws_cloudwatch_event_rule.notification_schedule.name
  arn  = aws_lambda_function.notification_worker.arn
}

# Permissão - EventBridge invocar a Lambda
resource "aws_lambda_permission" "eventbridge_worker" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification_worker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.notification_schedule.arn
}
