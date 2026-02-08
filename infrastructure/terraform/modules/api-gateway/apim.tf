
resource "aws_apigatewayv2_api" "apim_gateway" {
  name          = "apim-switch-gateway-${var.environment}"
  protocol_type = "HTTP"
  description   = "API Gateway para Switch Transaccional Bancario - HTTPS incluido"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-JWS-Signature", "X-Trace-ID"]
    max_age       = 300
  }

  tags = {
    Name        = "apim-switch-gateway-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_vpc_link" "apim_vpc_link" {
  name               = "apim-vpc-link-${var.environment}"
  security_group_ids = [var.apim_vpc_link_security_group_id]
  subnet_ids         = var.private_subnet_ids

  tags = {
    Name = "apim-vpc-link-${var.environment}"
  }
}

resource "aws_apigatewayv2_stage" "apim_stage" {
  api_id      = aws_apigatewayv2_api.apim_gateway.id
  name        = var.environment
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apim_access_logs.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      sourceIp           = "$context.identity.sourceIp"
      httpMethod         = "$context.httpMethod"
      routeKey           = "$context.routeKey"
      status             = "$context.status"
      integrationLatency = "$context.integrationLatency"
      responseLatency    = "$context.responseLatency"
    })
  }
  
  tags = {
    Environment = var.environment
  }
}
