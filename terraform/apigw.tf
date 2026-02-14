# ======================================================
# apigw.tf - API Gateway
# ======================================================
# Um API Gateway, duas Lambdas:
#
# /auth/*         → public Lambda
# /plans          → public Lambda
# /webhooks/*     → public Lambda
# /share-links/*  → public Lambda
# /{proxy+}       → private Lambda (todo o resto)
#
# No API Gateway, paths específicos têm prioridade sobre {proxy+}
# Então /auth/login vai para "auth", não para o catch-all
# ======================================================

# --------------------------------------------------
# REST API - O container principal
# --------------------------------------------------
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.prefix}-api"
  description = "Jurix API - ${terraform.workspace}"
}

# ==========================================================
# ROTAS PÚBLICAS - paths que vão para a Lambda public
# ==========================================================
# Precisamos de um "resource" para cada path de primeiro nível
# e um {proxy+} dentro dele para capturar sub-paths

# --- /auth e /auth/* ---
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "auth_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "{proxy+}"
}

# --- /plans ---
resource "aws_api_gateway_resource" "plans" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "plans"
}

# --- /webhooks/* ---
resource "aws_api_gateway_resource" "webhooks" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "webhooks"
}

resource "aws_api_gateway_resource" "webhooks_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.webhooks.id
  path_part   = "{proxy+}"
}

# --- /share-links/* ---
resource "aws_api_gateway_resource" "share_links" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "share-links"
}

resource "aws_api_gateway_resource" "share_links_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.share_links.id
  path_part   = "{proxy+}"
}

# --------------------------------------------------
# Methods + Integrations para rotas públicas
# --------------------------------------------------
# Usamos locals para evitar repetição - cada entrada
# é um resource_id que precisa de method + integration

locals {
  # Todos os resources que apontam para a Lambda PUBLIC
  public_resources = {
    auth             = aws_api_gateway_resource.auth.id
    auth_proxy       = aws_api_gateway_resource.auth_proxy.id
    plans            = aws_api_gateway_resource.plans.id
    webhooks         = aws_api_gateway_resource.webhooks.id
    webhooks_proxy   = aws_api_gateway_resource.webhooks_proxy.id
    share_links_proxy = aws_api_gateway_resource.share_links_proxy.id
  }
}

# for_each = cria um method para CADA resource na lista
# Sem for_each, teríamos que copiar/colar o bloco 7 vezes
resource "aws_api_gateway_method" "public" {
  for_each = local.public_resources

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "public" {
  for_each = local.public_resources

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = each.value
  http_method             = aws_api_gateway_method.public[each.key].http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.public.invoke_arn
}

# ==========================================================
# ROTA PRIVADA - /share-links (base, sem proxy) vai para private
# ==========================================================
# POST /share-links cria um share link (requer auth → private Lambda)
# GET/POST /share-links/{token}/... são públicos (via share_links_proxy acima)

resource "aws_api_gateway_method" "share_links_private" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.share_links.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "share_links_private" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.share_links.id
  http_method             = aws_api_gateway_method.share_links_private.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.private.invoke_arn
}

# ==========================================================
# ROTA PRIVADA - catch-all para a Lambda private
# ==========================================================
# {proxy+} no root captura tudo que NÃO bateu nos paths acima
# Ex: /lawyers, /cases, /documents, /organizations, etc.

resource "aws_api_gateway_resource" "private_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "private" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.private_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "private" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.private_proxy.id
  http_method             = aws_api_gateway_method.private.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.private.invoke_arn
}

# ==========================================================
# PERMISSÕES - API Gateway precisa de permissão para invocar cada Lambda
# ==========================================================

resource "aws_lambda_permission" "apigw_public" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.public.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_private" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.private.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# ==========================================================
# CORS - OPTIONS para preflight requests
# ==========================================================
# Precisamos de CORS em todos os resources (public + private)

locals {
  all_resources = merge(local.public_resources, {
    share_links   = aws_api_gateway_resource.share_links.id
    private_proxy = aws_api_gateway_resource.private_proxy.id
  })
}

resource "aws_api_gateway_method" "options" {
  for_each = local.all_resources

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options" {
  for_each = local.all_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options" {
  for_each = local.all_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options" {
  for_each = local.all_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = aws_api_gateway_method_response.options[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# ==========================================================
# DEPLOYMENT + STAGE - Publica a API com uma URL
# ==========================================================

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  # Força novo deployment quando qualquer rota muda
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.auth,
      aws_api_gateway_resource.plans,
      aws_api_gateway_resource.webhooks,
      aws_api_gateway_resource.share_links,
      aws_api_gateway_resource.private_proxy,
      aws_api_gateway_method.public,
      aws_api_gateway_method.private,
      aws_api_gateway_method.share_links_private,
      aws_api_gateway_integration.public,
      aws_api_gateway_integration.private,
      aws_api_gateway_integration.share_links_private,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = terraform.workspace
  # URL final: https://xxxxx.execute-api.us-east-1.amazonaws.com/staging/
}
