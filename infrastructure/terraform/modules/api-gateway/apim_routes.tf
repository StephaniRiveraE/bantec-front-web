resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  api_id           = aws_apigatewayv2_api.apim_gateway.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "Cognito-Authorizer"

  jwt_configuration {
    audience = var.cognito_client_ids
    issuer   = "https://${var.cognito_endpoint}"
  }
}

# --- Integrations ---

resource "aws_apigatewayv2_integration" "apim_backend_integration" {
  api_id             = aws_apigatewayv2_api.apim_gateway.id
  integration_type   = "HTTP_PROXY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.apim_vpc_link.id
  
  # Assuming backend is exposed via ALB or direct private IP. 
  # Using a placeholder URL that should be replaced with the actual internal ALB DNS or Service Discovery endpoint.
  # For EKS, this often points to the ALB Ingress Controller's internal load balancer.
  integration_uri    = "http://apim-backend-alb" 
  integration_method = "ANY"

  request_parameters = {
    "append:header.x-origin-secret" = var.internal_secret_value
  }
}

# --- Routes ---

# Ruta 1: Transferencias
resource "aws_apigatewayv2_route" "transfers_route" {
  api_id    = aws_apigatewayv2_api.apim_gateway.id
  route_key = "POST /api/v2/switch/transfers"
  target    = "integrations/${aws_apigatewayv2_integration.apim_backend_integration.id}"

  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
  authorization_type = "JWT"
  authorization_scopes = ["https://switch-api.com/transfers.write"]
}

# Ruta 2: Compensación (Upload)
resource "aws_apigatewayv2_route" "compensation_route" {
  api_id    = aws_apigatewayv2_api.apim_gateway.id
  route_key = "POST /api/v2/compensation/upload"
  target    = "integrations/${aws_apigatewayv2_integration.apim_backend_integration.id}"

  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
  authorization_type = "JWT"
  authorization_scopes = ["https://switch-api.com/transfers.write"]
}
