output "apim_gateway_endpoint" {
  description = "The endpoint URL of the API Gateway"
  value       = aws_apigatewayv2_api.apim_gateway.api_endpoint
}

output "apim_gateway_id" {
  description = "The ID of the API Gateway"
  value       = aws_apigatewayv2_api.apim_gateway.id
}

output "apim_stage_name" {
  description = "The name of the API Gateway Stage"
  value       = aws_apigatewayv2_stage.apim_stage.name
}

output "apim_vpc_link_id" {
  description = "The ID of the VPC Link"
  value       = aws_apigatewayv2_vpc_link.apim_vpc_link.id
}

output "circuit_breaker_lambda_arn" {
  description = "ARN of the Circuit Breaker Lambda"
  value       = aws_lambda_function.circuit_breaker_handler.arn
}

output "circuit_breaker_dynamodb_table" {
  description = "Name of the Circuit Breaker DynamoDB table"
  value       = aws_dynamodb_table.circuit_breaker_state.name
}
